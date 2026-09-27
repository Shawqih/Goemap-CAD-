import { Point, VectorFeature, VectorizationConfig, Layer } from '../types/cad';

export interface ProcessProgress {
  stage: string;
  stageAr: string;
  percent: number;
}

/**
 * Calculates perpendicular distance from point P to line segment AB
 */
function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const px = p.x - a.x;
    const py = p.y - a.y;
    return Math.sqrt(px * px + py * py);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const rx = p.x - projX;
  const ry = p.y - projY;
  return Math.sqrt(rx * rx + ry * ry);
}

/**
 * Douglas-Peucker Polyline Simplification Algorithm
 */
export function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [start, end];
  }
}

/**
 * Calculate polygon area using Shoelace formula
 */
export function calculatePolygonArea(points: Point[]): number {
  let area = 0;
  const n = points.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculate perimeter of points
 */
export function calculatePerimeter(points: Point[], closed: boolean): number {
  let perim = 0;
  const n = points.length;
  if (n < 2) return 0;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const j = (i + 1) % n;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    perim += Math.sqrt(dx * dx + dy * dy);
  }
  return perim;
}

/**
 * Otsu's Global Thresholding algorithm
 */
export function computeOtsuThreshold(gray: Uint8Array, totalPixels: number): number {
  const histogram = new Int32Array(256);
  for (let i = 0; i < totalPixels; i++) {
    histogram[gray[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * Orthogonalize building polylines (snap angles close to 90 degrees to clean CAD geometry)
 */
function orthogonalizePolygon(points: Point[]): Point[] {
  if (points.length < 4) return points;
  const result: Point[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    let diff = Math.abs(angle2 - angle1);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;

    // If angle is close to 90 degrees (between 78 and 102 degrees)
    const deg = (diff * 180) / Math.PI;
    if (Math.abs(deg - 90) < 14) {
      // Align segment to dominant cardinal or orthogonal axis
      if (Math.abs(dx1) > Math.abs(dy1)) {
        result.push({ x: curr.x, y: prev.y });
      } else {
        result.push({ x: prev.x, y: curr.y });
      }
    } else {
      result.push(curr);
    }
  }

  return result.length >= 3 ? result : points;
}

/**
 * Zhang-Suen Thinning / Skeletonization Algorithm for Roads
 */
function zhangSuenThinning(binary: Uint8Array, width: number, height: number): Uint8Array {
  const marker = new Uint8Array(width * height);
  const skeleton = new Uint8Array(binary);
  let changed = true;

  while (changed) {
    changed = false;

    // Step 1
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (skeleton[idx] === 0) continue;

        const p2 = skeleton[(y - 1) * width + x] ? 1 : 0;
        const p3 = skeleton[(y - 1) * width + (x + 1)] ? 1 : 0;
        const p4 = skeleton[y * width + (x + 1)] ? 1 : 0;
        const p5 = skeleton[(y + 1) * width + (x + 1)] ? 1 : 0;
        const p6 = skeleton[(y + 1) * width + x] ? 1 : 0;
        const p7 = skeleton[(y + 1) * width + (x - 1)] ? 1 : 0;
        const p8 = skeleton[y * width + (x - 1)] ? 1 : 0;
        const p9 = skeleton[(y - 1) * width + (x - 1)] ? 1 : 0;

        const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (b < 2 || b > 6) continue;

        let a = 0;
        const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        for (let k = 0; k < 8; k++) {
          if (neighbors[k] === 0 && neighbors[k + 1] === 1) a++;
        }
        if (a !== 1) continue;

        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;

        marker[idx] = 1;
        changed = true;
      }
    }

    for (let i = 0; i < width * height; i++) {
      if (marker[i] === 1) {
        skeleton[i] = 0;
        marker[i] = 0;
      }
    }

    // Step 2
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (skeleton[idx] === 0) continue;

        const p2 = skeleton[(y - 1) * width + x] ? 1 : 0;
        const p3 = skeleton[(y - 1) * width + (x + 1)] ? 1 : 0;
        const p4 = skeleton[y * width + (x + 1)] ? 1 : 0;
        const p5 = skeleton[(y + 1) * width + (x + 1)] ? 1 : 0;
        const p6 = skeleton[(y + 1) * width + x] ? 1 : 0;
        const p7 = skeleton[(y + 1) * width + (x - 1)] ? 1 : 0;
        const p8 = skeleton[y * width + (x - 1)] ? 1 : 0;
        const p9 = skeleton[(y - 1) * width + (x - 1)] ? 1 : 0;

        const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (b < 2 || b > 6) continue;

        let a = 0;
        const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        for (let k = 0; k < 8; k++) {
          if (neighbors[k] === 0 && neighbors[k + 1] === 1) a++;
        }
        if (a !== 1) continue;

        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;

        marker[idx] = 1;
        changed = true;
      }
    }

    for (let i = 0; i < width * height; i++) {
      if (marker[i] === 1) {
        skeleton[i] = 0;
        marker[i] = 0;
      }
    }
  }

  return skeleton;
}

