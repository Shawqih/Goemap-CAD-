import { VectorFeature, Layer, GeoTransform } from '../../types/cad';
import { pixelToMap } from '../georeference';

export function generateVerticesCSV(
  features: VectorFeature[],
  layers: Layer[],
  geoTransform: GeoTransform
): string {
  const layerMap = new Map<string, Layer>();
  layers.forEach(l => layerMap.set(l.id, l));

  const rows: string[] = [
    'FEATURE_ID,FEATURE_NAME,LAYER,GEOMETRY_TYPE,VERTEX_INDEX,PIXEL_X,PIXEL_Y,MAP_X_EASTING,MAP_Y_NORTHING'
  ];

  for (const feat of features) {
    const layer = layerMap.get(feat.layerId) || layers[0];
    feat.points.forEach((pt, idx) => {
      let mapX = pt.x;
      let mapY = pt.y;
      if (geoTransform.isCalibrated) {
        const mapPt = pixelToMap(pt, geoTransform);
        mapX = mapPt.x;
        mapY = mapPt.y;
      }

      rows.push(
        `"${feat.id}","${feat.name || 'Feature'}","${layer.name}","${feat.type}",${idx + 1},${pt.x.toFixed(2)},${pt.y.toFixed(2)},${mapX.toFixed(4)},${mapY.toFixed(4)}`
      );
    });
  }

  return rows.join('\r\n');
}

export function generateFeaturesSummaryCSV(
  features: VectorFeature[],
  layers: Layer[],
  geoTransform: GeoTransform
): string {
  const layerMap = new Map<string, Layer>();
  layers.forEach(l => layerMap.set(l.id, l));

  const rows: string[] = [
    'FEATURE_ID,FEATURE_NAME,LAYER,FEATURE_TYPE,NUM_VERTICES,IS_CLOSED,AREA_SQ_METERS,LENGTH_METERS'
  ];

  for (const feat of features) {
    const layer = layerMap.get(feat.layerId) || layers[0];
    const area = feat.properties.area_m2 || feat.properties.area_px || 0;
    const length = feat.properties.length_m || feat.properties.perimeter_px || 0;

    rows.push(
      `"${feat.id}","${feat.name || 'Feature'}","${layer.name}","${layer.featureType}",${feat.points.length},${feat.closed ? 'YES' : 'NO'},${area},${length}`
    );
  }

  return rows.join('\r\n');
}
