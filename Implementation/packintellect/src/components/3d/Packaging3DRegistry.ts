/**
 * PACKINTELLECT Universal 3D Packaging Registry
 * Procedural 3D geometries and materials for every packaging family:
 * - Corrugated Cardboard Box (Single-wall, micro-flute, quad-wall with articulated flaps)
 * - Paperboard Carton & Folding Carton (Tuck-flap boxboard with crisp folds)
 * - Paper Bag & Multi-Wall Kraft Sack (Flour/grain block bottom, stitched seal)
 * - Plastic Bag & Polymer Polybag (Heat-sealed flexible polymer with gloss finish)
 * - Stand-Up Pouch (Doypack with bottom oval gusset, zip track, tear notch)
 * - Pillow Pouch (Nitrogen-flushed puffed snack bag with crimped top/bottom & center fin)
 * - Vacuum Pouch / Skin Pack (Hermetic vacuum-drawn barrier film with flange border)
 * - Retort Pouch (Multi-layer foil-laminated shelf-stable meal pouch)
 * - Sachet (Single-serve 4-side sealed condiment/spice pouch)
 * - Bottle & Glass Bottle (Flint/amber glass with punt indentation, slender neck, crown cap)
 * - Plastic Bottle (HDPE/PET dairy bottle with strengthening ribs, ergonomic handle, threaded cap)
 * - Glass Jar (Wide-mouth flint glass with lug twist cap)
 * - Can (Sanitary cylindrical food can with double chime seams and pull tab)
 * - Tin (Rectangular/cylindrical decorative biscuit/sweet tin with slip lid and rolled bead)
 * - Tray (Thermoformed shallow produce/meat tray with flat flange and sealed lidding film)
 * - Egg Tray (Molded pulp with ovoid nesting cells and central locking cones)
 * - Clamshell & Cake Dome (Rigid base tray with clear anti-fog high-clearance dome)
 * - Cup (Tapered thermoformed/paper cup with rolled rim and peelable foil lid)
 * - Tub (Wide-mouth injection-molded PP tub with snap-over rim lid for curd/butter/ice cream)
 * - Bowl (Wide round bowl with flared rim and heat-sealed film)
 * - Liquid Carton (Tetra-style aseptic brick / gable-top carton with plastic pour spout)
 * - Molded Pulp (Fibrous contoured bio-pulp cradle/nesting tray)
 * - Foam Container (Expanded Polystyrene EPS thermal cooler with thick walls and friction lid)
 * - Insulated Container (Cold-chain shipper with radiant foil liner and blue ice gel packs)
 * - Foil Container (Crimped-wall aluminum foil pan with curled rim and press-fit lid)
 * - Ventilated Crate (Produce harvest crate with horizontal airflow slats and corner posts)
 * - Reusable Container (Heavy-duty returnable industrial plastic tote with cutout handles and structural ribs)
 */

import * as THREE from 'three';

export interface PackageGeometryParams {
  width: number;       // X dimension in Three.js units (approx 1.5 - 3.8)
  height: number;      // Y dimension in Three.js units
  depth: number;       // Z dimension in Three.js units
  wallThickness: number;
  isOpen?: boolean;
  isCutaway?: boolean;
  color?: number;
  secondaryColor?: number;
  roughness?: number;
  metalness?: number;
  transmission?: number;
  opacity?: number;
  transparent?: boolean;
  compartments?: { cols: number; rows: number };
  closureType?: string;
  hasHandle?: boolean;
}

export interface PackagingMeshResult {
  group: THREE.Group;
  innerBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  lidGroup?: THREE.Group;
  bodyGroup?: THREE.Group;
}

// ============================================================================
// MATERIAL PALETTE HELPERS
// ============================================================================
export const PACKAGING_MATERIALS = {
  kraftCorrugated: (roughness = 0.82) =>
    new THREE.MeshStandardMaterial({
      color: 0xC8B294, // Natural unbleached kraft paperboard
      roughness,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),

  kraftV2MicroFlute: () =>
    new THREE.MeshStandardMaterial({
      color: 0xD6C5A9, // Refined micro-flute bio-kraft
      roughness: 0.74,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),

  bleachedPaperboard: () =>
    new THREE.MeshStandardMaterial({
      color: 0xF8FAFC, // Clean clay-coated SBS paperboard
      roughness: 0.42,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),

  moldedBioPulp: () =>
    new THREE.MeshStandardMaterial({
      color: 0xD1C7B7, // Fibrous recycled egg-carton cellulose
      roughness: 0.94,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),

  clearPETDome: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0xF8FAFC,
      transparent: true,
      opacity: 0.38,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.52,
      side: THREE.DoubleSide,
    }),

  flintGlass: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0xE2E8F0,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.92,
      ior: 1.54,
      side: THREE.DoubleSide,
    }),

  amberGlass: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0xB45309,
      transparent: true,
      opacity: 0.55,
      roughness: 0.06,
      metalness: 0.05,
      transmission: 0.82,
      ior: 1.54,
      side: THREE.DoubleSide,
    }),

  flexiblePolyPouch: (color = 0x38BDF8) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
    }),

  metallizedBarrierFilm: () =>
    new THREE.MeshStandardMaterial({
      color: 0xE2E8F0, // Shiny metallized aluminum reflection
      roughness: 0.22,
      metalness: 0.85,
      side: THREE.DoubleSide,
    }),

  tinplateSteel: () =>
    new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      roughness: 0.25,
      metalness: 0.9,
      side: THREE.DoubleSide,
    }),

  goldTinplate: () =>
    new THREE.MeshStandardMaterial({
      color: 0xD97706,
      roughness: 0.22,
      metalness: 0.85,
      side: THREE.DoubleSide,
    }),

  aluminumFoil: () =>
    new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      roughness: 0.32,
      metalness: 0.82,
      side: THREE.DoubleSide,
    }),

  tetraPaperboard: () =>
    new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),

  liquidHDPE: () =>
    new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.28,
      metalness: 0.02,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    }),

  foodGradePP: () =>
    new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),

  epsFoam: () =>
    new THREE.MeshStandardMaterial({
      color: 0xF1F5F9, // Dense molded EPS bead foam
      roughness: 0.88,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),

  insulationFoilLiner: () =>
    new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      metalness: 0.92,
      roughness: 0.18,
      side: THREE.DoubleSide,
    }),

  iceGel: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.15,
      transmission: 0.7,
      ior: 1.34,
      side: THREE.DoubleSide,
    }),

  reusablePolymer: () =>
    new THREE.MeshStandardMaterial({
      color: 0x0284C7, // Heavy-duty industrial blue crate polymer
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }),
};

