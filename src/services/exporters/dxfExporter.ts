import { VectorFeature, Layer, GeoTransform, Point } from '../../types/cad';
import { pixelToMap } from '../georeference';

export interface DxfExportOptions {
  useGeoreferencedCoords: boolean;
  invertYAxisForPixels?: boolean;
  imageHeight?: number;
}

export function generateDXF(
  features: VectorFeature[],
  layers: Layer[],
  geoTransform: GeoTransform,
  options: DxfExportOptions = { useGeoreferencedCoords: true }
): string {
  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(value.toString());
  };

  const layerMap = new Map<string, Layer>();
  layers.forEach(l => layerMap.set(l.id, l));

  // Determine Extents
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const transformedFeatures = features.map(feat => {
    const layer = layerMap.get(feat.layerId) || layers[0];
    const pts = feat.points.map(pt => {
      if (options.useGeoreferencedCoords && geoTransform.isCalibrated) {
        const mapPt = pixelToMap(pt, geoTransform);
        return { x: mapPt.x, y: mapPt.y };
      } else {
        // Pixel coordinates in CAD Cartesian (CAD Y goes UP, raster Y goes DOWN)
        const y = options.invertYAxisForPixels && options.imageHeight 
          ? options.imageHeight - pt.y 
          : pt.y;
        return { x: pt.x, y };
      }
    });

    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    return { ...feat, layer, transformedPoints: pts };
  });

  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = 1000; maxY = 1000;
  }

  // =================== 1. HEADER SECTION ===================
  add(0, 'SECTION');
  add(2, 'HEADER');
  
  // AutoCAD Version: AC1027 is DXF R2013 standard
  add(9, '$ACADVER');
  add(1, 'AC1027');

  // Units: 6 = Meters
  add(9, '$INSUNITS');
  add(70, 6);

  // Measurement: 1 = Metric
  add(9, '$MEASUREMENT');
  add(70, 1);

  // Extents
  add(9, '$EXTMIN');
  add(10, minX.toFixed(4));
  add(20, minY.toFixed(4));
  add(30, '0.0');

  add(9, '$EXTMAX');
  add(10, maxX.toFixed(4));
  add(20, maxY.toFixed(4));
  add(30, '0.0');

  add(0, 'ENDSEC');

  // =================== 2. TABLES SECTION ===================
  add(0, 'SECTION');
  add(2, 'TABLES');

  // VPORT Table
  add(0, 'TABLE');
  add(2, 'VPORT');
  add(70, 1);
  add(0, 'VPORT');
  add(2, '*ACTIVE');
  add(70, 0);
  add(10, '0.0');
  add(20, '0.0');
  add(11, '1.0');
  add(21, '1.0');
  add(12, ((minX + maxX) / 2).toFixed(4));
  add(22, ((minY + maxY) / 2).toFixed(4));
  add(40, (maxY - minY || 100).toFixed(4));
  add(41, '1.5');
  add(0, 'ENDTAB');

  // LTYPE Table
  add(0, 'TABLE');
  add(2, 'LTYPE');
  add(70, 1);
  add(0, 'LTYPE');
  add(2, 'CONTINUOUS');
  add(70, 0);
  add(3, 'Solid line');
  add(72, 65);
  add(73, 0);
  add(40, '0.0');
  add(0, 'ENDTAB');

  // LAYER Table
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, layers.length);

  for (const layer of layers) {
    add(0, 'LAYER');
    add(2, layer.name.toUpperCase().replace(/\s+/g, '_'));
    add(70, 0);
    // AutoCAD Color Index (ACI)
    add(62, layer.dxfAciColor || 7);
    add(6, 'CONTINUOUS');
    // Lineweight in 1/100 mm (e.g., 25 = 0.25mm)
    const lwCode = Math.round(layer.lineweight * 100);
    add(370, lwCode);
  }
  add(0, 'ENDTAB');

  add(0, 'ENDSEC');

  // =================== 3. BLOCKS SECTION ===================
  add(0, 'SECTION');
  add(2, 'BLOCKS');
  add(0, 'ENDSEC');

  // =================== 4. ENTITIES SECTION ===================
  add(0, 'SECTION');
  add(2, 'ENTITIES');

  for (const feat of transformedFeatures) {
    const layerName = (feat.layer?.name || 'DEFAULT').toUpperCase().replace(/\s+/g, '_');
    const pts = feat.transformedPoints;
    if (pts.length < 2) continue;

    add(0, 'LWPOLYLINE');
    add(8, layerName);
    add(62, feat.layer?.dxfAciColor || 7);
    add(90, pts.length);
    // 70: 1 = Closed Polyline / Polygon, 0 = Open Polyline
    add(70, feat.closed ? 1 : 0);
    add(43, '0.0'); // constant width

    for (const pt of pts) {
      add(10, pt.x.toFixed(4));
      add(20, pt.y.toFixed(4));
    }
  }

  add(0, 'ENDSEC');

  // =================== 5. OBJECTS SECTION ===================
  add(0, 'SECTION');
  add(2, 'OBJECTS');
  add(0, 'ENDSEC');

  // =================== EOF ===================
  add(0, 'EOF');

  return lines.join('\r\n') + '\r\n';
}
