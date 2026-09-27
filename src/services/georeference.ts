import { CRSDefinition, GCP, GeoTransform, Point, GeoPoint } from '../types/cad';

export const SUPPORTED_CRS: CRSDefinition[] = [
  {
    epsg: 4326,
    name: 'WGS 84 (Geographic Lat/Lon)',
    unit: 'degrees',
    isProjected: false,
    wkt: `GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]`
  },
  {
    epsg: 3857,
    name: 'WGS 84 / Pseudo-Mercator (Web Mercator)',
    unit: 'meters',
    isProjected: true,
    wkt: `PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","3857"]]`
  },
  {
    epsg: 32636,
    name: 'WGS 84 / UTM Zone 36N (Egypt, Levant, East Africa)',
    unit: 'meters',
    isProjected: true,
    wkt: `PROJCS["WGS 84 / UTM zone 36N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",33],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","32636"]]`
  },
  {
    epsg: 32637,
    name: 'WGS 84 / UTM Zone 37N (Saudi Arabia, Iraq, Red Sea)',
    unit: 'meters',
    isProjected: true,
    wkt: `PROJCS["WGS 84 / UTM zone 37N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",39],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","32637"]]`
  },
  {
    epsg: 32638,
    name: 'WGS 84 / UTM Zone 38N (Saudi Arabia, UAE, Gulf)',
    unit: 'meters',
    isProjected: true,
    wkt: `PROJCS["WGS 84 / UTM zone 38N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",45],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","32638"]]`
  },
  {
    epsg: 32639,
    name: 'WGS 84 / UTM Zone 39N (Oman, UAE, Arabian Gulf)',
    unit: 'meters',
    isProjected: true,
    wkt: `PROJCS["WGS 84 / UTM zone 39N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",51],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","32639"]]`
  },
  {
    epsg: 22992,
    name: 'Egypt 1907 / Red Belt (ETM)',
    unit: 'meters',
    isProjected: true,
    wkt: `PROJCS["Egypt 1907 / Red Belt",GEOGCS["Egypt 1907",DATUM["Egypt_1907",SPHEROID["Helmert 1906",6378200,298.3]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",30],PARAMETER["central_meridian",31],PARAMETER["scale_factor",1],PARAMETER["false_easting",615000],PARAMETER["false_northing",810000],UNIT["metre",1],AUTHORITY["EPSG","22992"]]`
  },
  {
    epsg: 20436,
    name: 'Ain el Abd / UTM Zone 37N (KSA)',
    unit: 'meters',
    isProjected: true,
    wkt: `PROJCS["Ain el Abd / UTM zone 37N",GEOGCS["Ain el Abd",DATUM["Ain_el_Abd_1970",SPHEROID["International 1924",6378388,297]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",39],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","20436"]]`
  }
];

export function getCRS(epsg: number): CRSDefinition {
  return SUPPORTED_CRS.find(c => c.epsg === epsg) || SUPPORTED_CRS[1];
}

/**
 * Solves standard 6-parameter 2D Affine Transformation using Least Squares:
 * X_map = a * u + b * v + c
 * Y_map = d * u + e * v + f
 * 
 * Minimum 3 active GCPs required.
 */