// ============================================================================
// 1. EGG TRAY 3D (Molded Pulp Carton with Ovoid Nesting Cells)
// ============================================================================
export function createEggTray3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const lidGroup = new THREE.Group();
  group.add(bodyGroup);
  group.add(lidGroup);

  const cols = params.compartments?.cols || 2;
  const rows = params.compartments?.rows || 6;
  const trayW = params.width;
  const trayD = params.depth;
  const trayH = params.height * 0.48;
  const cellRadius = Math.min(trayW / (cols * 2.2), trayD / (rows * 2.2));

  const mat = PACKAGING_MATERIALS.moldedBioPulp();

  // Tray base deck
  const baseGeom = new THREE.BoxGeometry(trayW, 0.08, trayD);
  const baseMesh = new THREE.Mesh(baseGeom, mat);
  baseMesh.position.set(0, -trayH / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  bodyGroup.add(baseMesh);

  // Molded egg nesting cell cups
  const cupGeom = new THREE.CylinderGeometry(cellRadius * 0.9, cellRadius * 0.65, cellRadius * 1.1, 16, 1, true);
  const cellBottomGeom = new THREE.SphereGeometry(cellRadius * 0.65, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

  const startX = -trayW / 2 + cellRadius * 1.15;
  const stepX = (trayW - cellRadius * 2.3) / Math.max(1, cols - 1);
  const startZ = -trayD / 2 + cellRadius * 1.15;
  const stepZ = (trayD - cellRadius * 2.3) / Math.max(1, rows - 1);

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = cols === 1 ? 0 : startX + c * stepX;
      const cz = rows === 1 ? 0 : startZ + r * stepZ;

      const cup = new THREE.Mesh(cupGeom, mat);
      cup.position.set(cx, -trayH / 2 + cellRadius * 0.55, cz);
      cup.castShadow = true;
      bodyGroup.add(cup);

      const cupBottom = new THREE.Mesh(cellBottomGeom, mat);
      cupBottom.position.set(cx, -trayH / 2 + 0.05, cz);
      cupBottom.rotation.x = Math.PI;
      bodyGroup.add(cupBottom);
    }
  }

  // Interlocking molded divider cones between egg cells
  const coneGeom = new THREE.ConeGeometry(cellRadius * 0.45, cellRadius * 1.4, 8);
  if (cols > 1 && rows > 1) {
    for (let r = 0; r < rows - 1; r++) {
      const pz = startZ + (r + 0.5) * stepZ;
      const cone = new THREE.Mesh(coneGeom, mat);
      cone.position.set(0, -trayH / 2 + cellRadius * 0.7, pz);
      bodyGroup.add(cone);
    }
  }

  // Tray perimeter lip
  const lipGeom = new THREE.BoxGeometry(trayW + 0.12, 0.08, trayD + 0.12);
  const lipMesh = new THREE.Mesh(lipGeom, mat);
  lipMesh.position.set(0, 0, 0);
  bodyGroup.add(lipMesh);

  // Hinged Top Lid
  const lidH = params.height * 0.55;
  const lidGeom = new THREE.BoxGeometry(trayW + 0.08, lidH, trayD + 0.08);
  const lidMesh = new THREE.Mesh(lidGeom, mat);
  lidMesh.position.set(0, lidH / 2, 0);
  lidMesh.castShadow = true;

  if (params.isOpen || params.isCutaway) {
    lidGroup.position.set(0, 0, -trayD / 2);
    lidMesh.position.set(0, lidH / 2, -trayD / 2);
    lidGroup.rotation.x = -Math.PI * 0.65;
  }
  lidGroup.add(lidMesh);

  return {
    group,
    bodyGroup,
    lidGroup,
    innerBounds: {
      minX: -trayW / 2 + 0.1,
      maxX: trayW / 2 - 0.1,
      minY: -trayH / 2,
      maxY: params.height * 0.8,
      minZ: -trayD / 2 + 0.1,
      maxZ: trayD / 2 - 0.1,
    },
  };
}

// ============================================================================
// 2. STAND-UP BARRIER POUCH (Doypack with Gusset & Heat Seal)
// ============================================================================
export function createStandUpPouch3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.95;
  const h = params.height * 1.1;
  const d = Math.max(0.6, params.depth * 0.65);

  const mat = PACKAGING_MATERIALS.flexiblePolyPouch(params.color || 0x0284C7);
  if (params.isCutaway) {
    mat.transparent = true;
    mat.opacity = 0.45;
  }

  // Curved pouch front and back panels
  const geom = new THREE.CylinderGeometry(w * 0.48, w * 0.52, h * 0.85, 24, 8, true);
  geom.scale(1.0, 1.0, d / w);
  const body = new THREE.Mesh(geom, mat);
  body.castShadow = true;
  group.add(body);

  // Bottom oval standing gusset
  const gussetGeom = new THREE.CylinderGeometry(w * 0.5, w * 0.5, 0.05, 24);
  gussetGeom.scale(1.0, 1.0, d / w);
  const gusset = new THREE.Mesh(gussetGeom, mat);
  gusset.position.set(0, -h * 0.42, 0);
  group.add(gusset);

  // Flattened top thermal seal with tear notch & zipper profile
  const sealGeom = new THREE.BoxGeometry(w * 0.98, h * 0.15, 0.04);
  const sealMat = PACKAGING_MATERIALS.flexiblePolyPouch(params.secondaryColor || 0x0369A1);
  const seal = new THREE.Mesh(sealGeom, sealMat);
  seal.position.set(0, h * 0.46, 0);
  group.add(seal);

  // Side perimeter seal weld bands
  const sideSealGeom = new THREE.BoxGeometry(0.06, h * 0.85, d * 0.45);
  const leftSeal = new THREE.Mesh(sideSealGeom, sealMat);
  leftSeal.position.set(-w * 0.47, 0, 0);
  const rightSeal = new THREE.Mesh(sideSealGeom, sealMat);
  rightSeal.position.set(w * 0.47, 0, 0);
  group.add(leftSeal, rightSeal);

  return {
    group,
    innerBounds: {
      minX: -w * 0.4,
      maxX: w * 0.4,
      minY: -h * 0.38,
      maxY: h * 0.35,
      minZ: -d * 0.38,
      maxZ: d * 0.38,
    },
  };
}

// ============================================================================
// 3. NITROGEN-FLUSHED PILLOW POUCH (Potato Chips & Crisp Snacks)
// ============================================================================
export function createPillowPouch3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 1.0;
  const h = params.height * 1.15;
  const d = Math.max(0.9, params.depth * 0.9);

  const mat = PACKAGING_MATERIALS.metallizedBarrierFilm();
  if (params.isCutaway) {
    mat.transparent = true;
    mat.opacity = 0.42;
  }

  // Puffed pillow envelope (inflated nitrogen cushion)
  const geom = new THREE.SphereGeometry(1.0, 32, 24);
  geom.scale(w * 0.5, h * 0.48, d * 0.48);
  const pillow = new THREE.Mesh(geom, mat);
  pillow.castShadow = true;
  group.add(pillow);

  // Top crimp seal
  const topCrimpGeom = new THREE.BoxGeometry(w * 1.02, 0.12, 0.05);
  const crimpMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.6, roughness: 0.4 });
  const topCrimp = new THREE.Mesh(topCrimpGeom, crimpMat);
  topCrimp.position.set(0, h * 0.48, 0);
  group.add(topCrimp);

  // Bottom crimp seal
  const bottomCrimp = new THREE.Mesh(topCrimpGeom, crimpMat);
  bottomCrimp.position.set(0, -h * 0.48, 0);
  group.add(bottomCrimp);

  // Center vertical fin seal on back
  const finSealGeom = new THREE.BoxGeometry(0.04, h * 0.96, 0.12);
  const finSeal = new THREE.Mesh(finSealGeom, crimpMat);
  finSeal.position.set(0, 0, -d * 0.46);
  group.add(finSeal);

  return {
    group,
    innerBounds: {
      minX: -w * 0.38,
      maxX: w * 0.38,
      minY: -h * 0.35,
      maxY: h * 0.35,
      minZ: -d * 0.35,
      maxZ: d * 0.35,
    },
  };
}

// ============================================================================
// 4. VACUUM POUCH / SKIN PACK (Skin-Tight Barrier Film with Flange Border)
// ============================================================================
export function createVacuumPouch3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.96;
  const h = params.height * 0.88;
  const d = params.depth * 0.96;

  // Clear high-barrier puncture-resistant EVOH/PA film
  const filmMat = new THREE.MeshPhysicalMaterial({
    color: 0xF1F5F9,
    transparent: true,
    opacity: 0.42,
    roughness: 0.12,
    metalness: 0.08,
    transmission: 0.88,
    ior: 1.51,
    side: THREE.DoubleSide,
  });

  // Base backing support sheet (black/gold vacuum tray backing)
  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    roughness: 0.45,
    metalness: 0.15,
  });
  const backingGeom = new THREE.BoxGeometry(w * 1.12, 0.06, d * 1.12);
  const backing = new THREE.Mesh(backingGeom, backingMat);
  backing.position.set(0, -h * 0.48, 0);
  backing.castShadow = true;
  group.add(backing);

  // Hermetic perimeter heat seal flange border
  const flangeGeom = new THREE.BoxGeometry(w * 1.1, 0.05, d * 1.1);
  const flangeMat = new THREE.MeshStandardMaterial({
    color: 0x94A3B8,
    roughness: 0.35,
    metalness: 0.4,
    transparent: true,
    opacity: 0.7,
  });
  const flange = new THREE.Mesh(flangeGeom, flangeMat);
  flange.position.set(0, -h * 0.44, 0);
  group.add(flange);

  // Form-fitting contour skin film drawn over the payload
  const skinGeom = new THREE.CylinderGeometry(w * 0.48, w * 0.52, h * 0.86, 24, 6);
  skinGeom.scale(1.0, 1.0, d / w);
  const skin = new THREE.Mesh(skinGeom, filmMat);
  skin.position.set(0, -h * 0.04, 0);
  skin.castShadow = true;
  group.add(skin);

  return {
    group,
    innerBounds: {
      minX: -w * 0.44,
      maxX: w * 0.44,
      minY: -h * 0.42,
      maxY: h * 0.38,
      minZ: -d * 0.44,
      maxZ: d * 0.44,
    },
  };
}

