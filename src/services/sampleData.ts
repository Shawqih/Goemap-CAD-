import { Layer, VectorFeature, GCP, GeoTransform, ProjectState } from '../types/cad';

export const DEFAULT_LAYERS: Layer[] = [
  {
    id: 'layer_buildings',
    name: 'BUILDINGS',
    featureType: 'BUILDINGS',
    color: '#EF4444', // Red-500
    lineweight: 0.35,
    visible: true,
    locked: false,
    dxfAciColor: 1 // Red in AutoCAD
  },
  {
    id: 'layer_roads',
    name: 'ROADS',
    featureType: 'ROADS',
    color: '#06B6D4', // Cyan-500
    lineweight: 0.50,
    visible: true,
    locked: false,
    dxfAciColor: 4 // Cyan in AutoCAD
  },
  {
    id: 'layer_parcels',
    name: 'PARCELS',
    featureType: 'PARCELS',
    color: '#EAB308', // Yellow-500
    lineweight: 0.25,
    visible: true,
    locked: false,
    dxfAciColor: 2 // Yellow in AutoCAD
  },
  {
    id: 'layer_vegetation',
    name: 'VEGETATION',
    featureType: 'VEGETATION',
    color: '#22C55E', // Green-500
    lineweight: 0.25,
    visible: true,
    locked: false,
    dxfAciColor: 3 // Green in AutoCAD
  },
  {
    id: 'layer_water',
    name: 'WATER',
    featureType: 'WATER',
    color: '#3B82F6', // Blue-500
    lineweight: 0.35,
    visible: true,
    locked: false,
    dxfAciColor: 5 // Blue in AutoCAD
  },
  {
    id: 'layer_other',
    name: 'OTHER',
    featureType: 'OTHER',
    color: '#94A3B8', // Slate-400
    lineweight: 0.18,
    visible: true,
    locked: false,
    dxfAciColor: 7 // White/Black in AutoCAD
  }
];

export const DEFAULT_GCPS: GCP[] = [
  {
    id: 'gcp_1',
    name: 'GCP-01 (NW Corner)',
    pixelX: 120,
    pixelY: 100,
    mapX: 326450.00,
    mapY: 3328900.00,
    active: true,
    residualX: 0.05,
    residualY: -0.04,
    residualError: 0.06
  },
  {
    id: 'gcp_2',
    name: 'GCP-02 (NE Corner)',
    pixelX: 880,
    pixelY: 110,
    mapX: 327210.00,
    mapY: 3328890.00,
    active: true,
    residualX: -0.03,
    residualY: 0.06,
    residualError: 0.07
  },
  {
    id: 'gcp_3',
    name: 'GCP-03 (SE Corner)',
    pixelX: 890,
    pixelY: 790,
    mapX: 327220.00,
    mapY: 3328210.00,
    active: true,
    residualX: 0.04,
    residualY: -0.05,
    residualError: 0.06
  },
  {
    id: 'gcp_4',
    name: 'GCP-04 (SW Corner)',
    pixelX: 110,
    pixelY: 800,
    mapX: 326440.00,
    mapY: 3328200.00,
    active: true,
    residualX: -0.06,
    residualY: 0.03,
    residualError: 0.07
  }
];

export const DEFAULT_TRANSFORM: GeoTransform = {
  a: 1.000,
  b: 0.000,
  c: 326330.00,
  d: 0.000,
  e: -1.000,
  f: 3329000.00,
  epsg: 32636,
  crsName: 'WGS 84 / UTM Zone 36N',
  unit: 'meters',
  rmsError: 0.065,
  scaleX: 1.0,
  scaleY: 1.0,
  rotationDeg: 0.0,
  isCalibrated: true
};

/**
 * Generates an aerial satellite-style raster canvas and returns its dataURL
 */