export function computeAffineTransform(
  gcps: GCP[], 
  selectedEpsg: number = 32636,
  imageWidth: number = 1000,
  imageHeight: number = 1000
): { transform: GeoTransform; updatedGcps: GCP[] } {
  const activeGcps = gcps.filter(g => g.active);
  const crs = getCRS(selectedEpsg);

  // If less than 3 GCPs, return default 1:1 or estimated scale transform
  if (activeGcps.length < 3) {
    const scale = 0.1; // Default 0.1 m per pixel
    const defaultTransform: GeoTransform = {
      a: scale,
      b: 0,
      c: 500000, // standard false easting
      d: 0,
      e: -scale, // Y grows downward in pixels, upward in GIS
      f: 3000000, // typical northing
      epsg: selectedEpsg,
      crsName: crs.name,
      unit: crs.unit,
      rmsError: 0,
      scaleX: scale,
      scaleY: scale,
      rotationDeg: 0,
      isCalibrated: false
    };

    const updatedGcps = gcps.map(g => ({
      ...g,
      residualX: 0,
      residualY: 0,
      residualError: 0
    }));

    return { transform: defaultTransform, updatedGcps };
  }

  // Normal equations for: [u, v, 1] * [a; b; c] = [X]
  // and [u, v, 1] * [d; e; f] = [Y]
  let sumU = 0, sumV = 0, sumU2 = 0, sumV2 = 0, sumUV = 0;
  let sumX = 0, sumUX = 0, sumVX = 0;
  let sumY = 0, sumUY = 0, sumVY = 0;
  const n = activeGcps.length;

  for (const g of activeGcps) {
    const u = g.pixelX;
    const v = g.pixelY;
    const x = g.mapX;
    const y = g.mapY;

    sumU += u;
    sumV += v;
    sumU2 += u * u;
    sumV2 += v * v;
    sumUV += u * v;

    sumX += x;
    sumUX += u * x;
    sumVX += v * x;

    sumY += y;
    sumUY += u * y;
    sumVY += v * y;
  }

  // Matrix A:
  // [ sumU2, sumUV, sumU ]
  // [ sumUV, sumV2, sumV ]
  // [ sumU,  sumV,  n    ]
  const m11 = sumU2, m12 = sumUV, m13 = sumU;
  const m21 = sumUV, m22 = sumV2, m23 = sumV;
  const m31 = sumU,  m32 = sumV,  m33 = n;

  // Determinant of 3x3 matrix
  const det = 
    m11 * (m22 * m33 - m23 * m32) -
    m12 * (m21 * m33 - m23 * m31) +
    m13 * (m21 * m32 - m22 * m31);

  if (Math.abs(det) < 1e-12) {
    // Degenerate (points collinear)
    const scale = 0.1;
    return {
      transform: {
        a: scale, b: 0, c: 500000,
        d: 0, e: -scale, f: 3000000,
        epsg: selectedEpsg, crsName: crs.name, unit: crs.unit,
        rmsError: 999.0, scaleX: scale, scaleY: scale, rotationDeg: 0,
        isCalibrated: false
      },
      updatedGcps: gcps
    };
  }

  // Solve for [a, b, c] with right side [sumUX, sumVX, sumX]
  const invDet = 1 / det;
  const inv11 = (m22 * m33 - m23 * m32) * invDet;
  const inv12 = (m13 * m32 - m12 * m33) * invDet;
  const inv13 = (m12 * m23 - m13 * m22) * invDet;

  const inv21 = (m23 * m31 - m21 * m33) * invDet;
  const inv22 = (m11 * m33 - m13 * m31) * invDet;
  const inv23 = (m13 * m21 - m11 * m23) * invDet;

  const inv31 = (m21 * m32 - m22 * m31) * invDet;
  const inv32 = (m12 * m31 - m11 * m32) * invDet;
  const inv33 = (m11 * m22 - m12 * m21) * invDet;

  const a = inv11 * sumUX + inv12 * sumVX + inv13 * sumX;
  const b = inv21 * sumUX + inv22 * sumVX + inv23 * sumX;
  const c = inv31 * sumUX + inv32 * sumVX + inv33 * sumX;

  const d = inv11 * sumUY + inv12 * sumVY + inv13 * sumY;
  const e = inv21 * sumUY + inv22 * sumVY + inv23 * sumY;
  const f = inv31 * sumUY + inv32 * sumVY + inv33 * sumY;

  // Calculate residuals and RMS error
  let sumSqErr = 0;
  const updatedGcps = gcps.map(g => {
    if (!g.active) {
      return { ...g, residualX: 0, residualY: 0, residualError: 0 };
    }
    const computedX = a * g.pixelX + b * g.pixelY + c;
    const computedY = d * g.pixelX + e * g.pixelY + f;
    const rx = computedX - g.mapX;
    const ry = computedY - g.mapY;
    const err = Math.sqrt(rx * rx + ry * ry);
    sumSqErr += rx * rx + ry * ry;
    return {
      ...g,
      residualX: rx,
      residualY: ry,
      residualError: err
    };
  });

  const rmsError = Math.sqrt(sumSqErr / activeGcps.length);
  const scaleX = Math.sqrt(a * a + d * d);
  const scaleY = Math.sqrt(b * b + e * e);
  const rotationRad = Math.atan2(d, a);
  const rotationDeg = (rotationRad * 180) / Math.PI;

  const transform: GeoTransform = {
    a, b, c, d, e, f,
    epsg: selectedEpsg,
    crsName: crs.name,
    unit: crs.unit,
    rmsError,
    scaleX,
    scaleY,
    rotationDeg,
    isCalibrated: true
  };

  return { transform, updatedGcps };
}

/**
 * Pixel to Map coordinates
 */
export function pixelToMap(pt: Point, transform: GeoTransform): GeoPoint {
  return {
    x: transform.a * pt.x + transform.b * pt.y + transform.c,
    y: transform.d * pt.x + transform.e * pt.y + transform.f
  };
}

/**
 * Map to Pixel coordinates
 */
export function mapToPixel(geoPt: GeoPoint, transform: GeoTransform): Point {
  const { a, b, c, d, e, f } = transform;
  const det = a * e - b * d;
  if (Math.abs(det) < 1e-12) return { x: 0, y: 0 };

  const x_rel = geoPt.x - c;
  const y_rel = geoPt.y - f;

  const px = (e * x_rel - b * y_rel) / det;
  const py = (-d * x_rel + a * y_rel) / det;

  return { x: px, y: py };
}

/**
 * Generates ESRI World File content (.tfw / .pgw / .jgw)
 * 6 lines:
 * Line 1: x-scale (A)
 * Line 2: y-skew (D)
 * Line 3: x-skew (B)
 * Line 4: y-scale (E, negative)
 * Line 5: upper-left X center (C)
 * Line 6: upper-left Y center (F)
 */
export function generateWorldFileContent(transform: GeoTransform): string {
  return [
    transform.a.toFixed(10),
    transform.d.toFixed(10),
    transform.b.toFixed(10),
    transform.e.toFixed(10),
    transform.c.toFixed(10),
    transform.f.toFixed(10)
  ].join('\n') + '\n';
}