// ============================================================================
// 5. RETORT POUCH (Multi-Layer Foil-Laminated Meal Pouch)
// ============================================================================
export function createRetortPouch3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.94;
  const h = params.height * 1.08;
  const d = Math.max(0.55, params.depth * 0.6);

  const mat = PACKAGING_MATERIALS.metallizedBarrierFilm();
  if (params.isCutaway) {
    mat.transparent = true;
    mat.opacity = 0.45;
  }

  // Pouch body
  const bodyGeom = new THREE.BoxGeometry(w, h * 0.86, d);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.castShadow = true;
  group.add(body);

  // Top sterile heat seal with tear notches
  const sealMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.8, roughness: 0.3 });
  const topSeal = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, h * 0.14, 0.04), sealMat);
  topSeal.position.set(0, h * 0.45, 0);
  group.add(topSeal);

  // Tear notch cutouts on both edges
  const notchGeom = new THREE.ConeGeometry(0.04, 0.06, 4);
  notchGeom.rotateZ(Math.PI / 2);
  const leftNotch = new THREE.Mesh(notchGeom, sealMat);
  leftNotch.position.set(-w * 0.51, h * 0.42, 0);
  const rightNotch = new THREE.Mesh(notchGeom, sealMat);
  rightNotch.position.set(w * 0.51, h * 0.42, 0);
  rightNotch.rotateZ(Math.PI);
  group.add(leftNotch, rightNotch);

  // Bottom seal
  const bottomSeal = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.08, 0.04), sealMat);
  bottomSeal.position.set(0, -h * 0.45, 0);
  group.add(bottomSeal);

  return {
    group,
    innerBounds: {
      minX: -w * 0.42,
      maxX: w * 0.42,
      minY: -h * 0.38,
      maxY: h * 0.36,
      minZ: -d * 0.42,
      maxZ: d * 0.42,
    },
  };
}

// ============================================================================
// 6. SACHET (4-Side Sealed Condiment / Spice Packet)
// ============================================================================
export function createSachet3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.9;
  const h = params.height * 0.95;
  const d = Math.max(0.3, params.depth * 0.35);

  const mat = PACKAGING_MATERIALS.flexiblePolyPouch(params.color || 0xEA580C);
  if (params.isCutaway) {
    mat.transparent = true;
    mat.opacity = 0.45;
  }

  // Central pouch cushion
  const centerGeom = new THREE.BoxGeometry(w * 0.82, h * 0.82, d);
  const center = new THREE.Mesh(centerGeom, mat);
  center.castShadow = true;
  group.add(center);

  // 4-side perimeter crimped sealed border
  const borderMat = new THREE.MeshStandardMaterial({
    color: params.secondaryColor || 0xC2410C,
    roughness: 0.4,
    metalness: 0.3,
  });
  const borderGeom = new THREE.BoxGeometry(w * 1.02, h * 1.02, 0.03);
  const border = new THREE.Mesh(borderGeom, borderMat);
  group.add(border);

  return {
    group,
    innerBounds: {
      minX: -w * 0.38,
      maxX: w * 0.38,
      minY: -h * 0.38,
      maxY: h * 0.38,
      minZ: -d * 0.38,
      maxZ: d * 0.38,
    },
  };
}

// ============================================================================
// 7. PLASTIC BAG & POLYMER POLYBAG (Transparent / Glossy Fold-Over Bag)
// ============================================================================
export function createPlasticBag3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.95;
  const h = params.height * 1.05;
  const d = params.depth * 0.85;

  const mat = new THREE.MeshPhysicalMaterial({
    color: params.color || 0xF8FAFC,
    transparent: true,
    opacity: 0.48,
    roughness: 0.15,
    metalness: 0.05,
    transmission: 0.82,
    ior: 1.48,
    side: THREE.DoubleSide,
  });

  // Main gusseted body
  const bodyGeom = new THREE.BoxGeometry(w, h * 0.86, d);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.05, 0);
  body.castShadow = true;
  group.add(body);

  // Folded / gathered top opening with adhesive seal strip
  const sealGeom = new THREE.BoxGeometry(w * 1.02, 0.12, d * 0.3);
  const sealMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.3, metalness: 0.2 });
  const seal = new THREE.Mesh(sealGeom, sealMat);
  seal.position.set(0, h * 0.42, 0);
  group.add(seal);

  return {
    group,
    innerBounds: {
      minX: -w * 0.42,
      maxX: w * 0.42,
      minY: -h * 0.42,
      maxY: h * 0.35,
      minZ: -d * 0.42,
      maxZ: d * 0.42,
    },
  };
}

// ============================================================================
// 8. LIQUID CARTON (Tetra-Style Aseptic Brick / Gable Top)
// ============================================================================
export function createLiquidCarton3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.85;
  const h = params.height * 1.25;
  const d = params.depth * 0.85;

  const mat = PACKAGING_MATERIALS.tetraPaperboard();

  // Rectangular prism carton body
  const bodyH = h * 0.82;
  const bodyGeom = new THREE.BoxGeometry(w, bodyH, d);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.09, 0);
  body.castShadow = true;
  group.add(body);

  // Slanted / gable-top roof crease
  const roofH = h * 0.18;
  const roofGeom = new THREE.ConeGeometry(w * 0.72, roofH, 4);
  roofGeom.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeom, mat);
  roof.position.set(0, bodyH / 2 - h * 0.09 + roofH / 2, 0);
  group.add(roof);

  // Top fin seal ridge
  const ridgeGeom = new THREE.BoxGeometry(w * 0.95, 0.08, 0.03);
  const ridge = new THREE.Mesh(ridgeGeom, mat);
  ridge.position.set(0, bodyH / 2 - h * 0.09 + roofH + 0.02, 0);
  group.add(ridge);

  // Molded plastic pour cap (screw cap)
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x2563EB, // Dairy blue cap
    roughness: 0.3,
    metalness: 0.2,
  });
  const capGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.set(w * 0.22, bodyH / 2 - h * 0.09 + roofH * 0.65, d * 0.15);
  cap.rotation.x = 0.35;
  group.add(cap);

  // Tamper ring
  const ringGeom = new THREE.TorusGeometry(0.19, 0.02, 8, 16);
  ringGeom.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeom, capMat);
  ring.position.set(w * 0.22, bodyH / 2 - h * 0.09 + roofH * 0.65 - 0.04, d * 0.15);
  group.add(ring);

  return {
    group,
    innerBounds: {
      minX: -w * 0.42,
      maxX: w * 0.42,
      minY: -h * 0.45,
      maxY: h * 0.32,
      minZ: -d * 0.42,
      maxZ: d * 0.42,
    },
  };
}

