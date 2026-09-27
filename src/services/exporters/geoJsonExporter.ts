import { VectorFeature, Layer, GeoTransform } from '../../types/cad';
import { pixelToMap } from '../georeference';

export function generateGeoJSON(
  features: VectorFeature[],
  layers: Layer[],
  geoTransform: GeoTransform
): string {
  const layerMap = new Map<string, Layer>();
  layers.forEach(l => layerMap.set(l.id, l));

  const geoJsonFeatures = features.map(feat => {
    const layer = layerMap.get(feat.layerId) || layers[0];
    
    // Transform coordinates
    const coords = feat.points.map(pt => {
      if (geoTransform.isCalibrated) {
        const mapPt = pixelToMap(pt, geoTransform);
        return [Number(mapPt.x.toFixed(6)), Number(mapPt.y.toFixed(6))];
      }
      return [Number(pt.x.toFixed(2)), Number(pt.y.toFixed(2))];
    });

    let geometry: any;

    if (feat.closed && coords.length >= 3) {
      // Ensure outer ring is closed
      const ring = [...coords];
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([...first]);
      }
      geometry = {
        type: 'Polygon',
        coordinates: [ring]
      };
    } else {
      geometry = {
        type: 'LineString',
        coordinates: coords
      };
    }

    return {
      type: 'Feature',
      id: feat.id,
      geometry,
      properties: {
        id: feat.id,
        name: feat.name || 'Feature',
        layer: layer.name,
        featureType: layer.featureType,
        color: layer.color,
        area_m2: feat.properties.area_m2 || feat.properties.area_px || 0,
        length_m: feat.properties.length_m || feat.properties.perimeter_px || 0,
        ...feat.properties
      }
    };
  });

  const collection = {
    type: 'FeatureCollection',
    name: 'GeoVector_Export',
    crs: {
      type: 'name',
      properties: {
        name: `urn:ogc:def:crs:EPSG::${geoTransform.epsg}`
      }
    },
    features: geoJsonFeatures
  };

  return JSON.stringify(collection, null, 2);
}