export function generateSampleAerialImage(): { dataUrl: string; width: number; height: number } {
  const width = 1000;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Earth background (sandy beige / soil terrain)
  ctx.fillStyle = '#C5B59E';
  ctx.fillRect(0, 0, width, height);

  // Subtle soil texture
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillStyle = Math.random() > 0.5 ? '#BBAA92' : '#D2C2AA';
    ctx.fillRect(rx, ry, Math.random() * 4, Math.random() * 4);
  }

  // 2. Agricultural / parcel plots
  const parcelRects = [
    { x: 50, y: 50, w: 260, h: 320, fill: '#A3B18A' },
    { x: 50, y: 410, w: 260, h: 420, fill: '#588157' },
    { x: 350, y: 50, w: 320, h: 320, fill: '#DDB892' },
    { x: 710, y: 50, w: 240, h: 380, fill: '#B7B7A4' },
    { x: 710, y: 470, w: 240, h: 360, fill: '#6B705C' },
    { x: 350, y: 550, w: 320, h: 280, fill: '#A3B18A' }
  ];

  parcelRects.forEach(p => {
    ctx.fillStyle = p.fill;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#343A40';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  // 3. Water Canal / River
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(200, 460, 400, 520, 680, 490);
  ctx.bezierCurveTo(800, 480, 950, 450, 1000, 460);
  ctx.lineWidth = 36;
  ctx.strokeStyle = '#2B5C8F';
  ctx.stroke();

  // Water edge specular
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(200, 460, 400, 520, 680, 490);
  ctx.bezierCurveTo(800, 480, 950, 450, 1000, 460);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#4B88C4';
  ctx.stroke();

  // 4. Roads (Paved Asphalt & Intersections)
  ctx.lineWidth = 28;
  ctx.strokeStyle = '#4A4E54'; // Dark asphalt

  // Main vertical avenue
  ctx.beginPath();
  ctx.moveTo(330, 0);
  ctx.lineTo(330, height);
  ctx.stroke();

  // Second vertical road
  ctx.beginPath();
  ctx.moveTo(690, 0);
  ctx.lineTo(690, height);
  ctx.stroke();

  // Horizontal crossing roads
  ctx.beginPath();
  ctx.moveTo(0, 390);
  ctx.lineTo(width, 390);
  ctx.stroke();

  // Secondary road
  ctx.beginPath();
  ctx.moveTo(0, 850);
  ctx.lineTo(width, 850);
  ctx.stroke();

  // Road lane markers (yellow dashed)
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = '#FACC15';

  ctx.beginPath();
  ctx.moveTo(330, 0); ctx.lineTo(330, height);
  ctx.moveTo(690, 0); ctx.lineTo(690, height);
  ctx.moveTo(0, 390); ctx.lineTo(width, 390);
  ctx.moveTo(0, 850); ctx.lineTo(width, 850);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  // Roundabout / Circle intersection
  ctx.beginPath();
  ctx.arc(330, 390, 38, 0, Math.PI * 2);
  ctx.fillStyle = '#4A4E54';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(330, 390, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#22C55E'; // green roundabout island
  ctx.fill();

  // 5. Buildings (Footprints with rooftop AC units & shadows)
  const buildings = [
    { x: 80, y: 80, w: 90, h: 70, fill: '#E29578' },
    { x: 190, y: 80, w: 100, h: 60, fill: '#83C5BE' },
    { x: 80, y: 170, w: 120, h: 80, fill: '#FFDDD2' },
    { x: 220, y: 160, w: 70, h: 100, fill: '#DDA15E' },
    { x: 100, y: 270, w: 180, h: 80, fill: '#BC6C25' },

    // Middle block
    { x: 380, y: 80, w: 120, h: 90, fill: '#E76F51' },
    { x: 520, y: 80, w: 130, h: 120, fill: '#F4A261' },
    { x: 380, y: 200, w: 100, h: 70, fill: '#E9C46A' },
    { x: 500, y: 220, w: 150, h: 130, fill: '#2A9D8F' },

    // Right block
    { x: 740, y: 80, w: 180, h: 100, fill: '#C08552' },
    { x: 740, y: 200, w: 90, h: 150, fill: '#F3E9D2' },
    { x: 850, y: 200, w: 80, h: 70, fill: '#DAB49D' },
    { x: 850, y: 290, w: 80, h: 60, fill: '#A68A72' },

    // Lower block
    { x: 80, y: 550, w: 90, h: 120, fill: '#D68C45' },
    { x: 190, y: 550, w: 100, h: 90, fill: '#F4A261' },
    { x: 80, y: 690, w: 140, h: 90, fill: '#E76F51' },
    { x: 740, y: 530, w: 180, h: 130, fill: '#E29578' },
    { x: 740, y: 680, w: 110, h: 100, fill: '#83C5BE' },
    { x: 870, y: 680, w: 60, h: 100, fill: '#DDA15E' }
  ];

  buildings.forEach(b => {
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(b.x + 6, b.y + 6, b.w, b.h);

    // Building roof
    ctx.fillStyle = b.fill;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    // AC unit on roof
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(b.x + b.w * 0.3, b.y + b.h * 0.3, 14, 10);
    ctx.strokeRect(b.x + b.w * 0.3, b.y + b.h * 0.3, 14, 10);
  });

  // 6. Tree clusters / Vegetation
  const trees = [
    { x: 380, y: 600, r: 24 }, { x: 420, y: 620, r: 28 }, { x: 460, y: 590, r: 22 },
    { x: 510, y: 640, r: 32 }, { x: 570, y: 620, r: 26 }, { x: 620, y: 650, r: 30 },
    { x: 400, y: 700, r: 25 }, { x: 450, y: 720, r: 29 }, { x: 520, y: 710, r: 34 },
    { x: 590, y: 730, r: 27 }, { x: 640, y: 700, r: 23 }
  ];

  trees.forEach(t => {
    // Shadow
    ctx.beginPath();
    ctx.arc(t.x + 4, t.y + 4, t.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Canopy
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fillStyle = '#2D6A4F';
    ctx.fill();
    ctx.strokeStyle = '#1B4332';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Leaf highlight
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.2, t.y - t.r * 0.2, t.r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#52B788';
    ctx.fill();
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height
  };
}

/**
 * Pre-vectorized geometric CAD elements matching the sample aerial image perfectly
 */
export function generateSampleFeatures(): VectorFeature[] {
  const feats: VectorFeature[] = [];

  // ================= 1. ROADS =================
  // Main vertical avenue centerline
  feats.push({
    id: 'road_vert_1',
    layerId: 'layer_roads',
    name: 'Main North-South Avenue',
    type: 'Polyline',
    points: [{ x: 330, y: 0 }, { x: 330, y: 352 }, { x: 330, y: 428 }, { x: 330, y: 900 }],
    closed: false,
    properties: { roadWidth: 28, length_m: 900, elevation: 12.5 }
  });

  // East vertical street
  feats.push({
    id: 'road_vert_2',
    layerId: 'layer_roads',
    name: 'East Corridor Street',
    type: 'Polyline',
    points: [{ x: 690, y: 0 }, { x: 690, y: 900 }],
    closed: false,
    properties: { roadWidth: 28, length_m: 900, elevation: 12.4 }
  });

  // Horizontal crossing boulevard
  feats.push({
    id: 'road_horiz_1',
    layerId: 'layer_roads',
    name: 'Central Crossing Boulevard',
    type: 'Polyline',
    points: [{ x: 0, y: 390 }, { x: 292, y: 390 }, { x: 368, y: 390 }, { x: 1000, y: 390 }],
    closed: false,
    properties: { roadWidth: 28, length_m: 1000, elevation: 12.0 }
  });

  // South perimeter road
  feats.push({
    id: 'road_horiz_2',
    layerId: 'layer_roads',
    name: 'South Ring Road',
    type: 'Polyline',
    points: [{ x: 0, y: 850 }, { x: 1000, y: 850 }],
    closed: false,
    properties: { roadWidth: 24, length_m: 1000, elevation: 11.8 }
  });

  // Roundabout circle
  const roundPts = [];
  for (let a = 0; a <= 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    roundPts.push({ x: 330 + 38 * Math.cos(rad), y: 390 + 38 * Math.sin(rad) });
  }
  feats.push({
    id: 'road_roundabout',
    layerId: 'layer_roads',
    name: 'Avenue Roundabout Hub',
    type: 'Polygon',
    points: roundPts,
    closed: true,
    properties: { area_m2: 4536, length_m: 238 }
  });

  // ================= 2. WATER =================
  feats.push({
    id: 'water_canal_1',
    layerId: 'layer_water',
    name: 'Central Drainage Canal',
    type: 'Polygon',
    points: [
      { x: 0, y: 462 }, { x: 200, y: 442 }, { x: 400, y: 502 }, { x: 680, y: 472 }, { x: 800, y: 462 }, { x: 950, y: 432 }, { x: 1000, y: 442 },
      { x: 1000, y: 478 }, { x: 950, y: 468 }, { x: 800, y: 498 }, { x: 680, y: 508 }, { x: 400, y: 538 }, { x: 200, y: 478 }, { x: 0, y: 498 }
    ],
    closed: true,
    properties: { area_m2: 36000, length_m: 2040 }
  });

  // ================= 3. PARCELS =================
  const parcels = [
    { id: 'parcel_nw', name: 'Parcel Block 101-NW', pts: [{ x: 50, y: 50 }, { x: 310, y: 50 }, { x: 310, y: 370 }, { x: 50, y: 370 }] },
    { id: 'parcel_sw', name: 'Parcel Block 102-SW', pts: [{ x: 50, y: 410 }, { x: 310, y: 410 }, { x: 310, y: 830 }, { x: 50, y: 830 }] },
    { id: 'parcel_nc', name: 'Parcel Block 201-NC', pts: [{ x: 350, y: 50 }, { x: 670, y: 50 }, { x: 670, y: 370 }, { x: 350, y: 370 }] },
    { id: 'parcel_ne', name: 'Parcel Block 301-NE', pts: [{ x: 710, y: 50 }, { x: 950, y: 50 }, { x: 950, y: 370 }, { x: 710, y: 370 }] },
    { id: 'parcel_sc', name: 'Parcel Block 202-SC (Green Reserve)', pts: [{ x: 350, y: 550 }, { x: 670, y: 550 }, { x: 670, y: 830 }, { x: 350, y: 830 }] },
    { id: 'parcel_se', name: 'Parcel Block 302-SE', pts: [{ x: 710, y: 470 }, { x: 950, y: 470 }, { x: 950, y: 830 }, { x: 710, y: 830 }] }
  ];

  parcels.forEach(p => {
    feats.push({
      id: p.id,
      layerId: 'layer_parcels',
      name: p.name,
      type: 'Polygon',
      points: p.pts,
      closed: true,
      properties: { area_m2: 83200, length_m: 1160 }
    });
  });

  // ================= 4. BUILDINGS =================
  const bldgDefs = [
    { id: 'bldg_101', name: 'Villa A-101', x: 80, y: 80, w: 90, h: 70 },
    { id: 'bldg_102', name: 'Commercial Block A-102', x: 190, y: 80, w: 100, h: 60 },
    { id: 'bldg_103', name: 'Residential Complex A-103', x: 80, y: 170, w: 120, h: 80 },
    { id: 'bldg_104', name: 'Townhouse Wing A-104', x: 220, y: 160, w: 70, h: 100 },
    { id: 'bldg_105', name: 'Civic Center A-105', x: 100, y: 270, w: 180, h: 80 },

    { id: 'bldg_201', name: 'Administrative Hall B-201', x: 380, y: 80, w: 120, h: 90 },
    { id: 'bldg_202', name: 'Trade Plaza B-202', x: 520, y: 80, w: 130, h: 120 },
    { id: 'bldg_203', name: 'Medical Annex B-203', x: 380, y: 200, w: 100, h: 70 },
    { id: 'bldg_204', name: 'Corporate Tower B-204', x: 500, y: 220, w: 150, h: 130 },

    { id: 'bldg_301', name: 'Logistics Facility C-301', x: 740, y: 80, w: 180, h: 100 },
    { id: 'bldg_302', name: 'Retail Hub C-302', x: 740, y: 200, w: 90, h: 150 },
    { id: 'bldg_303', name: 'Service Building C-303', x: 850, y: 200, w: 80, h: 70 },
    { id: 'bldg_304', name: 'Maintenance Unit C-304', x: 850, y: 290, w: 80, h: 60 },

    { id: 'bldg_401', name: 'South Residence D-401', x: 80, y: 550, w: 90, h: 120 },
    { id: 'bldg_402', name: 'South Commercial D-402', x: 190, y: 550, w: 100, h: 90 },
    { id: 'bldg_403', name: 'South School D-403', x: 80, y: 690, w: 140, h: 90 },
    { id: 'bldg_501', name: 'East Academy E-501', x: 740, y: 530, w: 180, h: 130 },
    { id: 'bldg_502', name: 'East Clinic E-502', x: 740, y: 680, w: 110, h: 100 },
    { id: 'bldg_503', name: 'East Substation E-503', x: 870, y: 680, w: 60, h: 100 }
  ];

  bldgDefs.forEach(b => {
    feats.push({
      id: b.id,
      layerId: 'layer_buildings',
      name: b.name,
      type: 'Polygon',
      points: [
        { x: b.x, y: b.y },
        { x: b.x + b.w, y: b.y },
        { x: b.x + b.w, y: b.y + b.h },
        { x: b.x, y: b.y + b.h }
      ],
      closed: true,
      properties: {
        area_m2: b.w * b.h,
        length_m: (b.w + b.h) * 2,
        buildingType: 'Mixed Commercial/Residential'
      }
    });
  });

  // ================= 5. VEGETATION =================
  feats.push({
    id: 'veg_park_boundary',
    layerId: 'layer_vegetation',
    name: 'Municipal Botanical Garden Canopy',
    type: 'Polygon',
    points: [
      { x: 370, y: 580 }, { x: 440, y: 570 }, { x: 530, y: 580 }, { x: 650, y: 610 },
      { x: 660, y: 720 }, { x: 610, y: 760 }, { x: 510, y: 750 }, { x: 380, y: 730 }
    ],
    closed: true,
    properties: { area_m2: 43500, length_m: 890 }
  });

  return feats;
}

/**
 * Initializes the default starter project
 */
export function createInitialProject(): ProjectState {
  const sampleImg = generateSampleAerialImage();
  const sampleFeats = generateSampleFeatures();

  return {
    id: 'proj_default_cadastral',
    name: 'New Administrative Capital — Sector 4 Aerial Cadastral Survey',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    image: {
      dataUrl: sampleImg.dataUrl,
      width: sampleImg.width,
      height: sampleImg.height,
      dpi: 300,
      fileName: 'aerial_satellite_ortho_sector4.png'
    },
    layers: DEFAULT_LAYERS,
    features: sampleFeats,
    gcps: DEFAULT_GCPS,
    geoTransform: DEFAULT_TRANSFORM,
    activeLayerId: 'layer_buildings'
  };
}