// ============================================================================
// 9. GLASS BOTTLE (Flint / Amber Glass with Slender Neck & Cap)
// ============================================================================
export function createGlassBottle3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const r = Math.min(params.width, params.depth) * 0.38;
  const h = params.height * 1.3;

  const isAmber = params.color && params.color !== 0xFFFFFF;
  const mat = isAmber ? PACKAGING_MATERIALS.amberGlass() : PACKAGING_MATERIALS.flintGlass();

  // Bottle body
  const bodyH = h * 0.58;
  const bodyGeom = new THREE.CylinderGeometry(r, r * 1.02, bodyH, 32);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.18, 0);
  body.castShadow = true;
  group.add(body);

  // Bottom punt indentation (inward concave bottom typical of wine/oil bottles)
  const puntMat = mat;
  const puntGeom = new THREE.ConeGeometry(r * 0.6, r * 0.4, 16);
  puntGeom.rotateX(Math.PI);
  const punt = new THREE.Mesh(puntGeom, puntMat);
  punt.position.set(0, -h * 0.18 - bodyH / 2 + r * 0.2, 0);
  group.add(punt);

  // Tapered shoulder
  const shoulderH = h * 0.22;
  const shoulderGeom = new THREE.CylinderGeometry(r * 0.35, r, shoulderH, 32);
  const shoulder = new THREE.Mesh(shoulderGeom, mat);
  shoulder.position.set(0, bodyH / 2 - h * 0.18 + shoulderH / 2, 0);
  group.add(shoulder);

  // Slender bottle neck
  const neckH = h * 0.22;
  const neckGeom = new THREE.CylinderGeometry(r * 0.32, r * 0.35, neckH, 32);
  const neck = new THREE.Mesh(neckGeom, mat);
  neck.position.set(0, h * 0.32, 0);
  group.add(neck);

  // Bottle crown ring & cap
  const capMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, metalness: 0.8, roughness: 0.2 });
  const capGeom = new THREE.CylinderGeometry(r * 0.36, r * 0.36, 0.12, 16);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.set(0, h * 0.44, 0);
  group.add(cap);

  // Internal liquid representation
  const liquidMat = new THREE.MeshStandardMaterial({
    color: params.color || 0x059669, // Olive oil green or golden amber
    roughness: 0.1,
    transparent: true,
    opacity: 0.82,
  });
  const liquidMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, bodyH * 0.95, 24), liquidMat);
  liquidMesh.position.set(0, -h * 0.18, 0);
  group.add(liquidMesh);

  return {
    group,
    innerBounds: {
      minX: -r * 0.85,
      maxX: r * 0.85,
      minY: -bodyH * 0.45,
      maxY: bodyH * 0.45,
      minZ: -r * 0.85,
      maxZ: r * 0.85,
    },
  };
}

// ============================================================================
// 10. PLASTIC BOTTLE (HDPE / PET Dairy Bottle with Ribs, Handle & Cap)
// ============================================================================
export function createPlasticBottle3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const r = Math.min(params.width, params.depth) * 0.4;
  const h = params.height * 1.25;

  const mat = PACKAGING_MATERIALS.liquidHDPE();

  // Bottle body with reinforcing structural ribs
  const bodyH = h * 0.62;
  const bodyGeom = new THREE.CylinderGeometry(r, r, bodyH, 32);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.16, 0);
  body.castShadow = true;
  group.add(body);

  // Circumferential strengthening ribs
  const ribMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.35 });
  for (let i = -1; i <= 1; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.02, 8, 32), ribMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.set(0, -h * 0.16 + i * (bodyH * 0.25), 0);
    group.add(rib);
  }

  // Tapered neck shoulder
  const shoulderH = h * 0.2;
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r, shoulderH, 32), mat);
  shoulder.position.set(0, bodyH / 2 - h * 0.16 + shoulderH / 2, 0);
  group.add(shoulder);

  // Neck with screw threads
  const neckH = h * 0.18;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.4, r * 0.42, neckH, 32), mat);
  neck.position.set(0, h * 0.32, 0);
  group.add(neck);

  // Threaded tamper-evident screw cap
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.3, metalness: 0.15 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.44, r * 0.44, 0.14, 24), capMat);
  cap.position.set(0, h * 0.42, 0);
  group.add(cap);

  // Ergonomic molded handle cutout on side (for gallon / 1L jugs)
  const handleGeom = new THREE.TorusGeometry(r * 0.55, 0.08, 12, 16, Math.PI);
  handleGeom.rotateY(Math.PI / 2);
  const handle = new THREE.Mesh(handleGeom, mat);
  handle.position.set(-r * 0.88, 0, 0);
  group.add(handle);

  return {
    group,
    innerBounds: {
      minX: -r * 0.85,
      maxX: r * 0.85,
      minY: -bodyH * 0.45,
      maxY: bodyH * 0.45,
      minZ: -r * 0.85,
      maxZ: r * 0.85,
    },
  };
}

// Generic bottle mapping
export const createBottle3D = createGlassBottle3D;

// ============================================================================
// 11. GLASS JAR (Wide-Mouth Flint Glass with Metal Lug Twist Lid)
// ============================================================================
export function createGlassJar3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const radius = Math.min(params.width, params.depth) * 0.44;
  const h = params.height * 1.05;

  const mat = PACKAGING_MATERIALS.flintGlass();

  // Glass jar body
  const bodyH = h * 0.72;
  const bodyGeom = new THREE.CylinderGeometry(radius, radius * 1.02, bodyH, 32);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.08, 0);
  body.castShadow = true;
  group.add(body);

  // Wide mouth shoulder
  const shoulderH = h * 0.14;
  const shoulderGeom = new THREE.CylinderGeometry(radius * 0.82, radius, shoulderH, 32);
  const shoulder = new THREE.Mesh(shoulderGeom, mat);
  shoulder.position.set(0, bodyH / 2 - h * 0.08 + shoulderH / 2, 0);
  group.add(shoulder);

  // Threaded glass finish
  const neckH = h * 0.12;
  const neckGeom = new THREE.CylinderGeometry(radius * 0.8, radius * 0.82, neckH, 32);
  const neck = new THREE.Mesh(neckGeom, mat);
  neck.position.set(0, bodyH / 2 - h * 0.08 + shoulderH + neckH / 2, 0);
  group.add(neck);

  // Gold or Red Metal Lug Cap (Lug Twist Closure)
  const capMat = new THREE.MeshStandardMaterial({
    color: params.secondaryColor || 0xD97706, // Polished gold lug cap
    roughness: 0.25,
    metalness: 0.85,
  });
  const capGeom = new THREE.CylinderGeometry(radius * 0.84, radius * 0.84, 0.1, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.set(0, bodyH / 2 - h * 0.08 + shoulderH + neckH + 0.05, 0);
  group.add(cap);

  return {
    group,
    innerBounds: {
      minX: -radius * 0.82,
      maxX: radius * 0.82,
      minY: -bodyH * 0.45,
      maxY: bodyH * 0.45,
      minZ: -radius * 0.82,
      maxZ: radius * 0.82,
    },
  };
}

export const createJar3D = createGlassJar3D;

// ============================================================================
// 12. CAN (Sanitary Food Can with Double-Seam Chimes & Pull Tab)
// ============================================================================
export function createCan3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const radius = Math.min(params.width, params.depth) * 0.45;
  const h = params.height * 1.0;

  const mat = PACKAGING_MATERIALS.tinplateSteel();

  // Tin body cylinder
  const bodyGeom = new THREE.CylinderGeometry(radius, radius, h * 0.94, 32);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.castShadow = true;
  group.add(body);

  // Top and bottom chime rim seams (thickened double seam rings)
  const rimGeom = new THREE.TorusGeometry(radius, 0.035, 8, 32);
  rimGeom.rotateX(Math.PI / 2);
  const topRim = new THREE.Mesh(rimGeom, mat);
  topRim.position.set(0, h * 0.47, 0);
  const bottomRim = new THREE.Mesh(rimGeom, mat);
  bottomRim.position.set(0, -h * 0.47, 0);
  group.add(topRim, bottomRim);

  // Pull-ring tab on lid
  const tabGeom = new THREE.TorusGeometry(0.12, 0.02, 6, 16);
  const tab = new THREE.Mesh(tabGeom, mat);
  tab.position.set(radius * 0.3, h * 0.48, 0);
  tab.rotation.x = Math.PI / 2;
  group.add(tab);

  return {
    group,
    innerBounds: {
      minX: -radius * 0.9,
      maxX: radius * 0.9,
      minY: -h * 0.45,
      maxY: h * 0.45,
      minZ: -radius * 0.9,
      maxZ: radius * 0.9,
    },
  };
}

// ============================================================================
// 13. TIN (Decorative Biscuit / Sweet Tin with Friction Lid & Rolled Hem)
// ============================================================================
export function createTin3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.95;
  const h = params.height * 0.85;
  const d = params.depth * 0.95;

  const mat = PACKAGING_MATERIALS.goldTinplate();

  // Rectangular tin base body
  const bodyGeom = new THREE.BoxGeometry(w, h * 0.82, d);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.09, 0);
  body.castShadow = true;
  group.add(body);

  // Rolled wire bead around rim
  const beadMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.9, roughness: 0.2 });
  const beadGeom = new THREE.BoxGeometry(w + 0.04, 0.04, d + 0.04);
  const bead = new THREE.Mesh(beadGeom, beadMat);
  bead.position.set(0, h * 0.32, 0);
  group.add(bead);

  // Friction slip-over lid
  const lidH = h * 0.22;
  const lidGeom = new THREE.BoxGeometry(w + 0.06, lidH, d + 0.06);
  const lid = new THREE.Mesh(lidGeom, mat);
  lid.position.set(0, h * 0.38, 0);
  group.add(lid);

  return {
    group,
    innerBounds: {
      minX: -w * 0.44,
      maxX: w * 0.44,
      minY: -h * 0.45,
      maxY: h * 0.35,
      minZ: -d * 0.44,
      maxZ: d * 0.44,
    },
  };
}