/**
 * 8-Connected Contour Tracing (Moore-Neighbor Algorithm)
 */
function traceContours(
  binary: Uint8Array, 
  width: number, 
  height: number, 
  minArea: number, 
  epsilon: number,
  orthogonalize: boolean
): { polygon: Point[]; isClosed: boolean }[] {
  const visited = new Uint8Array(width * height);
  const contours: { polygon: Point[]; isClosed: boolean }[] = [];

  // 8-directional offsets (clockwise)
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = y * width + x;
      // Find unvisited border pixel (foreground pixel with at least one background 4-neighbor)
      if (binary[idx] === 255 && visited[idx] === 0) {
        const isBorder = 
          binary[idx - 1] === 0 || 
          binary[idx + 1] === 0 || 
          binary[idx - width] === 0 || 
          binary[idx + width] === 0;

        if (!isBorder) continue;

        // Trace contour
        const rawPoints: Point[] = [];
        let cx = x;
        let cy = y;
        let dir = 0;
        const maxSteps = 4000;
        let steps = 0;

        rawPoints.push({ x: cx, y: cy });
        visited[cy * width + cx] = 1;

        while (steps < maxSteps) {
          steps++;
          let found = false;
          // Search 8 neighbors starting from back-direction
          const searchStart = (dir + 5) % 8;
          for (let i = 0; i < 8; i++) {
            const checkDir = (searchStart + i) % 8;
            const nx = cx + dx[checkDir];
            const ny = cy + dy[checkDir];

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (binary[ny * width + nx] === 255) {
                cx = nx;
                cy = ny;
                dir = checkDir;
                found = true;
                break;
              }
            }
          }

          if (!found) break;

          // Check if returned to start point
          if (cx === x && cy === y) {
            break;
          }

          rawPoints.push({ x: cx, y: cy });
          visited[cy * width + cx] = 1;
        }

        if (rawPoints.length >= 8) {
          let simplified = douglasPeucker(rawPoints, epsilon);
          const area = calculatePolygonArea(simplified);

          if (area >= minArea) {
            if (orthogonalize) {
              simplified = orthogonalizePolygon(simplified);
            }
            contours.push({ polygon: simplified, isClosed: true });
          }
        }
      }
    }
  }

  return contours;
}

/**
 * Main Computer Vision Vectorization Engine
 * Runs completely locally on client ImageData
 */
