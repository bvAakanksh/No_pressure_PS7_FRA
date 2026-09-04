"""Explainable, local FastAPI backend for the synthetic FRA demo dataset."""
from __future__ import annotations

import csv
import math
import os
import re
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Date, Float, Integer, String, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
DATA_DIR = ROOT / "data"
DB_URL = os.getenv("DATABASE_URL", f"sqlite:///{ROOT / 'fra.db'}")
AS_OF = date.fromisoformat(os.getenv("DATA_AS_OF_DATE", "2026-09-04"))
DEFAULT_WEIGHTS = {"processingDelay": 20, "rejectionPattern": 10, "landAreaMismatch": 25, "duplicateProbability": 15, "boundaryOverlap": 20, "satelliteDiscrepancy": 10}

class Base(DeclarativeBase): pass
class State(Base):
    __tablename__ = "states"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    center_lat: Mapped[float] = mapped_column(Float)
    center_lon: Mapped[float] = mapped_column(Float)
class Unit(Base):
    __tablename__ = "units"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    state_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    center_lat: Mapped[float] = mapped_column(Float)
    center_lon: Mapped[float] = mapped_column(Float)
class Claim(Base):
    __tablename__ = "claims"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    state_id: Mapped[str] = mapped_column(String, index=True)
    district_id: Mapped[str] = mapped_column(String, index=True)
    district_name: Mapped[str] = mapped_column(String, index=True)
    village: Mapped[str] = mapped_column(String, index=True)
    latitude: Mapped[float] = mapped_column(Float, index=True)
    longitude: Mapped[float] = mapped_column(Float, index=True)
    claim_type: Mapped[str] = mapped_column(String)
    rights_subtype: Mapped[str] = mapped_column(String)
    submission_date: Mapped[date] = mapped_column(Date, index=True)
    current_stage: Mapped[str] = mapped_column(String)
    last_updated_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, index=True)
    gram_sabha_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sdlc_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    dlc_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    decision_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    pending_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    appeal_status: Mapped[str | None] = mapped_column(String, nullable=True)
    appeal_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    claimed_area: Mapped[float] = mapped_column(Float)
    forest_area: Mapped[float] = mapped_column(Float)
    revenue_area: Mapped[float] = mapped_column(Float)
    forest_overlap: Mapped[float] = mapped_column(Float)
    protected_type: Mapped[str | None] = mapped_column(String, nullable=True)
    protected_overlap: Mapped[float] = mapped_column(Float)
    verification_visits: Mapped[int] = mapped_column(Integer)
    applicant_hash: Mapped[str] = mapped_column(String, index=True)
    remand_count: Mapped[int] = mapped_column(Integer)
    risk_score: Mapped[float] = mapped_column(Float, index=True)
    risk_level: Mapped[str] = mapped_column(String, index=True)
    duplicate_score: Mapped[float] = mapped_column(Float)

