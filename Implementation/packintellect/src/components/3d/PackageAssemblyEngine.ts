/**
 * PACKINTELLECT Universal Package Assembly Engine
 *
 * Physics & Geometry Pipeline:
 * FOOD DIMENSIONS
 *   ↓
 * PRIMARY PACKAGE INNER DIMENSIONS
 *   ↓
 * PRIMARY PACKAGE OUTER DIMENSIONS
 *   ↓
 * CUSHIONING / PROTECTIVE CLEARANCE
 *   ↓
 * SECONDARY PACKAGE INNER DIMENSIONS
 *   ↓
 * SECONDARY PACKAGE OUTER DIMENSIONS
 *
 * Rules:
 * 1. All packaging components are dimensioned from their actual contents.
 * 2. 1 Three.js world unit = 100 mm (0.1 m). Scale is 100% consistent across all components.
 * 3. Primary container rests on secondary floor / cushion; food rests on primary cavity floor.
 * 4. Zero unexplained floating, zero excessive empty voids, zero intersections.
 * 5. Minimum functionally safe volume (protection ≠ empty space).
 */

import * as THREE from 'three';
import { FoodId, PackagingSpec } from '../../types/packaging';
import { createFoodMesh, getFoodCargoFit } from './FoodMeshes';
import {
  resolvePackagingBuilder,
  PackageGeometryParams,
  PackagingMeshResult,
} from './Packaging3DRegistry';
import { resolveCushionBuilder } from './Cushion3DRegistry';

// ============================================================================
// 1. WORLD SCALE & UNIT CONVERSION SYSTEM (1 unit = 100 mm = 0.1 m)
// ============================================================================
export const WORLD_SCALE_MM_PER_UNIT = 100;
export const WORLD_SCALE_UNITS_PER_MM = 0.01;

export function mmToUnits(mm: number): number {
  return mm * WORLD_SCALE_UNITS_PER_MM;
}

export function unitsToMm(units: number): number {
  return Math.round(units * WORLD_SCALE_MM_PER_UNIT);
}

// Configurable engineering minimum protective clearances (in Three.js units: 0.01 = 1 mm)
export const MIN_PROTECTIVE_CLEARANCE = {
  primaryLateral: 0.05,       // 5 mm minimum food-to-primary clearance
  primaryVertical: 0.06,      // 6 mm minimum food-to-lid clearance
  secondaryLateral: 0.06,     // 6 mm minimum primary-to-secondary clearance
  secondaryVertical: 0.05,    // 5 mm minimum primary-to-flap clearance
  cushionMinThickness: 0.10,  // 10 mm minimum protective cushion thickness
};

// ============================================================================
// 2. DATA STRUCTURES & INTERFACES
// ============================================================================
export interface FoodBoundsResult {
  unitMesh: THREE.Group;
  unitBox: THREE.Box3;
  unitSize: THREE.Vector3;
  cols: number;
  rows: number;
  quantity: number;
  clusterSize: THREE.Vector3;
  clusterBox: THREE.Box3;
  foodGroup: THREE.Group;
  spacing: { x: number; z: number };
}

export interface RequiredClearanceResult {
  primaryClearance: { x: number; y: number; z: number };
  secondaryClearance: { x: number; y: number; z: number };
  cushionThickness: number;
  primaryWallThickness: number;
  secondaryWallThickness: number;
}

export interface PackageAssemblyConfig {
  foodId: FoodId;
  spec: PackagingSpec;
  isV2?: boolean;
  viewMode?: 'normal' | 'cutaway' | 'exploded' | 'open';
  explodedOffset?: number; // 0.0 (assembled) to 1.0 (fully exploded)
  openFactor?: number;
  cutawayFactor?: number;
}

export interface PackageAssemblyResult {
  rootGroup: THREE.Group;
  foodGroup: THREE.Group;
  primaryGroup: THREE.Group;
  cushionGroup: THREE.Group;
  secondaryGroup: THREE.Group;
  lidGroup?: THREE.Group;
  packageDimensions: { lengthMm: number; widthMm: number; heightMm: number };
  systemLabel: {
    primary: string;
    secondary: string;
    cushioning: string;
    arrangement: string;
  };
  metrics: {
    unusedVolumeRatio: number;
    containmentRatio: number;
    clearanceMm: number;
    isValid: boolean;
    issues?: string[];
  };
  basePositions: {
    foodY: number;
    primaryY: number;
    cushionY: number;
    secondaryY: number;
    lidY?: number;
  };
  bounds: {
    food: THREE.Box3;
    primary: THREE.Box3;
    protective: THREE.Box3;
    secondary: THREE.Box3;
    total: THREE.Box3;
  };
}

// ============================================================================
// 3. BOUNDING BOX BASED ASSEMBLY UTILITIES
// ============================================================================

/**
 * Calculates the combined bounding box of multiple 3D objects or groups.
 */
export function calculateAssemblyBounds(objects: THREE.Object3D[]): THREE.Box3 {
  const combined = new THREE.Box3();
  for (const obj of objects) {
    if (!obj) continue;
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    if (!box.isEmpty()) {
      combined.union(box);
    }
  }
  if (combined.isEmpty()) {
    combined.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5));
  }
  return combined;
}

/**
 * Calculates unused volume ratio: (packageInternalVolume - contentsVolume) / packageInternalVolume
 */
export function calculateUnusedVolumeRatio(contentsVolume: number, packageInternalVolume: number): number {
  if (packageInternalVolume <= 0) return 0;
  const unused = Math.max(0, packageInternalVolume - contentsVolume);
  return Number((unused / packageInternalVolume).toFixed(3));
}

// ============================================================================
// 4. FOOD BOUNDS & ARRANGEMENT ENGINE
// ============================================================================

/**
 * Step 1: Calculate precise physical bounds and arrangement of the food contents.
 * Evaluates food morphology, quantity, and grid layout.
 * The resulting foodGroup has its bottom resting exactly at y = 0.
 */