// ============================================================================
// 14. TRAY (Thermoformed Food Tray with Perimeter Flange & Lidding Film)
// ============================================================================
export function createTray3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width;
  const h = params.height * 0.55; // Shallow profile
  const d = params.depth;

  const mat = PACKAGING_MATERIALS.foodGradePP();

  // Tapered cavity tray
  const trayGeom = new THREE.BoxGeometry(w * 0.92, h * 0.85, d * 0.92);
  const tray = new THREE.Mesh(trayGeom, mat);
  tray.position.set(0, -h * 0.08, 0);
  tray.castShadow = true;
  group.add(tray);

  // Flat perimeter sealing lip / flange
  const flangeGeom = new THREE.BoxGeometry(w * 1.05, 0.06, d * 1.05);
  const flange = new THREE.Mesh(flangeGeom, mat);
  flange.position.set(0, h * 0.36, 0);
  group.add(flange);

  // Clear peelable barrier lidding film
  const filmMat = PACKAGING_MATERIALS.clearPETDome();
  const filmGeom = new THREE.PlaneGeometry(w * 1.02, d * 1.02);
  const film = new THREE.Mesh(filmGeom, filmMat);
  film.rotation.x = -Math.PI / 2;
  film.position.set(0, h * 0.4, 0);
  group.add(film);

  return {
    group,
    innerBounds: {
      minX: -w * 0.42,
      maxX: w * 0.42,
      minY: -h * 0.45,
      maxY: h * 0.38,
      minZ: -d * 0.42,
      maxZ: d * 0.42,
    },
  };
}

// ============================================================================
// 15. CLAMSHELL & CAKE DOME (Clear Anti-Fog High-Clearance PET Dome)
// ============================================================================
export function createCakeDomeClamshell3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width;
  const h = params.height;
  const d = params.depth;

  // Rigid Gold / Black Paperboard Cake Board Base
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B, // Elegant dark slate cake board
    roughness: 0.4,
    metalness: 0.2,
  });
  const baseGeom = new THREE.CylinderGeometry(w * 0.52, w * 0.54, 0.12, 32);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.set(0, -h * 0.42, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Interlocking rim collar
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.6, roughness: 0.3 });
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(w * 0.48, 0.04, 8, 32), rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.set(0, -h * 0.36, 0);
  group.add(rimMesh);

  // Clear anti-fog domed cover
  const domeMat = PACKAGING_MATERIALS.clearPETDome();
  const domeH = h * 0.78;
  const domeGeom = new THREE.CylinderGeometry(w * 0.42, w * 0.47, domeH, 32, 1, true);
  const dome = new THREE.Mesh(domeGeom, domeMat);
  dome.position.set(0, -h * 0.42 + domeH / 2 + 0.06, 0);
  dome.castShadow = true;

  // Domed roof
  const roofGeom = new THREE.SphereGeometry(w * 0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const roof = new THREE.Mesh(roofGeom, domeMat);
  roof.position.set(0, -h * 0.42 + domeH + 0.06, 0);

  group.add(dome, roof);

  return {
    group,
    innerBounds: {
      minX: -w * 0.38,
      maxX: w * 0.38,
      minY: -h * 0.35,
      maxY: h * 0.38,
      minZ: -d * 0.38,
      maxZ: d * 0.38,
    },
  };
}

export const createClamshell3D = createCakeDomeClamshell3D;

// ============================================================================
// 16. CUP (Tapered Round Cup with Rolled Lip & Foil Lid)
// ============================================================================
export function createCup3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const rTop = Math.min(params.width, params.depth) * 0.45;
  const rBottom = rTop * 0.72;
  const h = params.height * 1.0;

  const mat = PACKAGING_MATERIALS.foodGradePP();

  // Tapered cup body
  const bodyGeom = new THREE.CylinderGeometry(rTop, rBottom, h * 0.92, 32);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.castShadow = true;
  group.add(body);

  // Rolled top lip rim
  const rimGeom = new THREE.TorusGeometry(rTop, 0.035, 8, 32);
  rimGeom.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeom, mat);
  rim.position.set(0, h * 0.46, 0);
  group.add(rim);

  // Peelable foil heat-seal lid
  const foilMat = PACKAGING_MATERIALS.aluminumFoil();
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(rTop * 1.01, rTop * 1.01, 0.02, 32), foilMat);
  lid.position.set(0, h * 0.47, 0);
  group.add(lid);

  return {
    group,
    innerBounds: {
      minX: -rBottom * 0.85,
      maxX: rBottom * 0.85,
      minY: -h * 0.42,
      maxY: h * 0.42,
      minZ: -rBottom * 0.85,
      maxZ: rBottom * 0.85,
    },
  };
}

// ============================================================================
// 17. TUB (Wide-Mouth PP Tub with Snap-On Rim Lid for Curd/Butter/Ice Cream)
// ============================================================================
export function createTub3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const rTop = Math.min(params.width, params.depth) * 0.52;
  const rBottom = rTop * 0.82;
  const h = params.height * 0.75; // Lower wide aspect ratio

  const mat = PACKAGING_MATERIALS.foodGradePP();

  // Tub body
  const bodyGeom = new THREE.CylinderGeometry(rTop, rBottom, h * 0.88, 32);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.06, 0);
  body.castShadow = true;
  group.add(body);

  // Snap-on lid with recessed finger tab
  const lidMat = new THREE.MeshStandardMaterial({
    color: params.secondaryColor || 0x2563EB,
    roughness: 0.35,
    metalness: 0.1,
  });
  const lidGeom = new THREE.CylinderGeometry(rTop * 1.04, rTop * 1.04, 0.08, 32);
  const lid = new THREE.Mesh(lidGeom, lidMat);
  lid.position.set(0, h * 0.42, 0);
  group.add(lid);

  return {
    group,
    innerBounds: {
      minX: -rBottom * 0.85,
      maxX: rBottom * 0.85,
      minY: -h * 0.45,
      maxY: h * 0.38,
      minZ: -rBottom * 0.85,
      maxZ: rBottom * 0.85,
    },
  };
}

// ============================================================================
// 18. BOWL (Wide Round Bowl with Flared Rim & Heat-Sealed Film)
// ============================================================================
export function createBowl3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const rTop = Math.min(params.width, params.depth) * 0.56;
  const rBottom = rTop * 0.5;
  const h = params.height * 0.65;

  const mat = PACKAGING_MATERIALS.foodGradePP();

  // Bowl geometry
  const bodyGeom = new THREE.CylinderGeometry(rTop, rBottom, h * 0.88, 32);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.06, 0);
  body.castShadow = true;
  group.add(body);

  // Flared top rim flange
  const flangeGeom = new THREE.TorusGeometry(rTop, 0.04, 8, 32);
  flangeGeom.rotateX(Math.PI / 2);
  const flange = new THREE.Mesh(flangeGeom, mat);
  flange.position.set(0, h * 0.4, 0);
  group.add(flange);

  // Clear barrier seal film
  const filmMat = PACKAGING_MATERIALS.clearPETDome();
  const film = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rTop, 0.02, 32), filmMat);
  film.position.set(0, h * 0.42, 0);
  group.add(film);

  return {
    group,
    innerBounds: {
      minX: -rBottom * 0.88,
      maxX: rBottom * 0.88,
      minY: -h * 0.45,
      maxY: h * 0.38,
      minZ: -rBottom * 0.88,
      maxZ: rBottom * 0.88,
    },
  };
}