engine = create_engine(DB_URL, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(engine, expire_on_commit=False)

def slug(value: str) -> str: return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
def parse_date(value: str) -> date | None:
    try: return datetime.strptime(value, "%Y-%m-%d").date() if value else None
    except ValueError: return None
def num(value: str | None) -> float: return float(value) if value not in (None, "") else 0.0
def severity(score: float) -> str: return "critical" if score >= 75 else "high" if score >= 50 else "medium" if score >= 25 else "low"
def risk_level(score: float) -> str: return "high" if score >= 70 else "medium" if score >= 40 else "low"
def age(claim: Claim) -> int: return max(0, (AS_OF - claim.submission_date).days)
def ratio(claim: Claim) -> float: return abs(claim.claimed_area - claim.revenue_area) / max(claim.revenue_area, .01) * 100
def haversine(a: Claim, b: Claim) -> float:
    r=6371; p1,p2=math.radians(a.latitude),math.radians(b.latitude); dp=math.radians(b.latitude-a.latitude); dl=math.radians(b.longitude-a.longitude)
    return 2*r*math.asin(math.sqrt(math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))
def calc_score(claim: Claim, weights: dict[str,int] = DEFAULT_WEIGHTS) -> float:
    values = {"processingDelay": min(age(claim)/365,1)*100, "rejectionPattern": 100 if claim.status == "Rejected" else 30 if claim.status == "Pending" else 5,
      "landAreaMismatch": min(ratio(claim),100), "duplicateProbability": claim.duplicate_score,
      "boundaryOverlap": min(max(claim.forest_overlap,claim.protected_overlap),100), "satelliteDiscrepancy": min(abs(claim.forest_area-claim.revenue_area)/max(claim.revenue_area,.01)*100,100)}
    return round(sum(values[k]*weights[k]/100 for k in weights),1)

def seed(force: bool = False) -> dict[str, Any]:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Claim)) and not force: return {"status":"already initialized", "claims":db.scalar(select(func.count()).select_from(Claim))}
        if force:
            db.query(Claim).delete(); db.query(Unit).delete(); db.query(State).delete(); db.commit()
        # Claim-level CSV is the source of truth for corrected district names.
        # The supplied unit summary still provides centres and allocation data.
        claim_rows = list(csv.DictReader((DATA_DIR / "FRA_synthetic_443_units_44300_cases.csv").open(encoding="utf-8-sig")))
        unit_district_names = {row["assigned_unit_id"]: row["district"] for row in claim_rows}
        units = list(csv.DictReader((DATA_DIR / "FRA_unit_summary_443_units.csv").open(encoding="utf-8-sig")))
        state_centers: dict[str,list[tuple[float,float]]] = defaultdict(list)
        for row in units:
            sid=slug(row["state"]); state_centers[row["state"]].append((num(row["synthetic_center_lat"]),num(row["synthetic_center_lon"])))
            unit_id = row["assigned_unit_id"]
            db.add(Unit(id=unit_id,state_id=sid,name=unit_district_names.get(unit_id, row["district"]),center_lat=num(row["synthetic_center_lat"]),center_lon=num(row["synthetic_center_lon"])))
        for name, points in state_centers.items(): db.add(State(id=slug(name),name=name,center_lat=sum(x for x,_ in points)/len(points),center_lon=sum(y for _,y in points)/len(points)))
        db.flush()
        seen=set(); invalid=0; claims=[]
        for row in claim_rows:
            cid=row["claim_id"]
            if cid in seen: raise ValueError(f"Duplicate claim id: {cid}")
            seen.add(cid); lat,lon=num(row["latitude"]),num(row["longitude"])
            if not (-90<=lat<=90 and -180<=lon<=180): invalid+=1; continue
            claims.append(Claim(id=cid,state_id=slug(row["state"]),district_id=row["assigned_unit_id"],district_name=row["district"],village=row["village"],latitude=lat,longitude=lon,claim_type=row["claim_type"],rights_subtype=row["rights_subtype"],submission_date=parse_date(row["submission_date"]) or AS_OF,current_stage=row["current_stage"],last_updated_date=parse_date(row["last_updated_date"]) or AS_OF,status=row["status"],gram_sabha_date=parse_date(row["gram_sabha_date"]),sdlc_date=parse_date(row["sdlc_date"]),dlc_date=parse_date(row["dlc_date"]),decision_date=parse_date(row["decision_date"]),pending_reason=row["pending_reason"] or None,rejection_reason=row["rejection_reason"] or None,appeal_status=row["appeal_status"] or None,appeal_date=parse_date(row["appeal_date"]),claimed_area=num(row["claimed_area_ha"]),forest_area=num(row["forest_record_area_ha"]),revenue_area=num(row["revenue_record_area_ha"]),forest_overlap=num(row["forest_overlap_pct"]),protected_type=row["protected_area_type"] or None,protected_overlap=num(row["protected_area_overlap_pct"]),verification_visits=int(num(row["verification_visit_count"])),applicant_hash=row["applicant_hash"],remand_count=int(num(row["remand_count"])),risk_score=0,risk_level="low",duplicate_score=0))
        # Deterministic duplicate candidates: same applicant + village, area within 10%, points within 5km.
        by_hash: dict[str,list[Claim]]=defaultdict(list)
        for c in claims: by_hash[c.applicant_hash].append(c)
        for group in by_hash.values():
            for c in group:
                c.duplicate_score=max([0]+[min(100, 70 + (30*(1-abs(c.claimed_area-o.claimed_area)/max(c.claimed_area,o.claimed_area,.01)))) for o in group if o is not c and c.village==o.village and haversine(c,o)<=5])
        for c in claims: c.risk_score=calc_score(c); c.risk_level=risk_level(c.risk_score)
        db.bulk_save_objects(claims); db.commit()
        return {"status":"initialized","claims":len(claims),"units":len(units),"invalidCoordinates":invalid}