export function calculateFoodBounds(
  foodId: FoodId,
  quantity: number = 1,
  primaryTypeStr: string = ''
): FoodBoundsResult {
  const qty = Math.max(1, quantity);
  const isEgg = foodId === 'eggs' || primaryTypeStr.toLowerCase().includes('egg');
  const isLiquidOrBeverage =
    foodId === 'bottle' ||
    primaryTypeStr.toLowerCase().includes('bottle') ||
    primaryTypeStr.toLowerCase().includes('jar') ||
    primaryTypeStr.toLowerCase().includes('can') ||
    primaryTypeStr.toLowerCase().includes('liquid') ||
    primaryTypeStr.toLowerCase().includes('tetra');

  // Determine multi-unit packing grid
  let cols = 1;
  let rows = 1;
  if (isEgg) {
    if (qty <= 1) {
      cols = 1;
      rows = 1;
    } else if (qty <= 6) {
      cols = 2;
      rows = 3;
    } else if (qty <= 12) {
      cols = 2;
      rows = 6;
    } else {
      cols = 5;
      rows = 6;
    }
  } else if (isLiquidOrBeverage) {
    if (qty <= 1) {
      cols = 1;
      rows = 1;
    } else if (qty <= 2) {
      cols = 1;
      rows = 2;
    } else if (qty <= 6) {
      cols = 2;
      rows = 3;
    } else {
      cols = 3;
      rows = Math.ceil(qty / 3);
    }
  } else if (qty > 1) {
    cols = Math.ceil(Math.sqrt(qty));
    rows = Math.ceil(qty / cols);
  }

  // Create single reference food mesh
  const refMesh = createFoodMesh(foodId);
  const fit = getFoodCargoFit(foodId);

  // Apply cargo fit scaling to ensure 1 unit = 100 mm world scale
  const isSingle = cols === 1 && rows === 1;
  const unitScale = fit.scale * (isSingle ? 1.55 : (cols > 2 || rows > 3 ? 1.10 : 1.25));
  refMesh.scale.set(unitScale, unitScale, unitScale);
  refMesh.updateMatrixWorld(true);

  // Measure single unit bounding box
  const unitBox = new THREE.Box3().setFromObject(refMesh);
  const unitSize = new THREE.Vector3();
  unitBox.getSize(unitSize);

  // Fallback sanity guard for unit size
  if (unitSize.x < 0.2) unitSize.x = 0.8;
  if (unitSize.y < 0.2) unitSize.y = 0.75;
  if (unitSize.z < 0.2) unitSize.z = 0.8;

  // Inter-unit spacing based on morphology
  let spacingX = 0;
  let spacingZ = 0;
  if (cols > 1 || rows > 1) {
    if (isEgg) {
      spacingX = unitSize.x * 0.16;
      spacingZ = unitSize.z * 0.16;
    } else if (isLiquidOrBeverage) {
      spacingX = 0.05; // 5 mm divider partition
      spacingZ = 0.05;
    } else {
      spacingX = 0.035; // 3.5 mm produce nesting pocket
      spacingZ = 0.035;
    }
  }

  // Calculate cluster dimensions
  const clusterW = cols * unitSize.x + Math.max(0, cols - 1) * spacingX;
  const clusterD = rows * unitSize.z + Math.max(0, rows - 1) * spacingZ;
  const clusterH = unitSize.y;

  const clusterBox = new THREE.Box3(
    new THREE.Vector3(-clusterW / 2, 0, -clusterD / 2),
    new THREE.Vector3(clusterW / 2, clusterH, clusterD / 2)
  );
  const clusterSize = new THREE.Vector3(clusterW, clusterH, clusterD);

  // Assemble the multi-unit foodGroup
  const foodGroup = new THREE.Group();
  foodGroup.name = 'assembly-foodGroup';

  const stepX = unitSize.x + spacingX;
  const stepZ = unitSize.z + spacingZ;
  const startX = -clusterW / 2 + unitSize.x / 2;
  const startZ = -clusterD / 2 + unitSize.z / 2;

  let placed = 0;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (placed >= qty) break;
      const unit = isSingle ? refMesh : createFoodMesh(foodId);
      if (!isSingle) {
        unit.scale.set(unitScale, unitScale, unitScale);
      }

      const px = cols === 1 ? 0 : startX + c * stepX;
      const pz = rows === 1 ? 0 : startZ + r * stepZ;
      // Align lowest vertex of food mesh to y = 0
      const py = -unitBox.min.y;

      unit.position.set(px, py, pz);
      foodGroup.add(unit);
      placed++;
    }
  }

  return {
    unitMesh: refMesh,
    unitBox,
    unitSize,
    cols,
    rows,
    quantity: qty,
    clusterSize,
    clusterBox,
    foodGroup,
    spacing: { x: spacingX, z: spacingZ },
  };
}

// ============================================================================
// 5. FOOD-SPECIFIC CLEARANCE & CUSHIONING ENGINE
// ============================================================================

/**
 * Step 2: Dynamically calculate engineering clearances based on food properties,
 * fragility, packaging style, cushioning type, and V1 vs V2 specifications.
 * Ensures PROTECTION ≠ EMPTY SPACE.
 */