export async function vectorizeImageData(
  imgData: ImageData,
  config: VectorizationConfig,
  layers: Layer[],
  onProgress?: (p: ProcessProgress) => void
): Promise<{ features: VectorFeature[]; processedPreviewUrl?: string }> {
  const { width, height, data } = imgData;
  const totalPixels = width * height;

  onProgress?.({ stage: 'Grayscale & Noise Filtering', stageAr: 'التحويل إلى تدرج الرمادي وتنقية التشويش', percent: 15 });
  await new Promise(r => setTimeout(r, 10));

  const gray = new Uint8Array(totalPixels);
  const greenIndex = new Float32Array(totalPixels);
  const blueDominance = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // ITU-R BT.601 luminance
    gray[i] = (r * 77 + g * 150 + b * 29) >> 8;

    // Excess Green Index (2G - R - B) for Vegetation
    greenIndex[i] = 2 * g - r - b;

    // Water Index proxy
    blueDominance[i] = b - Math.max(r, g);
  }

  // Denoise (3x3 Box blur or Gaussian approximation)
  if (config.noiseReduction > 0) {
    const temp = new Uint8Array(gray);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += temp[(y + ky) * width + (x + kx)];
          }
        }
        gray[y * width + x] = Math.round(sum / 9);
      }
    }
  }

  onProgress?.({ stage: 'Canny & Sobel Edge Detection', stageAr: 'كشف الحواف والتباين عبر Sobel/Canny', percent: 35 });
  await new Promise(r => setTimeout(r, 10));

  // Compute Sobel Gradients
  const gradMag = new Uint8Array(totalPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p00 = gray[(y - 1) * width + (x - 1)];
      const p01 = gray[(y - 1) * width + x];
      const p02 = gray[(y - 1) * width + (x + 1)];
      const p10 = gray[y * width + (x - 1)];
      const p12 = gray[y * width + (x + 1)];
      const p20 = gray[(y + 1) * width + (x - 1)];
      const p21 = gray[(y + 1) * width + x];
      const p22 = gray[(y + 1) * width + (x + 1)];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      const mag = Math.min(255, Math.abs(gx) + Math.abs(gy));
      gradMag[y * width + x] = mag;
    }
  }

  onProgress?.({ stage: 'Thresholding & Morphology', stageAr: 'التجزيء الثنائي والعمليات المورفولوجية', percent: 55 });
  await new Promise(r => setTimeout(r, 10));

  // Thresholding
  let thresh = config.manualThreshold;
  if (config.thresholdMode === 'otsu') {
    thresh = computeOtsuThreshold(gray, totalPixels);
  }

  const binary = new Uint8Array(totalPixels);
  const edgeSens = config.edgeSensitivity * 2.5;

  for (let i = 0; i < totalPixels; i++) {
    let isFeature = false;
    if (config.thresholdMode === 'adaptive') {
      isFeature = gradMag[i] > edgeSens || (config.invertColors ? gray[i] < thresh : gray[i] > thresh);
    } else {
      isFeature = config.invertColors ? gray[i] < thresh : gray[i] > thresh;
      if (gradMag[i] > edgeSens) isFeature = true;
    }
    binary[i] = isFeature ? 255 : 0;
  }

  // Morphological Closing: Dilation followed by Erosion to close gaps in building & road boundaries
  if (config.morphology === 'close' || config.morphology === 'none') {
    const dilated = new Uint8Array(binary);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (binary[y * width + x] === 255) {
          dilated[(y - 1) * width + x] = 255;
          dilated[(y + 1) * width + x] = 255;
          dilated[y * width + (x - 1)] = 255;
          dilated[y * width + (x + 1)] = 255;
        }
      }
    }
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const allSet = 
          dilated[(y - 1) * width + x] === 255 &&
          dilated[(y + 1) * width + x] === 255 &&
          dilated[y * width + (x - 1)] === 255 &&
          dilated[y * width + (x + 1)] === 255;
        binary[y * width + x] = allSet ? 255 : 0;
      }
    }
  }

  onProgress?.({ stage: 'Tracing Contours & Polylines', stageAr: 'تتبع الكنتورات وتوليد خطوط المتجهات', percent: 75 });
  await new Promise(r => setTimeout(r, 10));

  // Extract raw vector contours
  const rawContours = traceContours(
    binary, 
    width, 
    height, 
    config.minArea, 
    config.simplifyEpsilon,
    config.orthogonalizeBuildings
  );

  onProgress?.({ stage: 'Classifying Features & Layers', stageAr: 'تصنيف المعالم والطبقات (مباني، طرق، قطع أراضي)', percent: 90 });
  await new Promise(r => setTimeout(r, 10));

  // Layer lookups
  const buildingsLayer = layers.find(l => l.featureType === 'BUILDINGS') || layers[0];
  const roadsLayer = layers.find(l => l.featureType === 'ROADS') || layers[1];
  const parcelsLayer = layers.find(l => l.featureType === 'PARCELS') || layers[2];
  const vegLayer = layers.find(l => l.featureType === 'VEGETATION') || layers[3];
  const waterLayer = layers.find(l => l.featureType === 'WATER') || layers[4];
  const otherLayer = layers.find(l => l.featureType === 'OTHER') || layers[5];

  const features: VectorFeature[] = [];
  let buildingCount = 1;
  let roadCount = 1;
  let parcelCount = 1;
  let vegCount = 1;
  let waterCount = 1;

  for (const { polygon, isClosed } of rawContours) {
    if (polygon.length < 3) continue;

    const area = calculatePolygonArea(polygon);
    const perim = calculatePerimeter(polygon, isClosed);
    if (area < config.minArea) continue;

    // Feature Classification Logic
    // 1. Sample central pixels inside contour bounding box to check color attributes
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (const pt of polygon) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);
    const bboxArea = bboxW * bboxH;
    const rectangularity = area / bboxArea;
    const aspectRatio = Math.max(bboxW / bboxH, bboxH / bboxW);

    // Sample center point
    const centerX = Math.floor((minX + maxX) / 2);
    const centerY = Math.floor((minY + maxY) / 2);
    const centerIdx = Math.min(totalPixels - 1, Math.max(0, centerY * width + centerX));

    const avgGreen = greenIndex[centerIdx];
    const avgBlue = blueDominance[centerIdx];

    let assignedLayer = otherLayer;
    let featType = 'OTHER';
    let featName = `Feature #${features.length + 1}`;

    if (config.detectVegetation && avgGreen > 22) {
      assignedLayer = vegLayer;
      featType = 'VEGETATION';
      featName = `Vegetation Cluster #${vegCount++}`;
    } else if (config.detectWater && avgBlue > 25) {
      assignedLayer = waterLayer;
      featType = 'WATER';
      featName = `Water Body #${waterCount++}`;
    } else if (config.detectRoads && (aspectRatio > 3.5 || !isClosed)) {
      assignedLayer = roadsLayer;
      featType = 'ROADS';
      featName = `Road Segment #${roadCount++}`;
    } else if (config.detectBuildings && rectangularity > 0.45 && area > 200 && area < 150000) {
      assignedLayer = buildingsLayer;
      featType = 'BUILDINGS';
      featName = `Building Footprint #${buildingCount++}`;
    } else if (config.detectParcels && area >= 15000) {
      assignedLayer = parcelsLayer;
      featType = 'PARCELS';
      featName = `Parcel Lot #${parcelCount++}`;
    } else {
      assignedLayer = buildingsLayer;
      featType = 'BUILDINGS';
      featName = `Structure #${buildingCount++}`;
    }

    features.push({
      id: `feat_${Date.now()}_${features.length + 1}`,
      layerId: assignedLayer.id,
      name: featName,
      type: isClosed ? 'Polygon' : 'Polyline',
      points: polygon,
      closed: isClosed,
      properties: {
        area_px: Math.round(area),
        perimeter_px: Math.round(perim),
        rectangularity: Number(rectangularity.toFixed(3)),
        aspectRatio: Number(aspectRatio.toFixed(2)),
        detectedClass: featType
      }
    });
  }

  // Generate binary contour preview data URL for inspection
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = width;
  previewCanvas.height = height;
  const pctx = previewCanvas.getContext('2d');
  if (pctx) {
    const previewImg = pctx.createImageData(width, height);
    for (let i = 0; i < totalPixels; i++) {
      const val = binary[i];
      const pidx = i * 4;
      previewImg.data[pidx] = val;
      previewImg.data[pidx + 1] = val;
      previewImg.data[pidx + 2] = val;
      previewImg.data[pidx + 3] = 255;
    }
    pctx.putImageData(previewImg, 0, 0);
  }
  const processedPreviewUrl = previewCanvas.toDataURL('image/png');

  onProgress?.({ stage: 'Completed', stageAr: 'اكتملت المعالجة واستخراج المتجهات بنجاح', percent: 100 });

  return { features, processedPreviewUrl };
}
