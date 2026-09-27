import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  MapRef,
} from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import type { FeatureCollection, Feature, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sparkles, X, Maximize2, Minimize2, MapPin, AlertTriangle, CheckCircle, Clock, Search, Loader2, BarChart3, Users } from 'lucide-react';
import { getStates, getDistricts, getClaim, naturalLanguageQuery } from '../../services/api';
import { StateData, DistrictData, Claim, AnomalyCluster, NaturalLanguageQueryResult } from '../../types/schemas';
import { INDIA_STATES_GEOJSON, CHHATTISGARH_DISTRICTS_GEOJSON } from '../../data/mockGeoJSON';
import MapLegend from './MapLegend';


// ---------------------------------------------------------------------------
// MapTiler style URL — uses env var with OpenFreeMap public fallback
// ---------------------------------------------------------------------------
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
const MAP_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`
  : 'https://tiles.openfreemap.org/styles/dark';

// [west, south, east, north] — kept as reference but not applied as maxBounds
// (maxBounds prevents zoom-out needed to see all of India in small containers)
const INDIA_SOFT_BOUNDS: [number, number, number, number] = [60, 4, 100, 40];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FRAMapProps {
  selectedState?: StateData | null;
  selectedDistrict?: DistrictData | null;
  viewCenter?: [number, number];
  viewZoom?: number;
  selectedClaimId?: string | null;
  claims?: Claim[];
  clusters?: AnomalyCluster[];
  onSelectState?: (stateId: string) => void;
  onSelectDistrict?: (districtId: string) => void;
  onSelectClaim?: (claimId: string) => void;
  showClusters?: boolean;
  height?: number;
  filterBadge?: string | null;
  onResetFilter?: () => void;
  onExecuteQuery?: (query: string) => Promise<void>;
  filterSummaryMessage?: string | null;
}

interface PopupInfo {
  longitude: number;
  latitude: number;
  content: React.ReactNode;
}

const GEOJSON_STATE_IDS: Record<string, string> = {
  'st-cg': 'chhattisgarh',
  'st-od': 'odisha',
  'st-mp': 'madhya-pradesh',
  'st-jh': 'jharkhand',
  'st-mh': 'maharashtra',
};

// ---------------------------------------------------------------------------
// Risk colour helpers
// ---------------------------------------------------------------------------
function getRiskColor(score: number): string {
  if (score >= 85) return '#7e22ce';
  if (score >= 70) return '#f43f5e';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
}

// Build a MapLibre expression that maps status → colour
const STATUS_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'status'],
  'Approved', '#10b981', // Emerald for Approved
  'Rejected', '#f43f5e', // Rose for Rejected
  'Pending', '#f59e0b',  // Amber for Pending
  '#cbd5e1'              // Default fallback
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function FRAMap({
  selectedState,
  selectedDistrict,
  viewCenter,
  viewZoom,
  selectedClaimId,
  claims = [],
  clusters = [],
  onSelectState,
  onSelectDistrict,
  onSelectClaim,
  showClusters = false,
  height = 580,
  filterBadge,
  onResetFilter,
  onExecuteQuery,
  filterSummaryMessage,
}: FRAMapProps) {
  const mapRef = useRef<MapRef>(null);
  const fsMapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChoropleth, setIsChoropleth] = useState(false);

  // ---- Fullscreen side panel state ----
  type PanelData =
    | { type: 'state'; data: StateData }
    | { type: 'district'; data: DistrictData }
    | { type: 'claim'; data: Claim };
  const [fsPanel, setFsPanel] = useState<PanelData | null>(null);
  const [fsPanelLoading, setFsPanelLoading] = useState(false);

  // ---- Fullscreen floating search bar state ----
  const [fsQuery, setFsQuery] = useState('');
  const [fsSearching, setFsSearching] = useState(false);
  const fsSearchInputRef = useRef<HTMLInputElement>(null);

  // Close fullscreen on ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset fullscreen map to full-India view when opened
  useEffect(() => {
    if (!isFullscreen) return;
    const timer = setTimeout(() => {
      fsMapRef.current?.getMap()?.flyTo({
        center: [78.96, 22.35],
        zoom: 4.2,
        duration: 900,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Default India view — geographic centre of India, zoom out enough to see the whole subcontinent
  const defaultCenter: [number, number] = [78.96, 22.35];
  const defaultZoom = 3.8;

  // Compute target center/zoom from props
  const targetCenter: [number, number] = selectedDistrict
    ? [selectedDistrict.center[1], selectedDistrict.center[0]]   // [lng, lat]
    : selectedState
    ? [selectedState.center[1], selectedState.center[0]]
    : viewCenter
    ? [viewCenter[1], viewCenter[0]]
    : defaultCenter;

  const targetZoom = selectedDistrict
    ? 9
    : selectedState
    ? selectedState.zoom
    : viewZoom || defaultZoom;

  // Fly to new target when state/district/region changes
  useEffect(() => {
    const maps = [mapRef.current?.getMap(), fsMapRef.current?.getMap()].filter(Boolean);
    if (!maps.length || !mapLoaded) return;

    const shouldFit =
      claims.length > 0 &&
      (selectedState || selectedDistrict || viewCenter || filterBadge);

    maps.forEach(map => {
      if (!map) return;
      if (shouldFit) {
        // Compute bounds from claims
        const lngs = claims.map((c) => c.coordinates[1]);
        const lats = claims.map((c) => c.coordinates[0]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        // Single point or very tight cluster → flyTo
        if (Math.abs(maxLat - minLat) < 0.005 && Math.abs(maxLng - minLng) < 0.005) {
          map.flyTo({ center: [lngs[0], lats[0]], zoom: Math.max(targetZoom, 9), duration: 1200 });
        } else {
          map.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 48, maxZoom: 11, duration: 1200 }
          );
        }
      } else {
        map.flyTo({ center: targetCenter, zoom: targetZoom, duration: 1200 });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState?.id, selectedDistrict?.id, viewCenter, viewZoom, filterBadge, mapLoaded, isFullscreen]);

  // ------------------------------------------------------------------
  // Fullscreen panel fetcher — called when user clicks in FS mode
  // ------------------------------------------------------------------
  const openFsPanel = useCallback(async (type: 'state' | 'district' | 'claim', id: string) => {
    setFsPanel(null);
    setFsPanelLoading(true);
    try {
      if (type === 'state') {
        const states = await getStates();
        const found = states.find((s) => s.id === id);
        if (found) setFsPanel({ type: 'state', data: found });
      } else if (type === 'district') {
        const districts = await getDistricts();
        const found = districts.find((d) => d.id === id);
        if (found) setFsPanel({ type: 'district', data: found });
      } else {
        const claim = await getClaim(id);
        if (claim) setFsPanel({ type: 'claim', data: claim });
      }
    } catch {
      // silently ignore
    } finally {
      setFsPanelLoading(false);
    }
  }, []);

  // Fullscreen NLQ search is handled by onExecuteQuery prop

  // ------------------------------------------------------------------
  // Build GeoJSON FeatureCollections for MapLibre Sources
  // ------------------------------------------------------------------
  const claimsGeoJSON = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: claims.map((claim): Feature => ({
      type: 'Feature',
      id: claim.id,
      geometry: {
        type: 'Point',
        coordinates: [claim.coordinates[1], claim.coordinates[0]],
      } as Point,
      properties: {
        id: claim.id,
        riskScore: claim.riskScore,
        applicantName: claim.applicantName,
        villageName: claim.villageName,
        districtName: claim.districtName,
        claimedAreaHectares: claim.claimedAreaHectares,
        status: claim.status,
        isSelected: claim.id === selectedClaimId,
      },
    })),
  }), [claims, selectedClaimId]);

  const clustersGeoJSON = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: clusters.map((cl): Feature => ({
      type: 'Feature',
      id: cl.id,
      geometry: {
        type: 'Point',
        coordinates: [cl.center[1], cl.center[0]],
      } as Point,
      properties: {
        id: cl.id,
        districtName: cl.districtName,
        severity: cl.severity,
        claimCount: cl.claimCount,
        avgRiskScore: cl.avgRiskScore,
        primaryAnomalyType: cl.primaryAnomalyType,
        radius: 18 + Math.min(cl.claimCount / 2, 12),
      },
    })),
  }), [clusters]);

  const statesChoroplethGeoJSON = useMemo(() => {
    const stateStats: Record<string, { total: number; rejected: number }> = {};
    claims.forEach((c) => {
      if (!stateStats[c.stateId]) stateStats[c.stateId] = { total: 0, rejected: 0 };
      stateStats[c.stateId].total++;
      if (c.status === 'Rejected') stateStats[c.stateId].rejected++;
    });

    const fc = JSON.parse(JSON.stringify(INDIA_STATES_GEOJSON)) as FeatureCollection;
    fc.features.forEach((feat) => {
      const stateId = GEOJSON_STATE_IDS[feat.id as string] || (feat.id as string);
      const stats = stateStats[stateId];
      const rate = stats && stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;
      feat.properties = { ...feat.properties, rejectionRate: rate };
    });
    return fc;
  }, [claims]);

  // ------------------------------------------------------------------
  // Click handlers
  // ------------------------------------------------------------------
  const handleClaimClick = useCallback(
    (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      const coords = (feat.geometry as Point).coordinates as [number, number];

      setPopupInfo({
        longitude: coords[0],
        latitude: coords[1],
        content: (
          <div className="p-1 space-y-1 text-xs min-w-[180px]">
            <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-2">
              <span>{props.id}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                style={{ backgroundColor: getRiskColor(props.riskScore) }}
              >
                Risk {props.riskScore}
              </span>
            </div>
            <p className="text-slate-600">Applicant: <strong>{props.applicantName}</strong></p>
            <p className="text-slate-600">Village: {props.villageName}, {props.districtName}</p>
            <p className="text-slate-600">Claimed Area: {props.claimedAreaHectares} Ha</p>
            <p className="text-slate-600 font-medium">Status: {props.status}</p>
            {onSelectClaim && (
              <button
                onClick={() => { onSelectClaim(props.id); setPopupInfo(null); }}
                className="w-full mt-1 bg-slate-900 text-white text-[11px] py-1 px-2 rounded hover:bg-slate-800 transition cursor-pointer"
              >
                View Claim Details
              </button>
            )}
          </div>
        ),
      });

      if (onSelectClaim) onSelectClaim(props.id);
    },
    [onSelectClaim]
  );

  const handleClusterClick = useCallback(
    (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      const coords = (feat.geometry as Point).coordinates as [number, number];

      setPopupInfo({
        longitude: coords[0],
        latitude: coords[1],
        content: (
          <div className="p-1 space-y-1 text-xs min-w-[170px]">
            <div className="font-bold text-rose-700 flex items-center justify-between">
              <span>{props.districtName} Hotspot</span>
              <span className="uppercase text-[10px] px-1 bg-rose-100 text-rose-800 rounded">
                {props.severity}
              </span>
            </div>
            <p className="text-slate-700 font-medium">{props.primaryAnomalyType}</p>
            <p className="text-slate-600">Suspicious Claims: {props.claimCount}</p>
            <p className="text-slate-600">Avg Risk Score: {props.avgRiskScore}/100</p>
          </div>
        ),
      });
    },
    []
  );

  const handleStateClick = useCallback(
    (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length || !onSelectState) return;
      const feat = e.features[0];
      const id = feat.id as string;
      onSelectState(GEOJSON_STATE_IDS[id] || id);
    },
    [onSelectState]
  );

  const handleDistrictClick = useCallback(
    (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length || !onSelectDistrict) return;
      const feat = e.features[0];
      onSelectDistrict(feat.id as string);
    },
    [onSelectDistrict]
  );

  // Cursor pointer on hover for interactive layers
  const handleMouseEnter = useCallback((e: maplibregl.MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = 'pointer';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = '';
  }, []);

  // ------------------------------------------------------------------
  // Layer specs (defined outside JSX for stability)
  // ------------------------------------------------------------------
  const claimsCircleLayer: maplibregl.CircleLayerSpecification = {
    id: 'claims-circle',
    type: 'circle',
    source: 'claims',
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'isSelected'], true], 11,
        7,
      ],
      'circle-color': STATUS_COLOR_EXPR,
      'circle-opacity': 0.92,
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'isSelected'], true], 3,
        1.5,
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'isSelected'], true], '#1e1b4b',
        '#ffffff',
      ],
    },
  };

  const statesFillLayer: maplibregl.FillLayerSpecification = {
    id: 'states-fill',
    type: 'fill',
    source: 'states',
    paint: {
      'fill-color': isChoropleth ? [
        'interpolate',
        ['linear'],
        ['get', 'rejectionRate'],
        0, '#1e293b',
        25, '#7f1d1d',
        50, '#dc2626',
        100, '#ef4444'
      ] : '#cbd5e1',
      'fill-opacity': isChoropleth ? 0.65 : 0.08,
    },
  };

  const statesLineLayer: maplibregl.LineLayerSpecification = {
    id: 'states-line',
    type: 'line',
    source: 'states',
    paint: {
      'line-color': '#64748b',
      'line-opacity': 0.7,
      'line-width': 1,
    },
  };

  const districtsFillLayer: maplibregl.FillLayerSpecification = {
    id: 'districts-fill',
    type: 'fill',
    source: 'districts',
    paint: {
      'fill-color': '#94a3b8',
      'fill-opacity': 0.06,
    },
  };

  const districtsLineLayer: maplibregl.LineLayerSpecification = {
    id: 'districts-line',
    type: 'line',
    source: 'districts',
    paint: {
      'line-color': '#475569',
      'line-opacity': 0.75,
      'line-width': 1,
    },
  };

  const clusterFillLayer: maplibregl.CircleLayerSpecification = {
    id: 'clusters-circle',
    type: 'circle',
    source: 'clusters',
    paint: {
      'circle-radius': ['get', 'radius'],
      'circle-color': [
        'case',
        ['==', ['get', 'severity'], 'critical'], '#dc2626',
        '#f59e0b',
      ],
      'circle-opacity': 0.45,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  };

  // Shared map JSX — reused in both normal and fullscreen views
  const mapJSX = (ref: React.RefObject<MapRef | null>, fsMode: boolean) => (
    <Map
      ref={ref}
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      initialViewState={{
        longitude: defaultCenter[0],
        latitude: defaultCenter[1],
        zoom: fsMode ? 4.2 : defaultZoom,
      }}
      maxBounds={INDIA_SOFT_BOUNDS}
      minZoom={3}
      scrollZoom={{ around: 'center' }}
      cooperativeGestures={!fsMode}          // In fullscreen scroll always zooms
      style={{ width: '100%', height: '100%' }}
      onLoad={() => { if (!fsMode) setMapLoaded(true); }}
      onDblClick={() => { if (!fsMode) setIsFullscreen(true); }}
      interactiveLayerIds={[
        'claims-circle',
        ...(showClusters ? ['clusters-circle'] : []),
        ...(!selectedState ? ['states-fill'] : []),
        ...(selectedState?.id === 'chhattisgarh' ? ['districts-fill'] : []),
      ]}
      onClick={(e) => {
        const features = e.features;
        if (!features?.length) { setPopupInfo(null); return; }
        const topLayer = features[0].layer?.id;
        const feat = features[0];
        if (topLayer === 'claims-circle') {
          handleClaimClick(e as any);
          if (fsMode) openFsPanel('claim', feat.properties?.id as string);
        } else if (topLayer === 'clusters-circle') {
          handleClusterClick(e as any);
        } else if (topLayer === 'states-fill') {
          handleStateClick(e as any);
          if (fsMode) openFsPanel('state', GEOJSON_STATE_IDS[feat.id as string] || feat.id as string);
        } else if (topLayer === 'districts-fill') {
          handleDistrictClick(e as any);
          if (fsMode) openFsPanel('district', feat.id as string);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {!selectedState && (
        <Source id="states" type="geojson" data={isChoropleth ? statesChoroplethGeoJSON as any : INDIA_STATES_GEOJSON as any}>
          <Layer {...statesFillLayer} />
          <Layer {...statesLineLayer} />
        </Source>
      )}

      {selectedState?.id === 'chhattisgarh' && (
        <Source id="districts" type="geojson" data={CHHATTISGARH_DISTRICTS_GEOJSON as any}>
          <Layer {...districtsFillLayer} />
          <Layer {...districtsLineLayer} />
        </Source>
      )}

      {claims.length > 0 && (
        <Source id="claims" type="geojson" data={claimsGeoJSON}>
          <Layer {...claimsCircleLayer} />
        </Source>
      )}

      {showClusters && clusters.length > 0 && (
        <Source id="clusters" type="geojson" data={clustersGeoJSON}>
          <Layer {...clusterFillLayer} />
        </Source>
      )}

      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          anchor="bottom"
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
          maxWidth="240px"
        >
          {popupInfo.content}
        </Popup>
      )}
    </Map>
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <>
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-xs bg-slate-900 z-10 group"
      style={{ height }}
    >
      {/* Floating Filter Badge */}
      {filterBadge && (
        <div className="absolute top-3 left-3 z-[10] bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-md flex items-center gap-2 text-xs">
          <Sparkles className="size-3.5 text-indigo-400 shrink-0" />
          <span className="font-medium truncate max-w-xs">{filterBadge}</span>
          {onResetFilter && (
            <button
              onClick={onResetFilter}
              className="ml-1 p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
              title="Reset filter"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* Toggle Controls */}
      <div className="absolute top-3 right-14 z-[10] flex items-center gap-2">
        <button
          onClick={() => setIsChoropleth(!isChoropleth)}
          className={`px-3 py-1.5 rounded-lg border shadow-sm text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
            isChoropleth 
              ? 'bg-rose-900/90 text-rose-200 border-rose-700/50 hover:bg-rose-800' 
              : 'bg-white/95 text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="size-3.5" />
          <span>{isChoropleth ? 'Heatmap: On' : 'Heatmap: Off'}</span>
        </button>

        {/* Zoom Out Button */}
        {(selectedState || selectedDistrict || viewCenter) && (
          <button
            onClick={() => {
              if (selectedDistrict && onSelectDistrict) {
                onSelectDistrict('');
              } else if (onSelectState) {
                onSelectState('');
              }
            }}
            className="bg-white/95 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>← Zoom Out View</span>
          </button>
        )}
      </div>

      {/* Fullscreen Expand Button */}
      <button
        onClick={() => setIsFullscreen(true)}
        title="Expand to fullscreen (or double-click map)"
        className="absolute top-3 right-3 z-[10] bg-slate-800/90 hover:bg-slate-700 text-white backdrop-blur-md p-2 rounded-lg border border-slate-600 shadow-md transition-all duration-200 cursor-pointer opacity-70 group-hover:opacity-100"
      >
        <Maximize2 className="size-4" />
      </button>

      {/* Double-click hint */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[10] pointer-events-none">
        <span className="text-[10px] text-white/30 bg-black/20 px-2 py-0.5 rounded-full whitespace-nowrap">
          Double-click to expand
        </span>
      </div>

      {mapJSX(mapRef, false)}

      {/* Floating Legend */}
      <div className="absolute bottom-3 left-3 z-[10]">
        <MapLegend />
      </div>
    </div>

    {/* ------------------------------------------------------------------ */}
    {/* Fullscreen overlay portal                                           */}
    {/* ------------------------------------------------------------------ */}
    {isFullscreen && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex flex-col bg-slate-950"
        style={{ animation: 'fsMapIn 220ms ease-out both' }}
      >
        <style>{`
          @keyframes fsMapIn {
            from { opacity: 0; transform: scale(0.97); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes panelSlideIn {
            from { opacity: 0; transform: translateX(24px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-[20] flex items-center justify-between px-4 py-3 bg-gradient-to-b from-slate-950/95 to-transparent pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm tracking-wide">🌿 FRA Claims — India Map</span>
            {filterBadge && (
              <span className="text-xs text-indigo-300 bg-indigo-900/60 border border-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="size-3" />{filterBadge}
              </span>
            )}

          </div>
          <button
            onClick={() => { setIsFullscreen(false); setFsPanel(null); }}
            className="pointer-events-auto flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-600 transition cursor-pointer"
          >
            <Minimize2 className="size-3.5" />
            <span>Exit Fullscreen</span>
            <kbd className="ml-1 text-[10px] text-slate-400 bg-slate-700 px-1 py-0.5 rounded">ESC</kbd>
          </button>
        </div>

        {/* Map + Panel layout */}
        <div className="flex w-full h-full">
          {/* Map area */}
          <div className="flex-1 relative h-full">
            {mapJSX(fsMapRef, true)}

            {/* Legend */}
            <div className="absolute bottom-20 left-4 z-[10]">
              <MapLegend />
            </div>

            {/* Click hint */}
            {!fsPanel && !fsPanelLoading && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[10] pointer-events-none">
                <span className="text-[11px] text-white/40 bg-slate-900/60 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap border border-slate-700/40">
                  Click any marker or region to see details
                </span>
              </div>
            )}

            {/* Loading indicator */}
            {fsPanelLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-[15] pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md rounded-xl px-5 py-3 flex items-center gap-2 border border-slate-700">
                  <Loader2 className="size-4 text-indigo-400 animate-spin" />
                  <span className="text-white text-sm">Loading details…</span>
                </div>
              </div>
            )}
          </div>

          {/* ---- Right Detail Panel ---- */}
          {fsPanel && (
            <div
              className="w-[360px] shrink-0 h-full bg-slate-900/95 backdrop-blur-md border-l border-slate-700 flex flex-col overflow-hidden"
              style={{ animation: 'panelSlideIn 250ms ease-out both' }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-indigo-400" />
                  <span className="text-white font-semibold text-sm">
                    {fsPanel.type === 'state' ? fsPanel.data.name
                      : fsPanel.type === 'district' ? `${fsPanel.data.name} District`
                      : `Claim ${fsPanel.data.id}`}
                  </span>
                </div>
                <button
                  onClick={() => setFsPanel(null)}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">

                {/* ---- STATE PANEL ---- */}
                {fsPanel.type === 'state' && (() => {
                  const s = fsPanel.data;
                  const approvalRate = s.totalClaims > 0 ? Math.round((s.approvedClaims / s.totalClaims) * 100) : 0;
                  const riskColor = s.overallRiskScore >= 70 ? 'text-rose-400' : s.overallRiskScore >= 40 ? 'text-amber-400' : 'text-emerald-400';
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Claims', value: s.totalClaims.toLocaleString(), icon: <BarChart3 className="size-3.5 text-indigo-400" /> },
                          { label: 'Pending', value: s.pendingClaims.toLocaleString(), icon: <Clock className="size-3.5 text-amber-400" /> },
                          { label: 'Approved', value: s.approvedClaims.toLocaleString(), icon: <CheckCircle className="size-3.5 text-emerald-400" /> },
                          { label: 'Rejected', value: s.rejectedClaims.toLocaleString(), icon: <AlertTriangle className="size-3.5 text-rose-400" /> },
                          { label: 'High-Risk', value: s.highRiskClaims.toLocaleString(), icon: <AlertTriangle className="size-3.5 text-purple-400" /> },
                          { label: 'Approval Rate', value: `${approvalRate}%`, icon: <CheckCircle className="size-3.5 text-emerald-400" /> },
                        ].map((item) => (
                          <div key={item.label} className="bg-slate-800 rounded-lg p-3 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-wider">{item.icon}{item.label}</div>
                            <div className="text-white font-bold text-lg">{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Overall Risk Score</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-3xl font-bold ${riskColor}`}>{s.overallRiskScore}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${s.overallRiskScore}%`, background: s.overallRiskScore >= 70 ? '#f43f5e' : s.overallRiskScore >= 40 ? '#f59e0b' : '#10b981' }} />
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3">
                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Avg Processing Time</p>
                        <p className="text-white font-semibold">{s.avgProcessingTimeDays} days</p>
                      </div>
                    </>
                  );
                })()}

                {/* ---- DISTRICT PANEL ---- */}
                {fsPanel.type === 'district' && (() => {
                  const d = fsPanel.data;
                  const riskColor = d.overallRiskScore >= 70 ? 'text-rose-400' : d.overallRiskScore >= 40 ? 'text-amber-400' : 'text-emerald-400';
                  const catBadge: Record<string, string> = { low: 'bg-emerald-900/60 text-emerald-300 border-emerald-700', medium: 'bg-amber-900/60 text-amber-300 border-amber-700', high: 'bg-rose-900/60 text-rose-300 border-rose-700', critical: 'bg-purple-900/60 text-purple-300 border-purple-700' };
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-xs">{d.stateName}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase ${catBadge[d.riskCategory] || catBadge.medium}`}>{d.riskCategory} risk</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Claims', value: d.totalClaims.toLocaleString() },
                          { label: 'Approval Rate', value: `${d.approvalRate.toFixed(1)}%` },
                          { label: 'Rejection Rate', value: `${d.rejectionRate.toFixed(1)}%` },
                          { label: 'Pending Rate', value: `${d.pendingRate.toFixed(1)}%` },
                          { label: 'High-Risk', value: d.highRiskClaimsCount.toLocaleString() },
                          { label: 'Avg. Days', value: `${d.avgProcessingTimeDays}d` },
                        ].map((item) => (
                          <div key={item.label} className="bg-slate-800 rounded-lg p-3 space-y-1">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">{item.label}</p>
                            <p className="text-white font-bold text-base">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Overall Risk Score</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-3xl font-bold ${riskColor}`}>{d.overallRiskScore}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${d.overallRiskScore}%`, background: d.overallRiskScore >= 70 ? '#f43f5e' : d.overallRiskScore >= 40 ? '#f59e0b' : '#10b981' }} />
                          </div>
                        </div>
                      </div>
                      {d.keyAnomalies?.length > 0 && (
                        <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                          <p className="text-slate-400 text-xs uppercase tracking-wider">Key Anomalies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.keyAnomalies.map((a) => (
                              <span key={a} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {d.whyRedReason && (
                        <div className="bg-rose-950/40 border border-rose-800/50 rounded-lg p-3 space-y-2">
                          <p className="text-rose-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="size-3" />Risk Summary</p>
                          <p className="text-slate-300 text-xs leading-relaxed">{d.whyRedReason.summary}</p>
                          <p className="text-rose-400 text-[11px]">{d.whyRedReason.stateAvgComparison}</p>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ---- CLAIM PANEL ---- */}
                {fsPanel.type === 'claim' && (() => {
                  const c = fsPanel.data;
                  const riskColor = c.riskScore >= 70 ? '#f43f5e' : c.riskScore >= 40 ? '#f59e0b' : '#10b981';
                  const statusBadge: Record<string, string> = {
                    Pending: 'bg-amber-900/60 text-amber-300 border-amber-700',
                    Approved: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
                    Rejected: 'bg-rose-900/60 text-rose-300 border-rose-700',
                    'Under Field Inspection': 'bg-blue-900/60 text-blue-300 border-blue-700',
                    'In Committee Review': 'bg-indigo-900/60 text-indigo-300 border-indigo-700',
                  };
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase ${statusBadge[c.status] || 'bg-slate-800 text-slate-300 border-slate-600'}`}>{c.status}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: riskColor }}>Risk {c.riskScore}</span>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 space-y-2 text-xs">
                        {[
                          ['Applicant', c.applicantName],
                          ['Village', c.villageName],
                          ['District', c.districtName],
                          ['Claim Type', c.claimType],
                          ['Claimed Area', `${c.claimedAreaHectares} Ha`],
                          ['Reference Area', `${c.referenceAreaHectares} Ha`],
                          ['Area Mismatch', `${c.areaMismatchPercentage.toFixed(1)}%`],
                          ['Submitted', c.submissionDate],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2">
                            <span className="text-slate-400 shrink-0">{k}</span>
                            <span className="text-white text-right">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Anomaly Status</p>
                        <span className="text-[11px] font-medium text-amber-300 bg-amber-900/50 border border-amber-700/50 px-2 py-0.5 rounded-full">{c.anomalyStatus}</span>
                      </div>
                      {c.aiExplanation && (
                        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg p-3 space-y-2">
                          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><Sparkles className="size-3" />AI Explanation</p>
                          <p className="text-slate-300 text-xs leading-relaxed">{c.aiExplanation.summary}</p>
                          {c.aiExplanation.suspiciousFactors?.length > 0 && (
                            <ul className="space-y-1">
                              {c.aiExplanation.suspiciousFactors.map((f) => (
                                <li key={f} className="text-xs text-rose-300 flex items-start gap-1.5"><span className="mt-0.5 shrink-0">•</span>{f}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {c.riskFactorBreakdown?.length > 0 && (
                        <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                          <p className="text-slate-400 text-xs uppercase tracking-wider">Risk Factor Breakdown</p>
                          {c.riskFactorBreakdown.map((r) => (
                            <div key={r.factor} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-300">{r.factor}</span>
                                <span className="text-white font-semibold">{r.scoreContribution.toFixed(1)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(r.scoreContribution, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* ---- Floating Search Bar (bottom centre, fixed over map) ---- */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[20] w-full max-w-xl px-4">
          <form
            onSubmit={async (e) => { 
              e.preventDefault(); 
              if (onExecuteQuery && fsQuery.trim()) {
                setFsSearching(true);
                await onExecuteQuery(fsQuery);
                setFsSearching(false);
              }
            }}
            className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-lg border border-slate-600 rounded-2xl px-4 py-2.5 shadow-2xl"
          >
            <Search className="size-4 text-indigo-400 shrink-0" />
            <input
              ref={fsSearchInputRef}
              type="text"
              value={fsQuery}
              onChange={(e) => setFsQuery(e.target.value)}
              placeholder='Ask anything… e.g. "High-risk pending claims in Karnataka"'
              className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none min-w-0"
            />
            {filterSummaryMessage && fsQuery && (
              <button type="button" onClick={() => { if (onResetFilter) onResetFilter(); setFsQuery(''); }} className="text-slate-500 hover:text-white transition cursor-pointer">
                <X className="size-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={fsSearching || !fsQuery.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
            >
              {fsSearching ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {fsSearching ? 'Searching…' : 'Search'}
            </button>
          </form>
          {filterSummaryMessage && (
            <p className="text-center text-[11px] text-slate-400 mt-1.5">{filterSummaryMessage}</p>
          )}
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