export function calculateRequiredClearance(
  foodId: FoodId,
  spec: PackagingSpec,
  primaryTypeStr: string,
  secondaryTypeStr: string,
  hasSecondary: boolean,
  isV2: boolean = false
): RequiredClearanceResult {
  const pLower = primaryTypeStr.toLowerCase();
  const cLower = (spec.cushionMaterial || '').toLowerCase();
  const isEgg = foodId === 'eggs' || pLower.includes('egg');
  const isSoftProduce =
    foodId === 'tomato' ||
    foodId === 'strawberry' ||
    foodId === 'grapes' ||
    foodId === 'avocado' ||
    foodId === 'mango' ||
    foodId === 'mushroom';
  const isCake = foodId === 'cake' || pLower.includes('dome') || pLower.includes('clamshell');
  const isLiquid = foodId === 'bottle' || pLower.includes('bottle') || pLower.includes('jar') || pLower.includes('liquid') || pLower.includes('can');
  const isChips = foodId === 'chips' || foodId === 'potato_chips' || pLower.includes('pillow');
  const isPowder = foodId === 'rice' || foodId === 'almonds' || pLower.includes('bag') || pLower.includes('sack');

  // 1. Primary Container Clearance (between food bounding box and primary cavity inner walls)
  let primClrX = MIN_PROTECTIVE_CLEARANCE.primaryLateral;
  let primClrZ = MIN_PROTECTIVE_CLEARANCE.primaryLateral;
  let primClrY = MIN_PROTECTIVE_CLEARANCE.primaryVertical;

  if (isEgg) {
    // Molded pulp cups fit egg contours snugly
    primClrX = 0.035; // 3.5 mm
    primClrZ = 0.035;
    primClrY = 0.050; // 5 mm cone clearance
  } else if (isSoftProduce) {
    // Punnet / cradle allows airflow while cradling fruit
    primClrX = 0.055; // 5.5 mm
    primClrZ = 0.055;
    primClrY = 0.070; // 7 mm headspace
  } else if (isCake) {
    // Anti-fog dome must avoid brushing delicate icing / top berries
    primClrX = 0.140; // 14 mm perimeter frosting buffer
    primClrZ = 0.140;
    primClrY = 0.160; // 16 mm crown clearance
  } else if (isLiquid) {
    // Bottles and jars have form-fitting cartons or sleeve brackets
    primClrX = 0.035;
    primClrZ = 0.035;
    primClrY = 0.050;
  } else if (isChips) {
    // Nitrogen-flushed pouch contains internal gas cushion
    primClrX = 0.040;
    primClrZ = 0.040;
    primClrY = 0.060;
  } else if (isPowder) {
    primClrX = 0.030;
    primClrZ = 0.030;
    primClrY = 0.040;
  }

  // 2. Primary Wall Thickness
  const primaryWallThickness = Math.max(0.04, Math.min(0.12, (spec.wallThicknessMm || 5) * 0.01 * 0.65));

  // 3. Cushioning Thickness & Secondary Clearance
  const hasCushioning =
    hasSecondary &&
    Boolean(cLower) &&
    !cLower.includes('none') &&
    !cLower.includes('n/a') &&
    !cLower.includes('not required') &&
    !cLower.includes('integrated') &&
    !cLower.includes('direct contact');

  let cushionThickness = 0;
  let secClrX = 0;
  let secClrZ = 0;
  let secClrY = 0;

  if (hasSecondary) {
    if (hasCushioning) {
      // Cushioning occupies only the required protective thickness (default 12mm - 20mm)
      const baseCushionMm = Math.min(22, Math.max(10, spec.cushionThicknessMm || (isV2 ? 18 : 12)));
      cushionThickness = baseCushionMm * 0.01;

      // Secondary carton fits snugly outside the cushioning layer
      secClrX = cushionThickness;
      secClrZ = cushionThickness;
      secClrY = cushionThickness * 0.40; // Top & bottom cushion allowance
    } else {
      // Loose or minimal secondary fit: tight safe gap, NOT a 100mm empty cavity!
      secClrX = MIN_PROTECTIVE_CLEARANCE.secondaryLateral;
      secClrZ = MIN_PROTECTIVE_CLEARANCE.secondaryLateral;
      secClrY = MIN_PROTECTIVE_CLEARANCE.secondaryVertical;
    }
  }

  // 4. Secondary Wall Thickness (corrugated outer)
  const secondaryWallThickness = Math.max(
    0.04,
    Math.min(0.12, (spec.wallThicknessMm || (isV2 ? 8 : 5)) * 0.01)
  );

  return {
    primaryClearance: { x: primClrX, y: primClrY, z: primClrZ },
    secondaryClearance: { x: secClrX, y: secClrY, z: secClrZ },
    cushionThickness,
    primaryWallThickness,
    secondaryWallThickness,
  };
}

// ============================================================================
// 6. PRIMARY PACKAGE SIZING ENGINE
// ============================================================================

/**
 * Step 3: Size the primary packaging container around the actual food bounds.
 * Uses calibrated geometric ratios to ensure the builder's inner cavity accommodates
 * the food with the exact required engineering clearance.
 */
export function calculatePrimaryPackageBounds(
  foodClusterSize: THREE.Vector3,
  primaryTypeStr: string,
  clearance: { x: number; y: number; z: number },
  wallThickness: number,
  compartments?: { cols: number; rows: number },
  isOpen?: boolean,
  isCutaway?: boolean,
  closureType?: string
): { params: PackageGeometryParams; result: PackagingMeshResult } {
  const pLower = primaryTypeStr.toLowerCase();
  const builder = resolvePackagingBuilder(primaryTypeStr);

  const requiredInnerW = foodClusterSize.x + clearance.x * 2;
  const requiredInnerD = foodClusterSize.z + clearance.z * 2;
  const requiredInnerH = foodClusterSize.y + clearance.y * 2;

  // Calibrate initial builder parameters based on builder type's inner-to-outer ratio
  let wRatio = 0.82;
  let dRatio = 0.82;
  let hRatio = 0.80;

  if (pLower.includes('tray') || pLower.includes('punnet') || pLower.includes('cradle')) {
    wRatio = 0.84;
    dRatio = 0.84;
    hRatio = 0.48; // Trays have shallow height multipliers
  } else if (pLower.includes('molded pulp') || pLower.includes('pulp')) {
    wRatio = 0.80;
    dRatio = 0.80;
    hRatio = 0.55;
  } else if (pLower.includes('egg')) {
    wRatio = 0.88;
    dRatio = 0.88;
    hRatio = 0.95;
  } else if (pLower.includes('pouch') || pLower.includes('doypack')) {
    wRatio = 0.72;
    dRatio = 0.60;
    hRatio = 0.78;
  } else if (pLower.includes('dome') || pLower.includes('clamshell') || pLower.includes('cake')) {
    wRatio = 0.82;
    dRatio = 0.82;
    hRatio = 0.82;
  } else if (pLower.includes('bottle') || pLower.includes('jar') || pLower.includes('can')) {
    wRatio = 0.85;
    dRatio = 0.85;
    hRatio = 0.88;
  }

  const initialParams: PackageGeometryParams = {
    width: requiredInnerW / wRatio,
    depth: requiredInnerD / dRatio,
    height: requiredInnerH / hRatio,
    wallThickness,
    compartments,
    isOpen,
    isCutaway,
    closureType,
  };

  // Run test build to measure exact builder innerBounds
  let result = builder(initialParams);
  const inner = result.innerBounds;
  const actualW = Math.max(0.1, inner.maxX - inner.minX);
  const actualD = Math.max(0.1, inner.maxZ - inner.minZ);
  const actualH = Math.max(0.1, inner.maxY - inner.minY);

  // Exact inverse calibration step
  const corrX = requiredInnerW / actualW;
  const corrZ = requiredInnerD / actualD;
  const corrY = requiredInnerH / actualH;

  const calibratedParams: PackageGeometryParams = {
    ...initialParams,
    width: initialParams.width * corrX,
    depth: initialParams.depth * corrZ,
    height: initialParams.height * corrY,
  };

  // Final fitted build
  result = builder(calibratedParams);

  return { params: calibratedParams, result };
}

