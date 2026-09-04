/**
 * GeoJSON Polygons for Indian States and Key Districts
 * 
 * GIS / BACKEND INTEGRATION NOTE:
 * These GeoJSON boundary polygons represent high-density state and district boundaries.
 * In a live production environment with full GIS infrastructure:
 * 1. Replace this file or call your GeoJSON API endpoint (e.g. `/api/gis/states.geojson` or `/api/gis/districts/{stateId}.geojson`).
 * 2. Official Survey of India (SoI) or Bhuvan ISRO GeoJSON / Vector Tile layers can be loaded directly into Leaflet `GeoJSON` or `TileLayer.WMS` components.
 */

export const INDIA_STATES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'st-cg',
      properties: { name: 'Chhattisgarh', code: 'CG', riskScore: 68 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [83.32, 24.10], [83.85, 23.82], [84.12, 23.35], [83.90, 22.80],
            [84.40, 22.35], [83.65, 21.80], [83.20, 21.25], [83.55, 20.45],
            [82.80, 19.85], [82.25, 19.10], [81.85, 18.30], [81.35, 17.80],
            [80.75, 17.92], [80.38, 18.65], [80.52, 19.45], [80.25, 20.15],
            [80.85, 20.95], [80.55, 21.65], [80.32, 22.25], [81.15, 22.85],
            [81.95, 23.35], [82.45, 23.95], [83.32, 24.10]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'st-od',
      properties: { name: 'Odisha', code: 'OD', riskScore: 42 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [83.65, 21.80], [84.40, 22.35], [85.15, 22.55], [86.20, 22.30],
            [87.12, 22.05], [87.48, 21.55], [87.05, 21.10], [86.35, 20.50],
            [85.80, 19.85], [85.10, 19.35], [84.25, 18.90], [82.85, 18.25],
            [81.85, 18.30], [82.25, 19.10], [82.80, 19.85], [83.55, 20.45],
            [83.20, 21.25], [83.65, 21.80]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'st-mp',
      properties: { name: 'Madhya Pradesh', code: 'MP', riskScore: 74 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [74.05, 22.05], [74.55, 23.15], [75.25, 24.20], [75.85, 25.10],
            [77.12, 25.85], [78.25, 26.75], [79.45, 26.25], [80.85, 25.15],
            [82.25, 24.85], [82.85, 24.15], [83.32, 24.10], [82.45, 23.95],
            [81.95, 23.35], [81.15, 22.85], [80.32, 22.25], [79.55, 21.85],
            [78.45, 21.45], [76.85, 21.25], [75.15, 21.35], [74.05, 22.05]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'st-jh',
      properties: { name: 'Jharkhand', code: 'JH', riskScore: 55 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [83.32, 24.10], [83.85, 24.55], [84.85, 24.85], [86.15, 25.25],
            [87.55, 25.15], [87.85, 24.35], [87.25, 23.80], [86.85, 22.85],
            [86.20, 22.30], [85.15, 22.55], [84.40, 22.35], [83.90, 22.80],
            [84.12, 23.35], [83.85, 23.82], [83.32, 24.10]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'st-mh',
      properties: { name: 'Maharashtra', code: 'MH', riskScore: 38 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [72.82, 19.85], [73.55, 20.75], [74.85, 21.25], [76.15, 21.35],
            [78.45, 21.45], [79.55, 21.85], [80.32, 22.25], [80.55, 21.65],
            [80.85, 20.95], [80.25, 20.15], [80.52, 19.45], [79.85, 18.85],
            [78.65, 18.25], [77.35, 18.05], [75.85, 17.55], [74.25, 15.85],
            [73.55, 16.25], [73.15, 18.05], [72.82, 19.85]
          ]
        ]
      }
    }
  ]
};

export const CHHATTISGARH_DISTRICTS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'dt-bastar',
      properties: { name: 'Bastar', stateId: 'st-cg', riskScore: 84, riskCategory: 'critical' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [81.55, 19.55], [82.05, 19.65], [82.35, 19.45], [82.25, 19.10],
            [82.05, 18.85], [81.65, 18.75], [81.45, 19.15], [81.55, 19.55]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'dt-kanker',
      properties: { name: 'Kanker', stateId: 'st-cg', riskScore: 48, riskCategory: 'medium' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [80.85, 20.75], [81.45, 20.85], [81.95, 20.70], [82.15, 20.25],
            [81.75, 19.85], [81.25, 19.95], [80.75, 20.25], [80.85, 20.75]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'dt-dantewada',
      properties: { name: 'Dantewada', stateId: 'st-cg', riskScore: 89, riskCategory: 'critical' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [81.05, 19.15], [81.65, 18.75], [81.85, 18.30], [81.35, 17.80],
            [80.95, 18.15], [80.85, 18.65], [81.05, 19.15]
          ]
        ]
      }
    }
  ]
};
