export interface Point {
  x: number;
  y: number;
}

export interface GeoPoint {
  x: number; // Easting / Longitude
  y: number; // Northing / Latitude
}

export type FeatureType = 'BUILDINGS' | 'ROADS' | 'PARCELS' | 'VEGETATION' | 'WATER' | 'OTHER';

export type GeometryType = 'Polygon' | 'Polyline' | 'Line' | 'Circle' | 'Point';

export interface VectorFeature {
  id: string;
  layerId: string;
  name?: string;
  type: GeometryType;
  points: Point[]; // in image pixel coordinates
  closed: boolean;
  selected?: boolean;
  properties: {
    area_px?: number;
    perimeter_px?: number;
    area_m2?: number;
    length_m?: number;
    elevation?: number;
    notes?: string;
    buildingType?: string;
    roadWidth?: number;
    [key: string]: any;
  };
}

export interface Layer {
  id: string;
  name: string;
  featureType: FeatureType;
  color: string;
  lineweight: number; // in mm (e.g., 0.25, 0.5, 0.7)
  visible: boolean;
  locked: boolean;
  dxfAciColor: number; // AutoCAD Color Index (1-255)
}

export interface GCP {
  id: string;
  name: string;
  pixelX: number;
  pixelY: number;
  mapX: number; // Easting or Lon
  mapY: number; // Northing or Lat
  active: boolean;
  residualX?: number;
  residualY?: number;
  residualError?: number;
}

export interface CRSDefinition {
  epsg: number;
  name: string;
  unit: string;
  proj4?: string;
  wkt: string;
  isProjected: boolean;
}

export interface GeoTransform {
  // Affine 6 parameters:
  // MapX = a * PixelX + b * PixelY + c
  // MapY = d * PixelX + e * PixelY + f
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  epsg: number;
  crsName: string;
  unit: string;
  rmsError: number;
  scaleX: number;
  scaleY: number;
  rotationDeg: number;
  isCalibrated: boolean;
}

export interface VectorizationConfig {
  thresholdMode: 'otsu' | 'adaptive' | 'manual';
  manualThreshold: number; // 0-255
  noiseReduction: number; // 0, 1, 2, 3
  edgeSensitivity: number; // 10-90
  morphology: 'none' | 'close' | 'open' | 'skeleton' | 'dilate';
  simplifyEpsilon: number; // Douglas-Peucker tolerance in pixels (0.5 to 10)
  minArea: number; // minimum contour area in pixels
  detectBuildings: boolean;
  detectRoads: boolean;
  detectParcels: boolean;
  detectVegetation: boolean;
  detectWater: boolean;
  invertColors: boolean;
  orthogonalizeBuildings: boolean; // Snap building angles to 90 degrees
}

export type CadTool = 
  | 'select' 
  | 'pan' 
  | 'draw_line' 
  | 'draw_polyline' 
  | 'draw_polygon' 
  | 'draw_rect' 
  | 'edit_vertices'
  | 'trim' 
  | 'split' 
  | 'join' 
  | 'offset' 
  | 'measure_dist' 
  | 'measure_area' 
  | 'add_gcp';

export interface SnapSettings {
  enabled: boolean;
  endpoint: boolean;
  midpoint: boolean;
  vertex: boolean;
  grid: boolean;
  gridSize: number; // in pixels
  tolerance: number; // in screen pixels
}

export interface ProjectState {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  image: {
    dataUrl: string | null;
    width: number;
    height: number;
    dpi: number;
    fileName: string;
  };
  layers: Layer[];
  features: VectorFeature[];
  gcps: GCP[];
  geoTransform: GeoTransform;
  activeLayerId: string;
}