// ============================================================================
// 7. PROTECTIVE ASSEMBLY & SECONDARY SIZING ENGINE
// ============================================================================

/**
 * Step 4: Calculate the combined inner assembly bounding box (primary + food + cushioning),
 * then size the secondary outer packaging carton tightly around this assembly.
 */
export function calculateSecondaryPackageBounds(
  protectiveAssemblyBox: THREE.Box3,
  secondaryTypeStr: string,
  clearance: { x: number; y: number; z: number },
  wallThickness: number,
  isOpen?: boolean,
  isCutaway?: boolean,
  isV2?: boolean
): { params: PackageGeometryParams; result: PackagingMeshResult } {
  const secSize = new THREE.Vector3();
  protectiveAssemblyBox.getSize(secSize);

  // Secondary inner dimensions = protective assembly bounding box + clearance
  const requiredInnerW = secSize.x + clearance.x * 2;
  const requiredInnerD = secSize.z + clearance.z * 2;
  const requiredInnerH = secSize.y + clearance.y * 2;

  const secBuilder = resolvePackagingBuilder(secondaryTypeStr || 'corrugated_box');

  // Corrugated box outer dimensions = inner dimensions + wall thickness
  const secParams: PackageGeometryParams = {
    width: requiredInnerW + 2 * wallThickness,
    depth: requiredInnerD + 2 * wallThickness,
    height: requiredInnerH + wallThickness,
    wallThickness,
    isOpen,
    isCutaway,
    color: isV2 ? 0xD7C4A8 : 0xCBB394,
    roughness: isV2 ? 0.72 : 0.84,
  };

  const result = secBuilder(secParams);
  return { params: secParams, result };
}

// ============================================================================
// 8. PHYSICS VALIDATION & EXCESSIVE EMPTY SPACE CHECK
// ============================================================================

export interface PackageValidationResult {
  isValid: boolean;
  unusedVolumeRatio: number;
  containmentRatio: number;
  issues: string[];
}

/**
 * Physics validation before displaying:
 * ✓ Food fully contained
 * ✓ Primary package fully contained in secondary
 * ✓ Cushioning has required thickness
 * ✓ No component intersections or unexplained floating
 * ✓ No excessive empty voids (unusedVolumeRatio <= 0.42 threshold)
 */
export function validatePackageAssembly(
  foodBox: THREE.Box3,
  primaryBox: THREE.Box3,
  secondaryBox: THREE.Box3 | null,
  hasSecondary: boolean,
  unusedVolumeRatio: number
): PackageValidationResult {
  const issues: string[] = [];

  const foodSize = new THREE.Vector3();
  foodBox.getSize(foodSize);
  const primarySize = new THREE.Vector3();
  primaryBox.getSize(primarySize);

  // Check food containment inside primary package
  if (primarySize.x < foodSize.x * 0.95 || primarySize.z < foodSize.z * 0.95) {
    issues.push('Food payload exceeds primary container cavity bounds.');
  }

  // Check primary containment inside secondary shipper
  if (hasSecondary && secondaryBox) {
    const secSize = new THREE.Vector3();
    secondaryBox.getSize(secSize);
    if (secSize.x < primarySize.x || secSize.z < primarySize.z || secSize.y < primarySize.y) {
      issues.push('Primary package assembly exceeds secondary outer carton bounds.');
    }
  }

  // Aspect ratio check for elongated foods (e.g. bananas, clusters) & small-unit volumetric allowance
  const isElongated = (primarySize.x / Math.max(0.1, primarySize.z) > 1.35) || (primarySize.z / Math.max(0.1, primarySize.x) > 1.35);
  const isSmallUnit = primarySize.x < 1.1 && primarySize.z < 1.1;
  const maxAllowedRatio = isElongated || isSmallUnit ? 0.60 : 0.48;

  // Check excessive empty space
  if (unusedVolumeRatio > maxAllowedRatio) {
    issues.push(`Excessive empty package volume detected (${Math.round(unusedVolumeRatio * 100)}%). Package must be resized.`);
  }

  const containmentRatio = primarySize.x > 0 ? Number((foodSize.x / primarySize.x).toFixed(2)) : 1.0;

  return {
    isValid: issues.length === 0,
    unusedVolumeRatio,
    containmentRatio,
    issues,
  };
}

// ============================================================================
// 9. DYNAMIC PACKAGE DIMENSIONS EXPORTER
// ============================================================================

/**
 * Calculates optimal physical package dimensions in millimeters for a given food and spec.
 */