def db_ready() -> bool:
    try:
        with SessionLocal() as db: return bool(db.scalar(select(func.count()).select_from(Claim)))
    except Exception: return False
def ensure_db() -> None:
    if not db_ready(): seed()
def anomaly_types(c: Claim) -> list[str]:
    result=[]
    if age(c)>365 and c.status=="Pending": result.append("Processing Delay")
    if ratio(c)>=30: result.append("Land Mismatch")
    if c.duplicate_score>=70: result.append("Duplicate Suspect")
    if c.forest_overlap>=20: result.append("Boundary Overlap")
    if c.protected_overlap>=10: result.append("Protected Area Overlap")
    if c.status=="Rejected": result.append("Rejection Pattern")
    return result
def claim_type(c: Claim) -> str:
    if c.claim_type == "Individual": return "Individual Forest Rights (IFR)"
    return "Community Forest Resource Rights (CRR)" if "Resource" in c.rights_subtype else "Community Forest Rights (CFR)"
def breakdown(c: Claim) -> list[dict[str,Any]]:
    vals={"Processing delay":min(age(c)/365,1)*100,"Rejection pattern":100 if c.status=="Rejected" else 30 if c.status=="Pending" else 5,"Land area mismatch":min(ratio(c),100),"Duplicate probability":c.duplicate_score,"Boundary overlap":max(c.forest_overlap,c.protected_overlap),"Record discrepancy":min(abs(c.forest_area-c.revenue_area)/max(c.revenue_area,.01)*100,100)}
    keys=list(DEFAULT_WEIGHTS)
    return [{"factor":name,"scoreContribution":round(value*DEFAULT_WEIGHTS[keys[i]]/100,1),"weightPercentage":DEFAULT_WEIGHTS[keys[i]],"description":f"Observed signal: {round(value,1)}%"} for i,(name,value) in enumerate(vals.items())]
def timeline(c: Claim) -> list[dict[str,Any]]:
    stages=[("Submitted",c.submission_date),("Verification",c.gram_sabha_date),("Field Inspection",c.sdlc_date),("Committee Review",c.dlc_date),("Final Decision",c.decision_date)]
    current={"Gram Sabha":"Verification","SDLC":"Field Inspection","DLC":"Committee Review"}.get(c.current_stage,"Final Decision" if c.status!="Pending" else "Committee Review")
    return [{"stage":stage,"date":d.isoformat() if d else c.last_updated_date.isoformat(),"completed":bool(d),"current":stage==current,"notes":c.pending_reason if stage==current else None,"durationDays":(d-c.submission_date).days if d else age(c),"isDelayed":stage==current and age(c)>365,"delayReason":c.pending_reason if stage==current and age(c)>365 else None} for stage,d in stages]
def claim_out(c: Claim, include_detail: bool=True) -> dict[str,Any]:
    kinds=anomaly_types(c); ref=c.revenue_area
    output={"id":c.id,"stateId":c.state_id,"districtId":c.district_id,"districtName":c.district_name,"villageName":c.village,"applicantName":f"Synthetic applicant {c.applicant_hash[-4:]}","claimType":claim_type(c),"status":c.status,"riskScore":c.risk_score,"riskLevel":c.risk_level,"claimedAreaHectares":c.claimed_area,"referenceAreaHectares":ref,"areaMismatchPercentage":round(ratio(c),1),"forestBoundaryOverlapPercentage":c.forest_overlap,"submissionDate":c.submission_date.isoformat(),"lastUpdatedDate":c.last_updated_date.isoformat(),"anomalyStatus":"Severe Anomaly" if c.risk_score>=70 else "Boundary Overlap" if "Boundary Overlap" in kinds else "Duplicate Suspect" if "Duplicate Suspect" in kinds else "Minor Mismatch" if kinds else "Clean","coordinates":[c.latitude,c.longitude]}
    if include_detail:
        factors=kinds or ["No significant rule-based anomaly"]
        output.update({"riskFactorBreakdown":breakdown(c),"aiExplanation":{"summary":f"{c.risk_level.title()} risk based on {', '.join(factors).lower()}.","suspiciousFactors":factors,"flagReason":"Deterministic rule-based assessment of synthetic demonstration data.","confidenceScore":90},"journeyTimeline":timeline(c),"nearbyAnomalies":nearby(c)})
    return output
