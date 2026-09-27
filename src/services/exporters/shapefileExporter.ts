import JSZip from 'jszip';
import { VectorFeature, Layer, GeoTransform } from '../../types/cad';
import { getCRS, pixelToMap } from '../georeference';

interface ShapeRecord {
  id: number;
  layer: string;
  type: string;
  area_m2: number;
  perim_m: number;
  points: { x: number; y: number }[];
  isClosed: boolean;
  box: { minX: number; minY: number; maxX: number; maxY: number };
}

export async function generateShapefileZip(
  features: VectorFeature[],
  layers: Layer[],
  geoTransform: GeoTransform,
  shapeType: 'Polygon' | 'PolyLine' = 'Polygon'
): Promise<Blob> {
  const layerMap = new Map<string, Layer>();
  layers.forEach(l => layerMap.set(l.id, l));

  // 1. Prepare Records
  const records: ShapeRecord[] = [];
  let fileMinX = Infinity, fileMinY = Infinity, fileMaxX = -Infinity, fileMaxY = -Infinity;

  features.forEach((feat, idx) => {
    const layer = layerMap.get(feat.layerId) || layers[0];
    const isClosed = shapeType === 'Polygon' ? true : feat.closed;

    let pts = feat.points.map(p => {
      if (geoTransform.isCalibrated) {
        return pixelToMap(p, geoTransform);
      }
      return { x: p.x, y: p.y };
    });

    if (pts.length < 2) return;

    // For ESRI Polygon shape, the first and last point must be identical and vertices must be clockwise for outer ring
    if (shapeType === 'Polygon' && pts.length >= 3) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (first.x !== last.x || first.y !== last.y) {
        pts.push({ ...first });
      }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    if (minX < fileMinX) fileMinX = minX;
    if (minY < fileMinY) fileMinY = minY;
    if (maxX > fileMaxX) fileMaxX = maxX;
    if (maxY > fileMaxY) fileMaxY = maxY;

    records.push({
      id: idx + 1,
      layer: (layer.name || 'UNKNOWN').substring(0, 16),
      type: feat.type,
      area_m2: Number(feat.properties.area_m2 || feat.properties.area_px || 0),
      perim_m: Number(feat.properties.length_m || feat.properties.perimeter_px || 0),
      points: pts,
      isClosed,
      box: { minX, minY, maxX, maxY }
    });
  });

  if (fileMinX === Infinity) {
    fileMinX = 0; fileMinY = 0; fileMaxX = 1000; fileMaxY = 1000;
  }

  const shapeCode = shapeType === 'Polygon' ? 5 : 3;

  // =================== 2. GENERATE .SHP & .SHX ===================
  // Calculate total buffer lengths
  let shpContentLengthWords = 50; // 100 bytes header / 2
  const recordOffsetsWords: number[] = [];
  const recordLengthsWords: number[] = [];

  for (const r of records) {
    recordOffsetsWords.push(shpContentLengthWords);
    // Record content: 4 (shape type) + 32 (box) + 4 (numParts) + 4 (numPoints) + 4 (parts[0]) + numPoints * 16
    const contentBytes = 4 + 32 + 4 + 4 + 4 + (r.points.length * 16);
    const contentWords = contentBytes / 2;
    recordLengthsWords.push(contentWords);
    shpContentLengthWords += 4 + contentWords; // 8 bytes header / 2 + content
  }

  const shpBuffer = new ArrayBuffer(shpContentLengthWords * 2);
  const shpView = new DataView(shpBuffer);

  const shxBuffer = new ArrayBuffer((50 + records.length * 4) * 2);
  const shxView = new DataView(shxBuffer);

  // Helper to write 100-byte ESRI Shapefile Header
  const writeHeader = (view: DataView, fileWords: number) => {
    // 0-3: File Code (9994) Big Endian
    view.setInt32(0, 9994, false);
    // 4-23: Unused (5 integers)
    view.setInt32(4, 0, false);
    view.setInt32(8, 0, false);
    view.setInt32(12, 0, false);
    view.setInt32(16, 0, false);
    view.setInt32(20, 0, false);
    // 24-27: File Length in 16-bit words (Big Endian)
    view.setInt32(24, fileWords, false);
    // 28-31: Version (1000) Little Endian
    view.setInt32(28, 1000, true);
    // 32-35: Shape Type Little Endian
    view.setInt32(32, shapeCode, true);
    // 36-67: Bounding Box (4 doubles, Little Endian)
    view.setFloat64(36, fileMinX, true);
    view.setFloat64(44, fileMinY, true);
    view.setFloat64(52, fileMaxX, true);
    view.setFloat64(60, fileMaxY, true);
    // 68-99: Z & M bounds (4 doubles 0.0)
    view.setFloat64(68, 0.0, true);
    view.setFloat64(76, 0.0, true);
    view.setFloat64(84, 0.0, true);
    view.setFloat64(92, 0.0, true);
  };

  writeHeader(shpView, shpContentLengthWords);
  writeHeader(shxView, 50 + records.length * 4);

  // Write SHP records
  let shpOffset = 100;
  let shxOffset = 100;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const recNumber = i + 1;
    const contentWords = recordLengthsWords[i];

    // SHX record (8 bytes)
    shxView.setInt32(shxOffset, recordOffsetsWords[i], false);
    shxView.setInt32(shxOffset + 4, contentWords, false);
    shxOffset += 8;

    // SHP Record Header (8 bytes)
    shpView.setInt32(shpOffset, recNumber, false);
    shpView.setInt32(shpOffset + 4, contentWords, false);
    shpOffset += 8;

    // Record Content
    shpView.setInt32(shpOffset, shapeCode, true); // Shape type
    shpView.setFloat64(shpOffset + 4, r.box.minX, true);
    shpView.setFloat64(shpOffset + 12, r.box.minY, true);
    shpView.setFloat64(shpOffset + 20, r.box.maxX, true);
    shpView.setFloat64(shpOffset + 28, r.box.maxY, true);
    shpView.setInt32(shpOffset + 36, 1, true); // NumParts = 1
    shpView.setInt32(shpOffset + 40, r.points.length, true); // NumPoints
    shpView.setInt32(shpOffset + 44, 0, true); // Parts[0] = 0

    let ptOffset = shpOffset + 48;
    for (const pt of r.points) {
      shpView.setFloat64(ptOffset, pt.x, true);
      shpView.setFloat64(ptOffset + 8, pt.y, true);
      ptOffset += 16;
    }

    shpOffset += contentWords * 2;
  }

  // =================== 3. GENERATE .DBF (dBase III) ===================
  // Fields:
  // ID: Numeric(10, 0)
  // LAYER: Character(20)
  // TYPE: Character(16)
  // AREA_M2: Numeric(16, 2)
  // PERIM_M: Numeric(16, 2)
  const fields = [
    { name: 'ID', type: 'N', length: 10, dec: 0 },
    { name: 'LAYER', type: 'C', length: 20, dec: 0 },
    { name: 'TYPE', type: 'C', length: 16, dec: 0 },
    { name: 'AREA_M2', type: 'N', length: 16, dec: 2 },
    { name: 'PERIM_M', type: 'N', length: 16, dec: 2 },
  ];

  const headerBytes = 32 + (fields.length * 32) + 1;
  const recordBytes = 1 + fields.reduce((sum, f) => sum + f.length, 0); // 1 + 10 + 20 + 16 + 16 + 16 = 79
  const dbfTotalBytes = headerBytes + (records.length * recordBytes) + 1;

  const dbfBuffer = new Uint8Array(dbfTotalBytes);
  const dbfView = new DataView(dbfBuffer.buffer);

  // DBF Header
  dbfBuffer[0] = 0x03; // dBase III
  const now = new Date();
  dbfBuffer[1] = now.getFullYear() - 1900;
  dbfBuffer[2] = now.getMonth() + 1;
  dbfBuffer[3] = now.getDate();

  dbfView.setUint32(4, records.length, true); // Number of records
  dbfView.setUint16(8, headerBytes, true); // Header length
  dbfView.setUint16(10, recordBytes, true); // Record length

  // Field descriptors
  let fOffset = 32;
  for (const f of fields) {
    for (let j = 0; j < f.name.length; j++) {
      dbfBuffer[fOffset + j] = f.name.charCodeAt(j);
    }
    dbfBuffer[fOffset + 11] = f.type.charCodeAt(0);
    dbfBuffer[fOffset + 16] = f.length;
    dbfBuffer[fOffset + 17] = f.dec;
    fOffset += 32;
  }
  dbfBuffer[fOffset] = 0x0D; // Header terminator

  // DBF Records
  let rOffset = headerBytes;
  for (const r of records) {
    dbfBuffer[rOffset] = 0x20; // 0x20 = Not deleted
    let colOffset = rOffset + 1;

    // Field 1: ID
    const idStr = r.id.toString().padStart(10, ' ');
    for (let c = 0; c < 10; c++) dbfBuffer[colOffset + c] = idStr.charCodeAt(c);
    colOffset += 10;

    // Field 2: LAYER
    const layerStr = r.layer.padEnd(20, ' ').substring(0, 20);
    for (let c = 0; c < 20; c++) dbfBuffer[colOffset + c] = layerStr.charCodeAt(c);
    colOffset += 20;

    // Field 3: TYPE
    const typeStr = r.type.padEnd(16, ' ').substring(0, 16);
    for (let c = 0; c < 16; c++) dbfBuffer[colOffset + c] = typeStr.charCodeAt(c);
    colOffset += 16;

    // Field 4: AREA_M2
    const areaStr = r.area_m2.toFixed(2).padStart(16, ' ');
    for (let c = 0; c < 16; c++) dbfBuffer[colOffset + c] = areaStr.charCodeAt(c);
    colOffset += 16;

    // Field 5: PERIM_M
    const perimStr = r.perim_m.toFixed(2).padStart(16, ' ');
    for (let c = 0; c < 16; c++) dbfBuffer[colOffset + c] = perimStr.charCodeAt(c);
    colOffset += 16;

    rOffset += recordBytes;
  }
  dbfBuffer[rOffset] = 0x1A; // EOF terminator

  // =================== 4. GENERATE .PRJ ===================
  const crs = getCRS(geoTransform.epsg);
  const prjContent = crs.wkt;

  // =================== 5. PACKAGE ZIP ===================
  const zip = new JSZip();
  const baseName = 'geovector_export';

  zip.file(`${baseName}.shp`, shpBuffer);
  zip.file(`${baseName}.shx`, shxBuffer);
  zip.file(`${baseName}.dbf`, dbfBuffer);
  zip.file(`${baseName}.prj`, prjContent);

  return await zip.generateAsync({ type: 'blob' });
}