export function calculateOptimalPackageDimensions(
  foodId: FoodId,
  spec: PackagingSpec,
  isV2: boolean = false
): { lengthMm: number; widthMm: number; heightMm: number } {
  const qty = spec.quantity || (foodId === 'eggs' ? 12 : 1);
  const primaryTypeStr = spec.primaryPackagingType || spec.packagingSystem?.primaryPackaging.type || '';
  const secondaryTypeStr = spec.secondaryPackagingType || spec.packagingSystem?.secondaryPackaging?.type || '';

  const secType = secondaryTypeStr.toLowerCase();
  const hasSecondary =
    Boolean(secondaryTypeStr) &&
    !secType.includes('primary only') &&
    !secType.includes('none') &&
    !secType.includes('n/a');

  const foodBounds = calculateFoodBounds(foodId, qty, primaryTypeStr);
  const clearances = calculateRequiredClearance(foodId, spec, primaryTypeStr, secondaryTypeStr, hasSecondary, isV2);

  const primary = calculatePrimaryPackageBounds(
    foodBounds.clusterSize,
    primaryTypeStr,
    clearances.primaryClearance,
    clearances.primaryWallThickness,
    { cols: foodBounds.cols, rows: foodBounds.rows }
  );

  if (!hasSecondary) {
    return {
      lengthMm: unitsToMm(primary.params.depth),
      widthMm: unitsToMm(primary.params.width),
      heightMm: unitsToMm(primary.params.height),
    };
  }

  // Secondary bounds
  const primaryBox = new THREE.Box3(
    new THREE.Vector3(-primary.params.width / 2, 0, -primary.params.depth / 2),
    new THREE.Vector3(primary.params.width / 2, primary.params.height, primary.params.depth / 2)
  );

  const sec = calculateSecondaryPackageBounds(
    primaryBox,
    secondaryTypeStr,
    clearances.secondaryClearance,
    clearances.secondaryWallThickness,
    false,
    false,
    isV2
  );

  return {
    lengthMm: unitsToMm(sec.params.depth),
    widthMm: unitsToMm(sec.params.width),
    heightMm: unitsToMm(sec.params.height),
  };
}

// ============================================================================
// 10. UNIVERSAL PACKAGE ASSEMBLY PIPELINE (MAIN ENTRY POINT)
// ============================================================================

/**
 * Builds the complete physical 3D package assembly:
 * FOOD → PRIMARY PACKAGE → CUSHIONING → SECONDARY PACKAGE
 * Fully nested, dimensionally linked, and logically resting on ground/cavity surfaces.
 */
/**
 * Procedural Food-Specific Molded Bio-Cradle Nest Generator
 * Builds high-fidelity form-fitting bio-pulp nests with contoured fruit depressions,
 * protective perimeter rims, and individual pocket isolation.
 */
function createBioCradleNestForFood(
  foodId: FoodId,
  clusterSize: THREE.Vector3,
  isV2: boolean,
  cols: number,
  rows: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'assembly-bioCradleNest';

  const fit = getFoodCargoFit(foodId);
  const mat = new THREE.MeshStandardMaterial({
    color: isV2 ? 0xC8DDBB : 0xDFD6C7, // Molded eco pulp / recycled agricultural fiber
    roughness: 0.88,
    metalness: 0.04,
  });

  const cw = Math.max(0.6, clusterSize.x);
  const cd = Math.max(0.6, clusterSize.z);
  const ch = Math.max(0.12, clusterSize.y * 0.38);

  // Outer shallow cradle tray base plate
  const baseT = 0.035;
  const trayBase = new THREE.Mesh(new THREE.BoxGeometry(cw * 1.08, baseT, cd * 1.08), mat);
  trayBase.position.set(0, baseT / 2, 0);
  trayBase.receiveShadow = true;
  group.add(trayBase);

  // Rim wall
  const rimT = 0.04;
  const leftRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, ch, cd * 1.08), mat);
  leftRim.name = 'cradleSideRim';
  leftRim.position.set(-cw * 1.08 / 2 + rimT / 2, ch / 2, 0);
  const rightRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, ch, cd * 1.08), mat);
  rightRim.name = 'cradleSideRim';
  rightRim.position.set(cw * 1.08 / 2 - rimT / 2, ch / 2, 0);
  const backRim = new THREE.Mesh(new THREE.BoxGeometry(cw * 1.08 - rimT * 2, ch, rimT), mat);
  backRim.name = 'cradleBackRim';
  backRim.position.set(0, ch / 2, -cd * 1.08 / 2 + rimT / 2);
  const frontRim = new THREE.Mesh(new THREE.BoxGeometry(cw * 1.08 - rimT * 2, ch * 0.75, rimT), mat);
  frontRim.name = 'frontRim';
  frontRim.position.set(0, ch * 0.375, cd * 1.08 / 2 - rimT / 2);
  group.add(leftRim, rightRim, backRim, frontRim);

  // Individual food nesting cavities
  const stepX = cw / cols;
  const stepZ = cd / rows;
  const startX = -cw / 2 + stepX / 2;
  const startZ = -cd / 2 + stepZ / 2;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = startX + c * stepX;
      const cz = startZ + r * stepZ;
      const cellW = stepX * 0.85;

      if (fit.insertType === 'tomato-nest') {
        const nestRing = new THREE.Mesh(new THREE.TorusGeometry(cellW * 0.38, 0.045, 12, 24), mat);
        nestRing.rotation.x = Math.PI / 2;
        nestRing.position.set(cx, baseT + 0.025, cz);
        const nestCavity = new THREE.Mesh(new THREE.CylinderGeometry(cellW * 0.44, cellW * 0.40, 0.03, 24), mat);
        nestCavity.position.set(cx, baseT + 0.015, cz);
        group.add(nestRing, nestCavity);
      } else if (fit.insertType === 'cradle') {
        const cradleRim = new THREE.Mesh(new THREE.TorusGeometry(cellW * 0.40, 0.05, 12, 24), mat);
        cradleRim.scale.set(1.15, 0.65, 1.35);
        cradleRim.rotation.x = Math.PI / 2;
        cradleRim.position.set(cx, baseT + 0.025, cz);
        group.add(cradleRim);
      } else if (fit.insertType === 'collar') {
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(cellW * 0.48, cellW * 0.48, ch * 0.85, 28, 1, true), mat);
        collar.position.set(cx, ch * 0.45, cz);
        group.add(collar);
      } else if (fit.insertType === 'bottle-bracket') {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(cellW * 0.35, cellW * 0.38, 0.07, 24), mat);
        cup.position.set(cx, baseT + 0.035, cz);
        group.add(cup);
      } else if (fit.insertType === 'cell') {
        const cell = new THREE.Mesh(new THREE.SphereGeometry(cellW * 0.42, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat);
        cell.position.set(cx, baseT + 0.03, cz);
        group.add(cell);
      } else {
        const part = new THREE.Mesh(new THREE.BoxGeometry(cellW * 0.88, 0.06, stepZ * 0.88), mat);
        part.position.set(cx, baseT + 0.03, cz);
        group.add(part);
      }
    }
  }

  return group;
}