def nearby(c: Claim) -> list[dict[str,Any]]:
    with SessionLocal() as db: candidates=db.scalars(select(Claim).where(Claim.district_id==c.district_id,Claim.id!=c.id,Claim.risk_score>=40).limit(100)).all()
    rows=[]
    for o in candidates:
        d=haversine(c,o)
        if d<=10 and anomaly_types(o): rows.append({"claimId":o.id,"villageName":o.village,"distanceKm":round(d,2),"riskScore":o.risk_score,"anomalyType":anomaly_types(o)[0],"coordinates":[o.latitude,o.longitude]})
    return sorted(rows,key=lambda x:x["distanceKm"])[:8]

app=FastAPI(title="FRA Monitoring API",version="1.0.0",description="Synthetic-data decision support API. Risk scoring is deterministic.")
origins=[x.strip() for x in os.getenv("FRONTEND_ORIGIN","http://localhost:5173,http://localhost:8443,http://127.0.0.1:5180").split(",")]
app.add_middleware(CORSMiddleware,allow_origins=origins,allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
@app.on_event("startup")
def startup(): ensure_db()

@app.get("/")
def root():
    return {"status":"ok","message":"FRA Monitoring API is running.","frontend":"http://127.0.0.1:5173/","docs":"/docs","health":"/api/health"}

@app.get("/api/health")
def health(): return {"status":"ok","databaseInitialized":db_ready(),"dataAsOf":AS_OF.isoformat()}
@app.get("/api")
def api_root():
    """Small browser-friendly API landing response for the configured frontend base URL."""
    return {"status":"ok","message":"FRA Monitoring API is running. Open /docs for interactive documentation.","docs":"/docs","health":"/api/health"}
@app.get("/api/states")
def states():
    with SessionLocal() as db:
        records=[]
        for s in db.scalars(select(State).order_by(State.name)).all():
            cs=db.scalars(select(Claim).where(Claim.state_id==s.id)).all(); counts=Counter(x.status for x in cs)
            records.append({"id":s.id,"name":s.name,"code":s.id.upper()[:3],"center":[s.center_lat,s.center_lon],"zoom":6,"totalClaims":len(cs),"pendingClaims":counts["Pending"],"approvedClaims":counts["Approved"],"rejectedClaims":counts["Rejected"],"highRiskClaims":sum(x.risk_level=="high" for x in cs),"avgProcessingTimeDays":round(sum(age(x) for x in cs)/len(cs),1),"overallRiskScore":round(sum(x.risk_score for x in cs)/len(cs),1)})
        return records
def district_out(db: Session, u: Unit) -> dict[str,Any]:
    cs=db.scalars(select(Claim).where(Claim.district_id==u.id)).all(); counts=Counter(x.status for x in cs); total=len(cs) or 1; risk=round(sum(x.risk_score for x in cs)/total,1); kinds=Counter(k for x in cs for k in anomaly_types(x))
    return {"id":u.id,"stateId":u.state_id,"stateName":db.get(State,u.state_id).name,"name":u.name,"code":u.id,"center":[u.center_lat,u.center_lon],"totalClaims":len(cs),"pendingClaims":counts["Pending"],"approvedClaims":counts["Approved"],"rejectedClaims":counts["Rejected"],"approvalRate":round(counts["Approved"]*100/total,1),"rejectionRate":round(counts["Rejected"]*100/total,1),"pendingRate":round(counts["Pending"]*100/total,1),"avgProcessingTimeDays":round(sum(age(x) for x in cs)/total,1),"overallRiskScore":risk,"highRiskClaimsCount":sum(x.risk_level=="high" for x in cs),"riskCategory":"critical" if risk>=75 else risk_level(risk),"keyAnomalies":[x for x,_ in kinds.most_common(3)]}
@app.get("/api/districts")
def districts(stateId: str|None=None):
    with SessionLocal() as db:
        q=select(Unit).order_by(Unit.name)
        if stateId: q=q.where(Unit.state_id==stateId)
        return [district_out(db,u) for u in db.scalars(q).all()]
@app.get("/api/districts/{district_id}")
@app.get("/api/districts/{district_id}/summary")
def district(district_id: str):
    with SessionLocal() as db:
        u=db.get(Unit,district_id)
        if not u: raise HTTPException(404,"District not found")
        return district_out(db,u)
@app.get("/api/claims")
def claims(claimId:str|None=None,stateId:str|None=None,districtId:str|None=None,villageName:str|None=None,status:str|None=None,riskLevel:str|None=None,minRiskScore:float|None=Query(None,ge=0,le=100),anomalyType:str|None=None,claimType:str|None=None,startDate:str|None=None,endDate:str|None=None,limit:int=Query(1000,ge=1,le=44300)):
    with SessionLocal() as db:
        q=select(Claim)
        if claimId:q=q.where(Claim.id.contains(claimId))
        if stateId:q=q.where(Claim.state_id==stateId)
        if districtId:q=q.where(Claim.district_id==districtId)
        if villageName:q=q.where(Claim.village.contains(villageName))
        # The Claims-page labels include two workflow stages.  The source CSV
        # stores them in current_stage while the terminal outcomes use status.
        stage_filters = {
            "Under Field Inspection": "Field Verification",
            "In Committee Review": "SDLC",
        }
        if status in stage_filters:
            q=q.where(Claim.current_stage==stage_filters[status])
        elif status and status!="All":q=q.where(Claim.status==status)
        if riskLevel and riskLevel!="All":q=q.where(Claim.risk_level==riskLevel)
        if minRiskScore is not None:q=q.where(Claim.risk_score>=minRiskScore)
        if claimType:
            if claimType == "Individual": q=q.where(Claim.claim_type == "Individual")
            elif claimType == "Community": q=q.where(Claim.claim_type == "Community")
        if startDate:q=q.where(Claim.submission_date>=date.fromisoformat(startDate))
        if endDate:q=q.where(Claim.submission_date<=date.fromisoformat(endDate))
        rows=db.scalars(q.order_by(Claim.risk_score.desc()).limit(limit)).all()
        if anomalyType and anomalyType!="All":rows=[c for c in rows if anomalyType.lower() in " ".join(anomaly_types(c)).lower()]
        return [claim_out(c,False) for c in rows]
@app.get("/api/claims/{claim_id}")
def claim(claim_id:str):
    with SessionLocal() as db:
        c=db.get(Claim,claim_id)
        if not c: raise HTTPException(404,"Claim not found")
        return claim_out(c)
@app.get("/api/claims/{claim_id}/risk")
def claim_risk(claim_id:str):
    with SessionLocal() as db:
        c=db.get(Claim,claim_id)
        if not c: raise HTTPException(404,"Claim not found")
        return {"riskScore":c.risk_score,"riskLevel":c.risk_level,"riskFactorBreakdown":breakdown(c)}
@app.get("/api/claims/{claim_id}/timeline")
def claim_timeline(claim_id:str):
    with SessionLocal() as db:
        c=db.get(Claim,claim_id)
        if not c: raise HTTPException(404,"Claim not found")
        return timeline(c)
@app.get("/api/claims/{claim_id}/nearby-anomalies")
def claim_nearby(claim_id:str):
    with SessionLocal() as db:
        c=db.get(Claim,claim_id)
        if not c: raise HTTPException(404,"Claim not found")
        return nearby(c)
@app.get("/api/anomalies/clusters")
def clusters(districtId:str|None=None):
    with SessionLocal() as db:
        q=select(Claim).where(Claim.risk_score>=40)
        if districtId:q=q.where(Claim.district_id==districtId)
        groups=defaultdict(list)
        for c in db.scalars(q).all(): groups[(c.district_id,c.village)].append(c)
        result=[]
        for (did,_),cs in groups.items():
            if len(cs)<2:continue
            result.append({"id":f"cluster-{did}-{slug(cs[0].village)}","districtId":did,"districtName":cs[0].district_name,"center":[round(sum(x.latitude for x in cs)/len(cs),5),round(sum(x.longitude for x in cs)/len(cs),5)],"claimCount":len(cs),"severity":severity(sum(x.risk_score for x in cs)/len(cs)),"primaryAnomalyType":Counter(k for x in cs for k in anomaly_types(x)).most_common(1)[0][0],"avgRiskScore":round(sum(x.risk_score for x in cs)/len(cs),1),"affectedClaims":[x.id for x in cs]})
        return sorted(result,key=lambda x:x["avgRiskScore"],reverse=True)[:100]
@app.get("/api/priority-queue")
def priority_queue():
    with SessionLocal() as db:
        cs=db.scalars(select(Claim).order_by(Claim.risk_score.desc()).limit(100)).all()
        return [{"priorityRank":i,"claimId":c.id,"districtName":c.district_name,"villageName":c.village,"riskScore":c.risk_score,"riskLevel":c.risk_level,"mainAnomaly":(anomaly_types(c) or ["Review required"])[0],"ageDays":age(c),"status":c.status} for i,c in enumerate(cs,1)]
@app.get("/api/districts/{district_id}/benchmark")
def benchmark(district_id:str):
    with SessionLocal() as db:
        u=db.get(Unit,district_id)
        if not u:raise HTTPException(404,"District not found")
        d=district_out(db,u); us=db.scalars(select(Unit).where(Unit.state_id==u.state_id)).all(); allcs=[c for x in us for c in db.scalars(select(Claim).where(Claim.district_id==x.id)).all()]; n=len(allcs) or 1; co=Counter(x.status for x in allcs)
        sm={"approvalRate":round(co["Approved"]*100/n,1),"rejectionRate":round(co["Rejected"]*100/n,1),"pendingRate":round(co["Pending"]*100/n,1),"avgProcessingTimeDays":round(sum(age(x) for x in allcs)/n,1),"highRiskClaimsPercentage":round(sum(x.risk_level=="high" for x in allcs)*100/n,1)}
        dm={"approvalRate":d["approvalRate"],"rejectionRate":d["rejectionRate"],"pendingRate":d["pendingRate"],"avgProcessingTimeDays":d["avgProcessingTimeDays"],"highRiskClaimsPercentage":round(d["highRiskClaimsCount"]*100/max(d["totalClaims"],1),1)}
        return {"districtId":u.id,"districtName":u.name,"stateAvg":sm,"districtMetrics":dm,"differences":{"approvalRateDiff":round(dm["approvalRate"]-sm["approvalRate"],1),"rejectionRateDiff":round(dm["rejectionRate"]-sm["rejectionRate"],1),"pendingRateDiff":round(dm["pendingRate"]-sm["pendingRate"],1),"avgProcessingTimeDiff":round(dm["avgProcessingTimeDays"]-sm["avgProcessingTimeDays"],1),"highRiskDiff":round(dm["highRiskClaimsPercentage"]-sm["highRiskClaimsPercentage"],1)}}

@app.get("/api/analytics/historical")
def historical(groupBy:str="quarter",stateId:str|None=None,districtId:str|None=None):
    with SessionLocal() as db:
        q=select(Claim)
        if stateId:q=q.where(Claim.state_id==stateId)
        if districtId:q=q.where(Claim.district_id==districtId)
        groups=defaultdict(list)
        for c in db.scalars(q).all():
            if groupBy=="month": label=c.submission_date.strftime("%Y-%m"); stamp=date(c.submission_date.year,c.submission_date.month,1)
            elif groupBy=="year": label=str(c.submission_date.year); stamp=date(c.submission_date.year,1,1)
            else: label=f"Q{(c.submission_date.month-1)//3+1} {c.submission_date.year}"; stamp=date(c.submission_date.year,((c.submission_date.month-1)//3)*3+1,1)
            groups[(stamp,label)].append(c)
        out=[]
        for (stamp,label),cs in sorted(groups.items()):
            co=Counter(c.status for c in cs); out.append({"periodLabel":label,"date":stamp.isoformat(),"totalClaims":len(cs),"approved":co["Approved"],"rejected":co["Rejected"],"pending":co["Pending"],"avgProcessingTimeDays":round(sum(age(c) for c in cs)/len(cs),1),"highRiskClaims":sum(c.risk_level=="high" for c in cs)})
        return out
@app.get("/api/analytics/compare-periods")
def compare(periodA:str,periodB:str):
    points={x["periodLabel"]:x for x in historical()}
    if periodA not in points or periodB not in points:raise HTTPException(400,"Unknown period label")
    def value(p):
        return {"label":p["periodLabel"],"approvalRate":round(p["approved"]*100/max(p["totalClaims"],1),1),"rejectionRate":round(p["rejected"]*100/max(p["totalClaims"],1),1),"pendingClaims":p["pending"],"avgProcessingTimeDays":p["avgProcessingTimeDays"],"highRiskClaims":p["highRiskClaims"]}
    return {"periodA":value(points[periodA]),"periodB":value(points[periodB])}
@app.get("/api/analytics/land-mismatches")
def land_mismatches():
    with SessionLocal() as db:
        cs=db.scalars(select(Claim).where(Claim.risk_score>=0)).all(); result=[]
        for c in cs:
            pct=ratio(c)
            if pct>=30:result.append({"claimId":c.id,"districtName":c.district_name,"villageName":c.village,"claimedAreaHectares":c.claimed_area,"referenceAreaHectares":c.revenue_area,"differenceHectares":round(c.claimed_area-c.revenue_area,2),"mismatchPercentage":round(pct,1),"severity":severity(pct),"surveyNumber":f"SYN-{c.id[-5:]}","status":c.status})
        return sorted(result,key=lambda x:x["mismatchPercentage"],reverse=True)[:500]
@app.get("/api/analytics/boundary-overlaps")
def boundary_overlaps():
    with SessionLocal() as db:
        result=[]
        for c in db.scalars(select(Claim).where(Claim.forest_overlap>=20)).all():
            result.append({"claimId":c.id,"districtName":c.district_name,"villageName":c.village,"claimedAreaHectares":c.claimed_area,"forestBoundaryType":c.protected_type or "Synthetic Forest Record Boundary","overlapPercentage":c.forest_overlap,"status":"Prohibited Overlap" if c.protected_overlap>=10 else "Conditional Boundary","severity":severity(c.forest_overlap)})
        return sorted(result,key=lambda x:x["overlapPercentage"],reverse=True)[:500]
@app.get("/api/analytics/duplicate-claims")
def duplicates():
    with SessionLocal() as db:
        cs=db.scalars(select(Claim).where(Claim.duplicate_score>=70)).all(); pairs=[]; used=set()
        by_hash=defaultdict(list)
        for c in cs:by_hash[c.applicant_hash].append(c)
        for group in by_hash.values():
            for i,a in enumerate(group):
                for b in group[i+1:]:
                    if a.village!=b.village or haversine(a,b)>5:continue
                    key=tuple(sorted((a.id,b.id)))
                    if key in used:continue
                    used.add(key); similarity=round(min(a.duplicate_score,b.duplicate_score),1)
                    pairs.append({"id":"dup-"+"-".join(key),"claimA":{"id":a.id,"applicant":f"Synthetic applicant {a.applicant_hash[-4:]}","village":a.village,"areaHectares":a.claimed_area,"coordinates":[a.latitude,a.longitude]},"claimB":{"id":b.id,"applicant":f"Synthetic applicant {b.applicant_hash[-4:]}","village":b.village,"areaHectares":b.claimed_area,"coordinates":[b.latitude,b.longitude]},"similarityPercentage":similarity,"matchingFactors":["Same anonymized applicant hash","Same village","Nearby coordinates","Comparable claimed area"],"status":"Flagged for Review"})
        return sorted(pairs,key=lambda x:x["similarityPercentage"],reverse=True)[:500]

class RiskWeights(BaseModel):
    processingDelay:int=Field(ge=0,le=100); rejectionPattern:int=Field(ge=0,le=100); landAreaMismatch:int=Field(ge=0,le=100); duplicateProbability:int=Field(ge=0,le=100); boundaryOverlap:int=Field(ge=0,le=100); satelliteDiscrepancy:int=Field(ge=0,le=100)
    @field_validator("satelliteDiscrepancy")
    @classmethod
    def total(cls,v,info):
        if sum(list(info.data.values())+[v])!=100:raise ValueError("Risk weights must sum to 100")
        return v
@app.post("/api/risk-weights")
def update_weights(weights:RiskWeights):
    global DEFAULT_WEIGHTS
    DEFAULT_WEIGHTS=weights.model_dump()
    with SessionLocal() as db:
        for c in db.scalars(select(Claim)).all():c.risk_score=calc_score(c,DEFAULT_WEIGHTS);c.risk_level=risk_level(c.risk_score)
        db.commit()
    return {"success":True,"updatedWeights":DEFAULT_WEIGHTS}
@app.post("/api/natural-language-query")
def nlu(body:dict[str,str]):
    query=body.get("query","").strip(); lower=query.lower(); filters={}
    with SessionLocal() as db:
        states_list=db.scalars(select(State)).all(); units=db.scalars(select(Unit)).all()
        for s in states_list:
            if s.name.lower() in lower:filters["state"]=s.id
        for u in units:
            if u.name.lower() in lower or u.name.lower().replace(" fra monitoring unit "," ") in lower:filters["district"]=u.id
        if "critical" in lower: filters["minRiskScore"]=85
        elif "high risk" in lower or "high-risk" in lower:filters["minRiskScore"]=70
        elif "medium risk" in lower or "medium-risk" in lower:filters["riskLevel"]="medium"
        elif "low risk" in lower or "low-risk" in lower:filters["riskLevel"]="low"
        if "pending" in lower:filters["status"]="Pending"
        if "rejected" in lower:filters["status"]="Rejected"
        if any(term in lower for term in ("individual claim", "individual forest right", " ifr")): filters["claimType"]="Individual"
        elif any(term in lower for term in ("community claim", "community forest", " cfr", " crr")): filters["claimType"]="Community"
        q=select(Claim)
        if filters.get("state"):q=q.where(Claim.state_id==filters["state"])
        if filters.get("district"):q=q.where(Claim.district_id==filters["district"])
        if filters.get("status"):q=q.where(Claim.status==filters["status"])
        if filters.get("minRiskScore"):q=q.where(Claim.risk_score>=filters["minRiskScore"])
        if filters.get("riskLevel"):q=q.where(Claim.risk_level==filters["riskLevel"])
        if filters.get("claimType"):q=q.where(Claim.claim_type==filters["claimType"])
        matching_count=db.scalar(select(func.count()).select_from(q.subquery())) or 0
        # A concise, deterministic answer based only on the filtered synthetic
        # records. It doubles as a map-filter explanation and stays under 50 words.
        summary_rows=db.scalars(q).all()
        rows=summary_rows[:1000]
        state_name = next((s.name for s in states_list if s.id == filters.get("state")), None)
        district_name = next((u.name for u in units if u.id == filters.get("district")), None)
    if not filters:
        summary = f"This synthetic FRA dataset contains {matching_count:,} claims. Ask for a state, district, status, risk level, individual claim, or community claim to receive a focused summary and map view."
    elif not summary_rows:
        summary = "No synthetic FRA claims match that request. Try a different state, district, status, claim type, or risk level."
    else:
        scope=[]
        if filters.get("minRiskScore") == 85: scope.append("critical-risk")
        elif filters.get("minRiskScore") == 70: scope.append("high-risk")
        elif filters.get("riskLevel"): scope.append(f"{filters['riskLevel']}-risk")
        if filters.get("status"): scope.append(filters["status"].lower())
        if filters.get("claimType"): scope.append(filters["claimType"].lower())
        scope.append("claims")
        location = district_name or state_name
        if location: scope.append(f"in {location}")
        statuses=Counter(c.status for c in summary_rows)
        avg_risk=sum(c.risk_score for c in summary_rows)/matching_count
        status_text=", ".join(f"{count} {label.lower()}" for label,count in statuses.most_common(3))
        summary=(f"Found {matching_count:,} {' '.join(scope)}. Average risk is {avg_risk:.1f}/100; "
                 f"{status_text}. The map shows these matching locations.")
    return {"query":query,"interpretedFilters":filters,"matchedCount":matching_count,"matchingClaimIds":[c.id for c in rows],"summaryMessage":summary}
