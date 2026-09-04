import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { INDIA_STATES_GEOJSON, CHHATTISGARH_DISTRICTS_GEOJSON } from '../../data/mockGeoJSON';
import { StateData, DistrictData, Claim, AnomalyCluster } from '../../types/schemas';
import MapLegend from './MapLegend';

// Fix default leaflet icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

interface FRAMapProps {
  selectedState?: StateData | null;
  selectedDistrict?: DistrictData | null;
  selectedClaimId?: string | null;
  claims?: Claim[];
  clusters?: AnomalyCluster[];
  onSelectState?: (stateId: string) => void;
  onSelectDistrict?: (districtId: string) => void;
  onSelectClaim?: (claimId: string) => void;
  showClusters?: boolean;
  height?: number;
}

// Controller component to invalidate size and smoothly update map view on state/district change
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // Force Leaflet to recalculate container bounds on render/resize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    map.flyTo(center, zoom, { duration: 1.2 });
    return () => clearTimeout(timer);
  }, [center, zoom, map]);
  return null;
}

export default function FRAMap({
  selectedState,
  selectedDistrict,
  selectedClaimId,
  claims = [],
  clusters = [],
  onSelectState,
  onSelectDistrict,
  onSelectClaim,
  showClusters = false,
  height = 580,
}: FRAMapProps) {
  // Center defaults to India national view
  const defaultCenter: [number, number] = [21.5000, 80.0000];
  const defaultZoom = 5;

  const currentCenter: [number, number] = selectedDistrict
    ? selectedDistrict.center
    : selectedState
    ? selectedState.center
    : defaultCenter;

  const currentZoom = selectedDistrict ? 9 : selectedState ? selectedState.zoom : defaultZoom;

  const getRiskColor = (score: number) => {
    if (score >= 85) return '#7e22ce'; // purple
    if (score >= 70) return '#f43f5e'; // rose
    if (score >= 40) return '#f59e0b'; // amber
    return '#10b981'; // emerald
  };

  // The bundled GeoJSON is intentionally incomplete (only a handful of demo
  // shapes). Keep it as an invisible click target; the basemap is the single,
  // consistent source of visible administrative boundaries.
  const stateStyle = (feature: any) => {
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: 'transparent',
      opacity: 0,
      weight: 0,
    };
  };

  const districtStyle = (feature: any) => {
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: 'transparent',
      opacity: 0,
      weight: 0,
    };
  };

  const onEachState = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => {
        if (onSelectState) {
          onSelectState(feature.id);
        }
      },
    });
  };

  const onEachDistrict = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => {
        if (onSelectDistrict) {
          onSelectDistrict(feature.id);
        }
      },
    });
  };

  return (
    <div className="relative w-full h-[580px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 z-10" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ height: `${height}px`, width: '100%' }}
      >
        <MapController center={currentCenter} zoom={currentZoom} />

        {/* Standard clean topographic map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render State Polygons when at national view */}
        {!selectedState && (
          <GeoJSON
            data={INDIA_STATES_GEOJSON as any}
            style={stateStyle}
            onEachFeature={onEachState}
          />
        )}

        {/* The supplied mock district GeoJSON only covers Chhattisgarh. Do not
            render those districts over a different selected state. */}
        {selectedState?.id === 'st-cg' && (
          <GeoJSON
            key={selectedState.id}
            data={CHHATTISGARH_DISTRICTS_GEOJSON as any}
            style={districtStyle}
            onEachFeature={onEachDistrict}
          />
        )}

        {/* Render Individual Claim Markers */}
        {claims.map((claim) => {
          const isSelected = claim.id === selectedClaimId;
          return (
            <CircleMarker
              key={claim.id}
              center={claim.coordinates}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                fillColor: getRiskColor(claim.riskScore),
                color: isSelected ? '#1e1b4b' : '#ffffff',
                weight: isSelected ? 3 : 1.5,
                fillOpacity: 0.9,
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectClaim) onSelectClaim(claim.id);
                },
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-2">
                    <span>{claim.id}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                      style={{ backgroundColor: getRiskColor(claim.riskScore) }}
                    >
                      Risk {claim.riskScore}
                    </span>
                  </div>
                  <p className="text-slate-600">Applicant: <strong>{claim.applicantName}</strong></p>
                  <p className="text-slate-600">Village: {claim.villageName}, {claim.districtName}</p>
                  <p className="text-slate-600">Claimed Area: {claim.claimedAreaHectares} Ha</p>
                  <p className="text-slate-600 font-medium">Status: {claim.status}</p>
                  {onSelectClaim && (
                    <button
                      onClick={() => onSelectClaim(claim.id)}
                      className="w-full mt-1 bg-slate-900 text-white text-[11px] py-1 px-2 rounded hover:bg-slate-800 transition cursor-pointer"
                    >
                      View Claim Details
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Render Anomaly Cluster Hotspots when active */}
        {showClusters &&
          clusters.map((cluster) => (
            <CircleMarker
              key={cluster.id}
              center={cluster.center}
              radius={18 + Math.min(cluster.claimCount / 2, 12)}
              pathOptions={{
                fillColor: cluster.severity === 'critical' ? '#dc2626' : '#f59e0b',
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.45,
                dashArray: '4',
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-rose-700 flex items-center justify-between">
                    <span>{cluster.districtName} Hotspot</span>
                    <span className="uppercase text-[10px] px-1 bg-rose-100 text-rose-800 rounded">{cluster.severity}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{cluster.primaryAnomalyType}</p>
                  <p className="text-slate-600">Suspicious Claims: {cluster.claimCount}</p>
                  <p className="text-slate-600">Avg Risk Score: {cluster.avgRiskScore}/100</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Floating Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000]">
        <MapLegend />
      </div>

      {/* Re-center / Reset View Button */}
      {(selectedState || selectedDistrict) && (
        <button
          onClick={() => {
            if (selectedDistrict && onSelectState && selectedState) {
              onSelectDistrict('');
            } else if (onSelectState) {
              onSelectState('');
            }
          }}
          className="absolute top-3 right-3 z-[1000] bg-white/95 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
        >
          <span>← Zoom Out View</span>
        </button>
      )}
    </div>
  );
}