// ============================================================================
// 19. PAPERBOARD CARTON / FOLDING CARTON (Crisp Thin SBS Box with Tuck Flaps)
// ============================================================================
export function createPaperboardCarton3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width;
  const h = params.height;
  const d = params.depth;
  const t = Math.max(0.04, params.wallThickness * 0.6);

  const mat = PACKAGING_MATERIALS.bleachedPaperboard();

  // Crisp thin-wall carton body
  const bodyGeom = new THREE.BoxGeometry(w, h, d);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.castShadow = true;
  group.add(body);

  // Top tuck flap score crease line
  const creaseMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.5 });
  const creaseGeom = new THREE.BoxGeometry(w * 0.98, 0.02, 0.02);
  const crease = new THREE.Mesh(creaseGeom, creaseMat);
  crease.position.set(0, h / 2, -d * 0.45);
  group.add(crease);

  // Tuck flap lid
  const flapLen = d * 0.5;
  const flapGeom = new THREE.BoxGeometry(w * 0.96, t, flapLen);
  flapGeom.translate(0, 0, flapLen / 2);
  const flap = new THREE.Mesh(flapGeom, mat);
  flap.position.set(0, h / 2 + 0.01, -d / 2);

  if (params.isOpen || params.isCutaway) {
    flap.rotation.x = -Math.PI * 0.55;
  }
  group.add(flap);

  return {
    group,
    innerBounds: {
      minX: -w / 2 + t,
      maxX: w / 2 - t,
      minY: -h / 2 + t,
      maxY: h / 2 - t,
      minZ: -d / 2 + t,
      maxZ: d / 2 - t,
    },
  };
}

// ============================================================================
// 20. MOLDED BIO-PULP CRADLE / TRAY (Fibrous Recycled Cellulose Packaging)
// ============================================================================
export function createMoldedPulp3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width;
  const h = params.height * 0.65;
  const d = params.depth;

  const mat = PACKAGING_MATERIALS.moldedBioPulp();

  // Contoured molded pulp tray with rounded bevels
  const trayGeom = new THREE.BoxGeometry(w, h * 0.85, d);
  const tray = new THREE.Mesh(trayGeom, mat);
  tray.position.set(0, -h * 0.08, 0);
  tray.castShadow = true;
  group.add(tray);

  // Internal contoured cavity recesses
  const recessMat = new THREE.MeshStandardMaterial({ color: 0xBDB4A2, roughness: 0.95 });
  const recessGeom = new THREE.BoxGeometry(w * 0.86, h * 0.5, d * 0.86);
  const recess = new THREE.Mesh(recessGeom, recessMat);
  recess.position.set(0, 0.05, 0);
  group.add(recess);

  return {
    group,
    innerBounds: {
      minX: -w * 0.4,
      maxX: w * 0.4,
      minY: -h * 0.4,
      maxY: h * 0.45,
      minZ: -d * 0.4,
      maxZ: d * 0.4,
    },
  };
}

// ============================================================================
// 21. FOAM CONTAINER (Expanded Polystyrene EPS Thermal Cooler Chest)
// ============================================================================
export function createFoamContainer3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 1.05;
  const h = params.height * 1.05;
  const d = params.depth * 1.05;
  const wallT = Math.max(0.18, params.wallThickness * 2.2); // Thick EPS walls

  const mat = PACKAGING_MATERIALS.epsFoam();

  // Main thick insulated cooler body
  const bodyH = h * 0.82;
  const bodyGeom = new THREE.BoxGeometry(w, bodyH, d);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.09, 0);
  body.castShadow = true;
  group.add(body);

  // Recessed friction-fit foam lid
  const lidH = h * 0.22;
  const lidGeom = new THREE.BoxGeometry(w, lidH, d);
  const lid = new THREE.Mesh(lidGeom, mat);
  lid.position.set(0, h * 0.42, 0);

  if (params.isOpen || params.isCutaway) {
    lid.position.set(0, h * 0.85, -d * 0.35);
    lid.rotation.x = -0.3;
  }
  group.add(lid);

  return {
    group,
    innerBounds: {
      minX: -w / 2 + wallT,
      maxX: w / 2 - wallT,
      minY: -bodyH / 2 + wallT,
      maxY: bodyH / 2 - wallT,
      minZ: -d / 2 + wallT,
      maxZ: d / 2 - wallT,
    },
  };
}

// ============================================================================
// 22. INSULATED THERMAL CONTAINER (Shipper with Radiant Foil & Ice Gel Packs)
// ============================================================================
export function createInsulatedContainer3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width;
  const h = params.height;
  const d = params.depth;
  const t = Math.max(0.08, params.wallThickness);

  // Outer corrugated carton
  const outerMat = PACKAGING_MATERIALS.kraftCorrugated();
  const outerGeom = new THREE.BoxGeometry(w, h, d);
  const outerBox = new THREE.Mesh(outerGeom, outerMat);
  outerBox.castShadow = true;
  group.add(outerBox);

  // Metallized radiant thermal foil liner inside
  const linerMat = PACKAGING_MATERIALS.insulationFoilLiner();
  const linerGeom = new THREE.BoxGeometry(w - t * 2, h - t * 2, d - t * 2);
  const liner = new THREE.Mesh(linerGeom, linerMat);
  group.add(liner);

  // Blue refrigerant ice gel packs inside
  const gelMat = PACKAGING_MATERIALS.iceGel();
  const gelGeom = new THREE.BoxGeometry((w - t * 3) * 0.45, 0.12, (d - t * 3) * 0.45);
  const gel1 = new THREE.Mesh(gelGeom, gelMat);
  gel1.position.set(-(w - t * 3) * 0.22, -h * 0.38, -(d - t * 3) * 0.22);
  const gel2 = new THREE.Mesh(gelGeom, gelMat);
  gel2.position.set((w - t * 3) * 0.22, -h * 0.38, (d - t * 3) * 0.22);
  group.add(gel1, gel2);

  return {
    group,
    innerBounds: {
      minX: -w / 2 + t * 2,
      maxX: w / 2 - t * 2,
      minY: -h / 2 + t * 2 + 0.14,
      maxY: h / 2 - t * 2,
      minZ: -d / 2 + t * 2,
      maxZ: d / 2 - t * 2,
    },
  };
}

// ============================================================================
// 23. FOIL CONTAINER (Aluminum Foil Tray with Crimped Rim & Press-Fit Lid)
// ============================================================================
export function createFoilContainer3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width;
  const h = params.height * 0.58;
  const d = params.depth;

  const mat = PACKAGING_MATERIALS.aluminumFoil();

  // Crimped aluminum pan base
  const panGeom = new THREE.BoxGeometry(w * 0.94, h * 0.85, d * 0.94);
  const pan = new THREE.Mesh(panGeom, mat);
  pan.position.set(0, -h * 0.08, 0);
  pan.castShadow = true;
  group.add(pan);

  // Rolled wire hem rim
  const rimGeom = new THREE.BoxGeometry(w * 1.05, 0.05, d * 1.05);
  const rim = new THREE.Mesh(rimGeom, mat);
  rim.position.set(0, h * 0.36, 0);
  group.add(rim);

  // Foil-laminated cardboard lid
  const lidMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, metalness: 0.7, roughness: 0.3 });
  const lid = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.04, d * 0.98), lidMat);
  lid.position.set(0, h * 0.39, 0);
  group.add(lid);

  return {
    group,
    innerBounds: {
      minX: -w * 0.42,
      maxX: w * 0.42,
      minY: -h * 0.45,
      maxY: h * 0.35,
      minZ: -d * 0.42,
      maxZ: d * 0.42,
    },
  };
}