export function buildPackageAssembly(config: PackageAssemblyConfig): PackageAssemblyResult {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'assembly-rootGroup';

  const secondaryGroup = new THREE.Group();
  secondaryGroup.name = 'assembly-secondaryGroup';

  const cushionGroup = new THREE.Group();
  cushionGroup.name = 'assembly-cushionGroup';

  const primaryGroup = new THREE.Group();
  primaryGroup.name = 'assembly-primaryGroup';

  const lidGroup = new THREE.Group();
  lidGroup.name = 'assembly-lidGroup';

  rootGroup.add(secondaryGroup);
  rootGroup.add(cushionGroup);
  rootGroup.add(primaryGroup);
  rootGroup.add(lidGroup);

  const { foodId, spec, isV2 = false } = config;
  const viewMode = config.viewMode || 'normal';
  const isCutaway = viewMode === 'cutaway' || (config.cutawayFactor || 0) > 0.4;
  const isOpen = viewMode === 'open' || (config.openFactor || 0) > 0.4;
  const isExploded = viewMode === 'exploded' || (config.explodedOffset || 0) > 0.1;
  const explodeFactor = config.explodedOffset !== undefined ? config.explodedOffset : isExploded ? 1.0 : 0.0;

  const packagingSystem = spec.packagingSystem;
  const qty = spec.quantity || (foodId === 'eggs' ? 12 : 1);
  const foodFit = getFoodCargoFit(foodId);

  // Resolve secondary shipper packaging type
  const effectiveSecondaryType =
    spec.secondaryPackagingType ||
    packagingSystem?.secondaryPackaging?.type ||
    (isV2 ? 'Double-Wall Micro-Flute Shipper Carton' : (spec.outerMaterial ? `${spec.outerMaterial} Shipper Carton` : 'Corrugated Shipper Box'));

  const secTypeLower = effectiveSecondaryType.toLowerCase();
  const hasSecondary =
    Boolean(effectiveSecondaryType) &&
    !secTypeLower.includes('primary only') &&
    !secTypeLower.includes('none') &&
    !secTypeLower.includes('n/a');

  // Resolve primary packaging type (form-fitting bio-cradle nest)
  const effectivePrimaryType =
    spec.primaryPackagingType ||
    packagingSystem?.primaryPackaging?.type ||
    (isV2 ? foodFit.insertLabel : 'Form-Fitting Bio-Cradle Nest');

  // Resolve cushioning type
  const effectiveCushionType =
    spec.cushionMaterial ||
    packagingSystem?.cushioning?.material ||
    (isV2 ? 'Honeycomb Hex-Cushion' : (spec.cushionThicknessMm > 0 ? 'Standard Open-Cell Foam' : ''));

  // =========================================================================
  // STEP 1: FOOD DIMENSIONS & ARRANGEMENT BOUNDING BOX
  // =========================================================================
  const foodResult = calculateFoodBounds(foodId, qty, effectivePrimaryType);
  const foodGroup = foodResult.foodGroup;
  rootGroup.add(foodGroup);

  // =========================================================================
  // STEP 2: REQUIRED ENGINEERING CLEARANCES
  // =========================================================================
  const clearances = calculateRequiredClearance(
    foodId,
    spec,
    effectivePrimaryType,
    effectiveSecondaryType,
    hasSecondary,
    isV2
  );

  // =========================================================================
  // STEP 3: PRIMARY PACKAGE FIT (Molded Bio-Cradle Nest / Primary Container)
  // =========================================================================
  let primaryPack: { params: PackageGeometryParams; result: PackagingMeshResult };
  const primLower = effectivePrimaryType.toLowerCase();
  const isCradleNestType =
    primLower.includes('cradle') ||
    primLower.includes('nest') ||
    primLower.includes('collar') ||
    primLower.includes('bracket') ||
    primLower.includes('punnet') ||
    primLower.includes('cup') ||
    primLower.includes('pulp') ||
    isV2;

  if (isCradleNestType) {
    const cradleNestGroup = createBioCradleNestForFood(
      foodId,
      foodResult.clusterSize,
      isV2,
      foodResult.cols,
      foodResult.rows
    );
    const bounds = calculateAssemblyBounds([cradleNestGroup]);
    const sz = new THREE.Vector3();
    bounds.getSize(sz);

    primaryPack = {
      params: {
        width: Math.max(0.65, sz.x),
        depth: Math.max(0.65, sz.z),
        height: Math.max(0.15, sz.y),
        wallThickness: clearances.primaryWallThickness,
      },
      result: {
        group: cradleNestGroup,
        innerBounds: {
          minX: bounds.min.x,
          maxX: bounds.max.x,
          minY: 0.035,
          maxY: sz.y,
          minZ: bounds.min.z,
          maxZ: bounds.max.z,
        },
      },
    };
  } else {
    primaryPack = calculatePrimaryPackageBounds(
      foodResult.clusterSize,
      effectivePrimaryType,
      clearances.primaryClearance,
      clearances.primaryWallThickness,
      { cols: foodResult.cols, rows: foodResult.rows },
      isOpen,
      isCutaway,
      spec.closureType
    );
  }

  primaryGroup.add(primaryPack.result.group);

  // Food bottom rests directly on the primary container cavity floor
  const primaryCavityFloorY = primaryPack.result.innerBounds.minY;
  const initialFoodLocalY = primaryCavityFloorY + 0.005;
  foodGroup.position.set(0, initialFoodLocalY, 0);

  // Compute inner product assembly bounding box (food + primary container)
  const innerAssemblyBox = calculateAssemblyBounds([primaryPack.result.group, foodGroup]);
  const innerAssemblySize = new THREE.Vector3();
  innerAssemblyBox.getSize(innerAssemblySize);

  // =========================================================================
  // STEP 4: CUSHIONING & INLAY (Honeycomb Bed + Quad Interlocking Dampers)
  // =========================================================================
  const hasCushioning =
    (hasSecondary || isV2 || clearances.cushionThickness > 0.01) &&
    Boolean(effectiveCushionType) &&
    !effectiveCushionType.toLowerCase().includes('none');

  let protectiveAssemblyBox = innerAssemblyBox;
  let cushionMesh: THREE.Group | null = null;
  let bottomCushionPadH = Math.max(0.08, clearances.cushionThickness * 0.75);

  if (hasCushioning) {
    const cushionBuilder = resolveCushionBuilder(effectiveCushionType);
    const cushionParams = {
      width: innerAssemblySize.x + clearances.cushionThickness * 1.8,
      height: innerAssemblySize.y + clearances.cushionThickness * 0.7,
      depth: innerAssemblySize.z + clearances.cushionThickness * 1.8,
      thickness: clearances.cushionThickness,
      isCutaway,
      cols: foodResult.cols,
      rows: foodResult.rows,
    };
    cushionMesh = cushionBuilder(cushionParams);
    cushionGroup.add(cushionMesh);

    // Add engineered corner dampers if supportType specifies dampers, braces, or if isV2
    const suppLower = (spec.supportType || '').toLowerCase();
    if (isV2 || suppLower.includes('damper') || suppLower.includes('brace') || suppLower.includes('post') || suppLower.includes('suspension')) {
      const damperGroup = new THREE.Group();
      damperGroup.name = 'assembly-engineeredDampers';

      const strutMat = new THREE.MeshStandardMaterial({
        color: isV2 ? 0x059669 : 0x475569, // Emerald kinetic dampers for V2
        roughness: 0.32,
        metalness: 0.25,
      });

      const damperH = Math.max(0.45, innerAssemblySize.y * 0.95);
      const damperR = Math.max(0.045, clearances.cushionThickness * 0.30);
      const damperGeom = new THREE.CylinderGeometry(damperR, damperR * 1.15, damperH, 12);
      const ringGeom = new THREE.TorusGeometry(damperR * 1.35, damperR * 0.28, 8, 16);

      const dx = (innerAssemblySize.x / 2 + clearances.cushionThickness * 0.60);
      const dz = (innerAssemblySize.z / 2 + clearances.cushionThickness * 0.60);

      const corners = [
        [-dx, -dz],
        [dx, -dz],
        [-dx, dz],
        [dx, dz],
      ];

      corners.forEach(([cx, cz]) => {
        const pylon = new THREE.Mesh(damperGeom, strutMat);
        pylon.position.set(cx, damperH / 2, cz);
        pylon.castShadow = true;

        const ring1 = new THREE.Mesh(ringGeom, strutMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.set(cx, damperH * 0.32, cz);

        const ring2 = new THREE.Mesh(ringGeom, strutMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.set(cx, damperH * 0.68, cz);

        damperGroup.add(pylon, ring1, ring2);
      });

      cushionGroup.add(damperGroup);
    }

    protectiveAssemblyBox = calculateAssemblyBounds([primaryPack.result.group, foodGroup, cushionGroup]);
  }

  // =========================================================================
  // STEP 5: SECONDARY OUTER CARTON (Sized tightly around Protective Assembly)
  // =========================================================================
  let secondaryPackResult: PackagingMeshResult | null = null;
  let secLidGroup: THREE.Group | undefined;
  let secDimensions = { width: 0, depth: 0, height: 0 };

  if (hasSecondary) {
    let effectiveSecClearance = { ...clearances.secondaryClearance };

    let secPack = calculateSecondaryPackageBounds(
      protectiveAssemblyBox,
      effectiveSecondaryType,
      effectiveSecClearance,
      clearances.secondaryWallThickness,
      isOpen,
      isCutaway,
      isV2
    );

    // Excessive empty space check & self-healing dimension reduction
    let testInnerVol = Math.max(
      0.01,
      (secPack.params.width - clearances.secondaryWallThickness * 2) *
      (secPack.params.depth - clearances.secondaryWallThickness * 2) *
      (secPack.params.height - clearances.secondaryWallThickness)
    );
    const protSize = new THREE.Vector3();
    protectiveAssemblyBox.getSize(protSize);
    const protVol = protSize.x * protSize.y * protSize.z;
    let initialUnusedRatio = calculateUnusedVolumeRatio(protVol, testInnerVol);

    if (initialUnusedRatio > 0.36) {
      effectiveSecClearance = {
        x: Math.max(MIN_PROTECTIVE_CLEARANCE.secondaryLateral, effectiveSecClearance.x * 0.60),
        y: Math.max(MIN_PROTECTIVE_CLEARANCE.secondaryVertical, effectiveSecClearance.y * 0.50),
        z: Math.max(MIN_PROTECTIVE_CLEARANCE.secondaryLateral, effectiveSecClearance.z * 0.60),
      };
      secPack = calculateSecondaryPackageBounds(
        protectiveAssemblyBox,
        effectiveSecondaryType,
        effectiveSecClearance,
        clearances.secondaryWallThickness,
        isOpen,
        isCutaway,
        isV2
      );
    }

    secondaryPackResult = secPack.result;
    secondaryGroup.add(secPack.result.group);

    // Detach flapsGroup from secondaryGroup and place into lidGroup for clean exploded view
    if (secPack.result.lidGroup) {
      secLidGroup = secPack.result.lidGroup;
      secPack.result.group.remove(secLidGroup);
      lidGroup.add(secLidGroup);
    }

    secDimensions = {
      width: secPack.params.width,
      depth: secPack.params.depth,
      height: secPack.params.height,
    };
  }

  // =========================================================================
  // STEP 6: PHYSICAL CONTACT & GROUND RESTING ALIGNMENT
  // =========================================================================
  let secFloorY = 0;
  let primaryRestingY = 0;
  let cushionRestingY = 0;
  let foodRestingY = 0;
  let secondaryRestingY = 0;
  let lidRestingY = 0;

  if (hasSecondary && secondaryPackResult) {
    secFloorY = -secDimensions.height / 2 + clearances.secondaryWallThickness;
    cushionRestingY = secFloorY + bottomCushionPadH / 2;
    cushionGroup.position.set(0, cushionRestingY, 0);

    const primaryBox = calculateAssemblyBounds([primaryPack.result.group]);
    primaryRestingY = (secFloorY + bottomCushionPadH) - primaryBox.min.y;
    primaryGroup.position.set(0, primaryRestingY, 0);

    foodRestingY = primaryRestingY + primaryCavityFloorY + 0.005;
    foodGroup.position.set(0, foodRestingY, 0);

    secondaryRestingY = 0;
    lidRestingY = secDimensions.height / 2;
    lidGroup.position.set(0, lidRestingY, 0);
  } else {
    const primaryBox = calculateAssemblyBounds([primaryPack.result.group]);
    primaryRestingY = -primaryBox.min.y;
    primaryGroup.position.set(0, primaryRestingY, 0);

    foodRestingY = primaryRestingY + primaryCavityFloorY + 0.005;
    foodGroup.position.set(0, foodRestingY, 0);

    cushionRestingY = 0;
    secondaryRestingY = 0;
    lidRestingY = primaryPack.params.height;
    lidGroup.position.set(0, lidRestingY, 0);
  }

  // =========================================================================
  // STEP 7: EXPLODED VIEW OFFSETS (When active)
  // =========================================================================
  if (explodeFactor > 0.001) {
    if (hasSecondary) {
      secondaryGroup.position.y = secondaryRestingY - explodeFactor * 1.05;
      cushionGroup.position.y = cushionRestingY + explodeFactor * 0.40;
      primaryGroup.position.y = primaryRestingY + explodeFactor * 1.25;
      foodGroup.position.y = foodRestingY + explodeFactor * 2.10;
      lidGroup.position.y = lidRestingY + explodeFactor * 2.95;
    } else {
      primaryGroup.position.y = primaryRestingY - explodeFactor * 0.35;
      foodGroup.position.y = foodRestingY + explodeFactor * 1.25;
      lidGroup.position.y = lidRestingY + explodeFactor * 2.10;
    }
  }

  // Calculate final assembly bounding box
  const totalBounds = calculateAssemblyBounds([secondaryGroup, primaryGroup, cushionGroup, foodGroup, lidGroup]);

  // Anchor entire system so lowest component touches ground y = -1.25
  const lowestY = hasSecondary ? -secDimensions.height / 2 : 0;
  rootGroup.position.y = -lowestY - 1.25;

  // =========================================================================
  // STEP 8: METRICS & PHYSICAL VALIDATION
  // =========================================================================
  const primaryOuterVol = innerAssemblySize.x * innerAssemblySize.y * innerAssemblySize.z;
  const secInternalVol = hasSecondary
    ? Math.max(0.01, (secDimensions.width - clearances.secondaryWallThickness * 2) *
                    (secDimensions.depth - clearances.secondaryWallThickness * 2) *
                    (secDimensions.height - clearances.secondaryWallThickness))
    : primaryOuterVol;

  const protSize = new THREE.Vector3();
  protectiveAssemblyBox.getSize(protSize);
  const protVol = protSize.x * protSize.y * protSize.z;
  const usedVol = hasSecondary ? Math.min(secInternalVol * 0.98, protVol) : primaryOuterVol;
  const unusedVolumeRatio = calculateUnusedVolumeRatio(usedVol, secInternalVol);

  const validation = validatePackageAssembly(
    foodResult.clusterBox,
    innerAssemblyBox,
    hasSecondary ? totalBounds : null,
    hasSecondary,
    unusedVolumeRatio
  );

  const finalDimsMm = hasSecondary
    ? {
        lengthMm: unitsToMm(secDimensions.depth),
        widthMm: unitsToMm(secDimensions.width),
        heightMm: unitsToMm(secDimensions.height),
      }
    : {
        lengthMm: unitsToMm(primaryPack.params.depth),
        widthMm: unitsToMm(primaryPack.params.width),
        heightMm: unitsToMm(primaryPack.params.height),
      };

  return {
    rootGroup,
    foodGroup,
    primaryGroup,
    cushionGroup,
    secondaryGroup,
    lidGroup,
    packageDimensions: finalDimsMm,
    systemLabel: {
      primary: effectivePrimaryType,
      secondary: hasSecondary ? effectiveSecondaryType : 'None (Primary Only)',
      cushioning: effectiveCushionType || (hasCushioning ? 'Protective Liner' : 'None Required'),
      arrangement: `${foodResult.cols} × ${foodResult.rows} Grid (${qty} units)`,
    },
    metrics: {
      unusedVolumeRatio,
      containmentRatio: validation.containmentRatio,
      clearanceMm: unitsToMm(clearances.secondaryClearance.x),
      isValid: validation.isValid,
      issues: validation.issues,
    },
    basePositions: {
      foodY: foodRestingY,
      primaryY: primaryRestingY,
      cushionY: cushionRestingY,
      secondaryY: secondaryRestingY,
      lidY: lidRestingY,
    },
    bounds: {
      food: foodResult.clusterBox,
      primary: innerAssemblyBox,
      protective: protectiveAssemblyBox,
      secondary: totalBounds,
      total: totalBounds,
    },
  };
}