// ============================================================================
// 24. VENTILATED PRODUCE CRATE / TRAY (Airflow Slats for Fresh Produce)
// ============================================================================
export function createVentilatedCrate3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width;
  const h = params.height * 0.75;
  const d = params.depth;

  const mat = PACKAGING_MATERIALS.moldedBioPulp();

  // Solid base floor
  const floorGeom = new THREE.BoxGeometry(w, 0.1, d);
  const floor = new THREE.Mesh(floorGeom, mat);
  floor.position.set(0, -h / 2, 0);
  floor.castShadow = true;
  group.add(floor);

  // Slatted ventilated sidewalls with physical air gaps
  const slatThick = 0.08;
  const numSlats = 3;
  const slatH = (h * 0.8) / numSlats;

  for (let i = 0; i < numSlats; i++) {
    const yPos = -h / 2 + 0.1 + i * (slatH + 0.06) + slatH / 2;

    const slatFBGeom = new THREE.BoxGeometry(w, slatH, slatThick);
    const slatBack = new THREE.Mesh(slatFBGeom, mat);
    slatBack.position.set(0, yPos, -d / 2 + slatThick / 2);
    group.add(slatBack);

    if (!params.isCutaway) {
      const slatFront = new THREE.Mesh(slatFBGeom, mat);
      slatFront.position.set(0, yPos, d / 2 - slatThick / 2);
      group.add(slatFront);
    }

    const slatLRGeom = new THREE.BoxGeometry(slatThick, slatH, d - slatThick * 2);
    const slatLeft = new THREE.Mesh(slatLRGeom, mat);
    slatLeft.position.set(-w / 2 + slatThick / 2, yPos, 0);
    const slatRight = new THREE.Mesh(slatLRGeom, mat);
    slatRight.position.set(w / 2 - slatThick / 2, yPos, 0);
    group.add(slatLeft, slatRight);
  }

  // 4 Corner vertical support posts
  const postGeom = new THREE.BoxGeometry(slatThick * 1.8, h, slatThick * 1.8);
  const corners = [
    [-w / 2 + slatThick, -d / 2 + slatThick],
    [w / 2 - slatThick, -d / 2 + slatThick],
    [-w / 2 + slatThick, d / 2 - slatThick],
    [w / 2 - slatThick, d / 2 - slatThick],
  ];
  corners.forEach(([cx, cz]) => {
    const post = new THREE.Mesh(postGeom, mat);
    post.position.set(cx, 0, cz);
    group.add(post);
  });

  return {
    group,
    innerBounds: {
      minX: -w / 2 + 0.12,
      maxX: w / 2 - 0.12,
      minY: -h / 2 + 0.1,
      maxY: h / 2,
      minZ: -d / 2 + 0.12,
      maxZ: d / 2 - 0.12,
    },
  };
}

// ============================================================================
// 25. REUSABLE CONTAINER / RETURNABLE TOTE (Heavy-Duty HDPE Tote with Handles)
// ============================================================================
export function createReusableContainer3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 1.02;
  const h = params.height * 0.85;
  const d = params.depth * 1.02;
  const t = Math.max(0.1, params.wallThickness);

  const mat = PACKAGING_MATERIALS.reusablePolymer();

  // Solid injection-molded base
  const baseGeom = new THREE.BoxGeometry(w, t, d);
  const base = new THREE.Mesh(baseGeom, mat);
  base.position.set(0, -h / 2 + t / 2, 0);
  base.castShadow = true;
  group.add(base);

  // Sidewalls
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), mat);
  leftWall.position.set(-w / 2 + t / 2, t / 2, 0);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), mat);
  rightWall.position.set(w / 2 - t / 2, t / 2, 0);
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, h - t, t), mat);
  backWall.position.set(0, t / 2, -d / 2 + t / 2);
  group.add(leftWall, rightWall, backWall);

  if (!params.isCutaway) {
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, h - t, t), mat);
    frontWall.position.set(0, t / 2, d / 2 - t / 2);
    group.add(frontWall);
  }

  // Reinforced structural top stacking rim
  const rimGeom = new THREE.BoxGeometry(w + 0.08, 0.08, d + 0.08);
  const rim = new THREE.Mesh(rimGeom, mat);
  rim.position.set(0, h / 2, 0);
  group.add(rim);

  // Ergonomic cutout handle grips on left and right walls
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x0369A1, roughness: 0.3 });
  const handleGeom = new THREE.BoxGeometry(0.04, 0.12, 0.35);
  const handleL = new THREE.Mesh(handleGeom, handleMat);
  handleL.position.set(-w / 2, h * 0.25, 0);
  const handleR = new THREE.Mesh(handleGeom, handleMat);
  handleR.position.set(w / 2, h * 0.25, 0);
  group.add(handleL, handleR);

  return {
    group,
    innerBounds: {
      minX: -w / 2 + t * 1.5,
      maxX: w / 2 - t * 1.5,
      minY: -h / 2 + t,
      maxY: h / 2 - t,
      minZ: -d / 2 + t * 1.5,
      maxZ: d / 2 - t * 1.5,
    },
  };
}

// ============================================================================
// 26. MULTI-WALL KRAFT PAPER BAG (Atta, Rice, Flour Block-Bottom Sack)
// ============================================================================
export function createPaperBag3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const w = params.width * 0.95;
  const h = params.height * 1.1;
  const d = params.depth * 0.85;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xC8B294, // Natural unbleached kraft paper
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Main gusseted paper sack body
  const bodyH = h * 0.82;
  const bodyGeom = new THREE.BoxGeometry(w, bodyH, d);
  const body = new THREE.Mesh(bodyGeom, mat);
  body.position.set(0, -h * 0.08, 0);
  body.castShadow = true;
  group.add(body);

  // Flat block bottom base
  const bottomGeom = new THREE.BoxGeometry(w * 0.98, 0.06, d * 0.98);
  const bottom = new THREE.Mesh(bottomGeom, mat);
  bottom.position.set(0, -h * 0.08 - bodyH / 2 + 0.03, 0);
  group.add(bottom);

  // Rolled or stitched pinched top seal
  const topRollGeom = new THREE.CylinderGeometry(0.06, 0.06, w * 0.98, 12);
  topRollGeom.rotateZ(Math.PI / 2);
  const topRoll = new THREE.Mesh(topRollGeom, mat);
  topRoll.position.set(0, h * 0.38, 0);
  group.add(topRoll);

  // Stitched crepe paper sealing band
  const tapeGeom = new THREE.BoxGeometry(w * 0.92, 0.08, 0.04);
  const tapeMat = new THREE.MeshStandardMaterial({ color: 0x991B1B }); // Red stitch tape
  const tape = new THREE.Mesh(tapeGeom, tapeMat);
  tape.position.set(0, h * 0.35, 0);
  group.add(tape);

  return {
    group,
    innerBounds: {
      minX: -w * 0.42,
      maxX: w * 0.42,
      minY: -h * 0.42,
      maxY: h * 0.3,
      minZ: -d * 0.42,
      maxZ: d * 0.42,
    },
  };
}

// ============================================================================
// 27. CORRUGATED CARDBOARD BOX (Outer Freight & Shipping Shipper)
// ============================================================================
export function createCorrugatedBox3D(params: PackageGeometryParams): PackagingMeshResult {
  const group = new THREE.Group();
  const boxGroup = new THREE.Group();
  const flapsGroup = new THREE.Group();
  group.add(boxGroup);
  group.add(flapsGroup);

  const w = params.width;
  const h = params.height;
  const d = params.depth;
  const t = Math.max(0.06, params.wallThickness);

  const mat = PACKAGING_MATERIALS.kraftCorrugated(params.roughness || 0.8);

  const halfW = w / 2;
  const halfH = h / 2;
  const halfD = d / 2;

  // Bottom Wall
  const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mat);
  bMesh.name = 'bottomWall';
  bMesh.position.set(0, -halfH + t / 2, 0);
  bMesh.castShadow = true;
  bMesh.receiveShadow = true;
  boxGroup.add(bMesh);

  // Left Wall
  const lMesh = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), mat.clone());
  lMesh.name = 'boxWall';
  lMesh.position.set(-halfW + t / 2, t / 2, 0);
  lMesh.castShadow = true;
  boxGroup.add(lMesh);

  // Right Wall
  const rMesh = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), mat.clone());
  rMesh.name = 'boxWall';
  rMesh.position.set(halfW - t / 2, t / 2, 0);
  rMesh.castShadow = true;
  boxGroup.add(rMesh);

  // Back Wall
  const backMesh = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, h - t, t), mat.clone());
  backMesh.name = 'boxWall';
  backMesh.position.set(0, t / 2, -halfD + t / 2);
  backMesh.castShadow = true;
  boxGroup.add(backMesh);

  // Front Wall (Always created; visibility modulated by cutawayFactor)
  const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(w - t * 2, h - t, t), mat.clone());
  frontMesh.name = 'frontWall';
  frontMesh.position.set(0, t / 2, halfD - t / 2);
  frontMesh.castShadow = true;
  if (params.isCutaway) {
    (frontMesh.material as THREE.MeshStandardMaterial).transparent = true;
    (frontMesh.material as THREE.MeshStandardMaterial).opacity = 0;
    frontMesh.visible = false;
  }
  boxGroup.add(frontMesh);

  // Top Flaps (Open / Closed)
  const flapLen = w * 0.48;
  const flapLGeom = new THREE.BoxGeometry(flapLen, t, d);
  flapLGeom.translate(flapLen / 2, 0, 0);
  const flapLeft = new THREE.Mesh(flapLGeom, mat.clone());
  flapLeft.name = 'flapLeft';
  flapLeft.position.set(-halfW, 0, 0);

  const flapRGeom = new THREE.BoxGeometry(flapLen, t, d);
  flapRGeom.translate(-flapLen / 2, 0, 0);
  const flapRight = new THREE.Mesh(flapRGeom, mat.clone());
  flapRight.name = 'flapRight';
  flapRight.position.set(halfW, 0, 0);

  if (params.isOpen || params.isCutaway) {
    flapLeft.rotation.z = Math.PI * 0.42;
    flapRight.rotation.z = -Math.PI * 0.42;
  }
  flapsGroup.add(flapLeft, flapRight);

  return {
    group,
    bodyGroup: boxGroup,
    lidGroup: flapsGroup,
    innerBounds: {
      minX: -halfW + t,
      maxX: halfW - t,
      minY: -halfH + t,
      maxY: halfH,
      minZ: -halfD + t,
      maxZ: halfD - t,
    },
  };
}

// ============================================================================
// 28. UNIVERSAL PACKAGING 3D REGISTRY
// ============================================================================
export type PackagingTypeKey =
  | 'corrugated_box'
  | 'paper_bag'
  | 'plastic_bag'
  | 'pouch'
  | 'vacuum_pouch'
  | 'stand_up_pouch'
  | 'pillow_pouch'
  | 'retort_pouch'
  | 'sachet'
  | 'bottle'
  | 'glass_bottle'
  | 'plastic_bottle'
  | 'jar'
  | 'glass_jar'
  | 'can'
  | 'tin'
  | 'tray'
  | 'egg_tray'
  | 'clamshell'
  | 'cake_dome'
  | 'cup'
  | 'tub'
  | 'bowl'
  | 'carton'
  | 'liquid_carton'
  | 'molded_pulp'
  | 'paperboard_carton'
  | 'folding_carton'
  | 'foam_container'
  | 'insulated_container'
  | 'thermal_packaging'
  | 'foil_container'
  | 'crate'
  | 'ventilated_crate'
  | 'reusable_container';

export const PACKAGING_3D_REGISTRY: Record<
  PackagingTypeKey,
  (params: PackageGeometryParams) => PackagingMeshResult
> = {
  corrugated_box: createCorrugatedBox3D,
  paper_bag: createPaperBag3D,
  plastic_bag: createPlasticBag3D,
  pouch: createStandUpPouch3D,
  vacuum_pouch: createVacuumPouch3D,
  stand_up_pouch: createStandUpPouch3D,
  pillow_pouch: createPillowPouch3D,
  retort_pouch: createRetortPouch3D,
  sachet: createSachet3D,
  bottle: createBottle3D,
  glass_bottle: createGlassBottle3D,
  plastic_bottle: createPlasticBottle3D,
  jar: createGlassJar3D,
  glass_jar: createGlassJar3D,
  can: createCan3D,
  tin: createTin3D,
  tray: createTray3D,
  egg_tray: createEggTray3D,
  clamshell: createCakeDomeClamshell3D,
  cake_dome: createCakeDomeClamshell3D,
  cup: createCup3D,
  tub: createTub3D,
  bowl: createBowl3D,
  carton: createPaperboardCarton3D,
  liquid_carton: createLiquidCarton3D,
  molded_pulp: createMoldedPulp3D,
  paperboard_carton: createPaperboardCarton3D,
  folding_carton: createPaperboardCarton3D,
  foam_container: createFoamContainer3D,
  insulated_container: createInsulatedContainer3D,
  thermal_packaging: createInsulatedContainer3D,
  foil_container: createFoilContainer3D,
  crate: createVentilatedCrate3D,
  ventilated_crate: createVentilatedCrate3D,
  reusable_container: createReusableContainer3D,
};

/**
 * Resolves any packaging type string into the appropriate 3D registry builder.
 * Maps exact keywords and domain terms to avoid generic cube fallbacks.
 */
export function resolvePackagingBuilder(typeStr?: string): (params: PackageGeometryParams) => PackagingMeshResult {
  if (!typeStr) return createCorrugatedBox3D;
  const s = typeStr.toLowerCase();

  // Egg packaging
  if (s.includes('egg')) return createEggTray3D;

  // Flexible pouches & bags
  if (s.includes('stand-up') || s.includes('doypack')) return createStandUpPouch3D;
  if (s.includes('pillow') || s.includes('chips') || s.includes('nitrogen')) return createPillowPouch3D;
  if (s.includes('vacuum') || s.includes('skin pack') || s.includes('vsp')) return createVacuumPouch3D;
  if (s.includes('retort')) return createRetortPouch3D;
  if (s.includes('sachet') || s.includes('packet')) return createSachet3D;
  if (s.includes('plastic bag') || s.includes('polybag') || s.includes('poly pouch') || s.includes('co-extruded')) {
    return createPlasticBag3D;
  }
  if (s.includes('paper bag') || s.includes('sack') || s.includes('flour bag') || s.includes('kraft bag')) {
    return createPaperBag3D;
  }
  if (s.includes('pouch') || s.includes('flexible film')) return createStandUpPouch3D;

  // Liquid cartons
  if (s.includes('liquid') || s.includes('tetra') || s.includes('aseptic') || (s.includes('carton') && s.includes('milk'))) {
    return createLiquidCarton3D;
  }

  // Bottles
  if (s.includes('glass bottle') || (s.includes('bottle') && (s.includes('glass') || s.includes('wine') || s.includes('oil')))) {
    return createGlassBottle3D;
  }
  if (s.includes('plastic bottle') || s.includes('dairy bottle') || s.includes('hdpe') || s.includes('pet bottle')) {
    return createPlasticBottle3D;
  }
  if (s.includes('bottle')) return createBottle3D;

  // Jars, Tins & Cans
  if (s.includes('jar') || s.includes('pickle') || s.includes('ghee jar')) return createGlassJar3D;
  if (s.includes('tin') || s.includes('biscuit tin') || s.includes('rasgulla tin')) return createTin3D;
  if (s.includes('can') || s.includes('canned') || s.includes('tinplate') || s.includes('seam')) return createCan3D;

  // Dairy tubs, cups, and bowls
  if (s.includes('tub') || s.includes('dahi') || s.includes('curd') || s.includes('butter') || s.includes('ice cream')) {
    return createTub3D;
  }
  if (s.includes('cup') || s.includes('yogurt cup')) return createCup3D;
  if (s.includes('bowl')) return createBowl3D;

  // Trays, domes & clamshells
  if (s.includes('dome') || s.includes('cake') || s.includes('clamshell') || s.includes('pastry')) {
    return createCakeDomeClamshell3D;
  }
  if (s.includes('tray') || s.includes('punnet') || s.includes('map') || s.includes('cradle tray')) {
    return createTray3D;
  }

  // Molded pulp & eco-suspension
  if (s.includes('molded pulp') || s.includes('pulp pocket') || s.includes('bio-pulp') || s.includes('eco-suspension')) {
    return createMoldedPulp3D;
  }

  // Thermal & insulated coolers
  if (s.includes('foam') || s.includes('eps')) return createFoamContainer3D;
  if (s.includes('insulated') || s.includes('thermal') || s.includes('cooler') || s.includes('cold chain')) {
    return createInsulatedContainer3D;
  }
  if (s.includes('foil') || s.includes('aluminum container')) return createFoilContainer3D;

  // Crates & returnables
  if (s.includes('reusable') || s.includes('returnable') || s.includes('tote')) return createReusableContainer3D;
  if (s.includes('crate') || s.includes('slatted') || s.includes('harvest')) return createVentilatedCrate3D;

  // Corrugated shippers & shipping boxes (including micro-flute, heavy shipper, field box)
  if (s.includes('corrugated') || s.includes('flute') || s.includes('shipper') || s.includes('box') || s.includes('kraft')) {
    return createCorrugatedBox3D;
  }

  // Paperboard cartons (thin folding paperboard)
  if (s.includes('folding carton') || s.includes('paperboard') || s.includes('tuck') || s.includes('carton')) {
    return createPaperboardCarton3D;
  }

  return createCorrugatedBox3D;
}
