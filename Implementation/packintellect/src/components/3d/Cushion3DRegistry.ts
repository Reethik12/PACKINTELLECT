/**
 * PACKINTELLECT Universal Cushioning 3D Registry
 * Procedural 3D geometries and textures for internal protection & cushions:
 * - Honeycomb Hexagonal Paper (hex structure)
 * - Molded Pulp Form-Fitting Inlay (cell cavities)
 * - Cardboard Partitions & Dividers (interlocking grid for bottles/jars/eggs)
 * - Bubble Wrap (dimpled bubble sheet)
 * - Open/Closed Cell Foam (damping perimeter pads)
 * - Paper Scrambles & Crumpled Paper (folded paper filler)
 * - Thermal Gel Packs & Insulated Liner (refrigerant pads)
 * - Corner Dampers & Suspension Struts
 */

import * as THREE from 'three';

export interface CushionGeometryParams {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  materialType?: string;
  isCutaway?: boolean;
  cols?: number;
  rows?: number;
  color?: number;
}

export function createHoneycombPaper3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d, thickness: t } = params;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xC8B294, // Kraft honeycomb paper
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // Base hex pad
  const baseGeom = new THREE.BoxGeometry(w, t, d);
  const baseMesh = new THREE.Mesh(baseGeom, mat);
  baseMesh.position.set(0, -h / 2 + t / 2, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 3D Hexagonal prism cell pillars along sides
  const hexRadius = 0.16;
  const hexH = h - t;
  const hexGeom = new THREE.CylinderGeometry(hexRadius, hexRadius, hexH, 6, 1, true);

  // Distribute along left and right flanks
  const numZ = Math.max(3, Math.floor(d / (hexRadius * 2.2)));
  const stepZ = d / numZ;

  for (let i = 0; i < numZ; i++) {
    const pz = -d / 2 + (i + 0.5) * stepZ;

    // Left flank hex cells
    const cellL = new THREE.Mesh(hexGeom, mat);
    cellL.position.set(-w / 2 + t / 2 + hexRadius, t / 2, pz);
    group.add(cellL);

    // Right flank hex cells
    const cellR = new THREE.Mesh(hexGeom, mat);
    cellR.position.set(w / 2 - t / 2 - hexRadius, t / 2, pz);
    group.add(cellR);
  }

  // Back wall pad
  const backMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h - t, t), mat);
  backMesh.position.set(0, t / 2, -d / 2 + t / 2);
  group.add(backMesh);

  return group;
}

export function createCardboardDividers3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d } = params;
  const cols = params.cols || 2;
  const rows = params.rows || 3;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xBFA078, // Dense kraft divider paperboard
    roughness: 0.75,
    side: THREE.DoubleSide,
  });

  const dividerThick = 0.04;
  const dividerH = h * 0.75;

  // Longitudinal dividers along Z
  if (cols > 1) {
    const stepX = w / cols;
    for (let c = 1; c < cols; c++) {
      const px = -w / 2 + c * stepX;
      const longDiv = new THREE.Mesh(new THREE.BoxGeometry(dividerThick, dividerH, d * 0.95), mat);
      longDiv.position.set(px, 0, 0);
      longDiv.castShadow = true;
      group.add(longDiv);
    }
  }

  // Transverse dividers along X
  if (rows > 1) {
    const stepZ = d / rows;
    for (let r = 1; r < rows; r++) {
      const pz = -d / 2 + r * stepZ;
      const transDiv = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, dividerH, dividerThick), mat);
      transDiv.position.set(0, 0, pz);
      transDiv.castShadow = true;
      group.add(transDiv);
    }
  }

  return group;
}

export function createBubbleWrap3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d, thickness: t } = params;

  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xF8FAFC,
    transparent: true,
    opacity: 0.42,
    roughness: 0.1,
    transmission: 0.85,
    ior: 1.45,
  });

  // Base backing film
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), bubbleMat);
  baseMesh.position.set(0, -h / 2 + 0.02, 0);
  group.add(baseMesh);

  // Hemispherical air bubbles in offset grid
  const bubbleRadius = 0.08;
  const bubbleGeom = new THREE.SphereGeometry(bubbleRadius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);

  const numX = Math.floor(w / (bubbleRadius * 2.5));
  const numZ = Math.floor(d / (bubbleRadius * 2.5));
  const stepX = w / numX;
  const stepZ = d / numZ;

  for (let x = 0; x < numX; x++) {
    for (let z = 0; z < numZ; z++) {
      const offset = (z % 2) * (stepX * 0.5);
      const px = -w / 2 + (x + 0.5) * stepX + offset;
      const pz = -d / 2 + (z + 0.5) * stepZ;
      if (px < w / 2 - 0.1 && px > -w / 2 + 0.1) {
        const b = new THREE.Mesh(bubbleGeom, bubbleMat);
        b.position.set(px, -h / 2 + 0.04, pz);
        group.add(b);
      }
    }
  }

  return group;
}

export function createPaperPadding3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d, thickness: t } = params;

  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xD8C4A9, // Crumpled bio-paper
    roughness: 0.95,
  });

  // Randomized folded paper nests along perimeter
  const numNests = 12;
  for (let i = 0; i < numNests; i++) {
    const angle = (i / numNests) * Math.PI * 2;
    const px = Math.cos(angle) * (w * 0.38);
    const pz = Math.sin(angle) * (d * 0.38);

    const crumpleGeom = new THREE.DodecahedronGeometry(0.18 + (i % 3) * 0.06, 0);
    crumpleGeom.scale(1.4, 0.6, 1.2);
    const mesh = new THREE.Mesh(crumpleGeom, paperMat);
    mesh.position.set(px, -h / 2 + 0.15, pz);
    mesh.rotation.set((i * 0.8), (i * 1.2), (i * 0.5));
    group.add(mesh);
  }

  // Base flat padding
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, t, d * 0.9), paperMat);
  baseMesh.position.set(0, -h / 2 + t / 2, 0);
  group.add(baseMesh);

  return group;
}

export function createThermalGelPacks3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d } = params;

  // Recycled paper wool insulated liner (white/cream fibrous blanket)
  const linerMat = new THREE.MeshStandardMaterial({
    color: 0xF1F5F9, // Thermal wool insulation
    roughness: 0.95,
  });

  const t = 0.15;
  const bottomLiner = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), linerMat);
  bottomLiner.position.set(0, -h / 2 + t / 2, 0);
  group.add(bottomLiner);

  // Left & Right thermal flank liners
  const leftLiner = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), linerMat);
  leftLiner.position.set(-w / 2 + t / 2, t / 2, 0);
  const rightLiner = new THREE.Mesh(new THREE.BoxGeometry(t, h - t, d), linerMat);
  rightLiner.position.set(w / 2 - t / 2, t / 2, 0);
  group.add(leftLiner, rightLiner);

  // Phase-Change Refrigerant Gel Packs (blue/teal frozen bricks)
  const gelMat = new THREE.MeshStandardMaterial({
    color: 0x0284C7, // Cryo refrigerant blue
    roughness: 0.25,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  const gelGeom = new THREE.BoxGeometry(w * 0.42, 0.1, d * 0.38);
  const gel1 = new THREE.Mesh(gelGeom, gelMat);
  gel1.position.set(-w * 0.22, -h / 2 + t + 0.05, 0);
  const gel2 = new THREE.Mesh(gelGeom, gelMat);
  gel2.position.set(w * 0.22, -h / 2 + t + 0.05, 0);
  group.add(gel1, gel2);

  return group;
}

export function createCornerDampers3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d, thickness: t } = params;

  const strutMat = new THREE.MeshStandardMaterial({
    color: 0x059669, // Emerald engineered bio-struts
    roughness: 0.35,
    metalness: 0.2,
  });

  // 4 Corner Interlocking kinetic struts
  const strutRadius = 0.16;
  const strutHeight = h * 0.82;
  const strutGeom = new THREE.CylinderGeometry(strutRadius, strutRadius * 1.1, strutHeight, 8);

  const corners = [
    [-w / 2 + t * 0.9, -d / 2 + t * 0.9],
    [w / 2 - t * 0.9, -d / 2 + t * 0.9],
    [-w / 2 + t * 0.9, d / 2 - t * 0.9],
    [w / 2 - t * 0.9, d / 2 - t * 0.9],
  ];

  corners.forEach(([cx, cz]) => {
    const strut = new THREE.Mesh(strutGeom, strutMat);
    strut.position.set(cx, 0, cz);
    strut.castShadow = true;
    group.add(strut);
  });

  return group;
}

export function createBioPulpCushion3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d, thickness: t } = params;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xC8BCA6, // Molded cellulose agricultural pulp
    roughness: 0.92,
    metalness: 0.02,
  });

  // Base molded pulp tray liner
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mat);
  baseMesh.position.set(0, -h / 2 + t / 2, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Form-fitting perimeter contour lip
  const lipH = Math.min(h * 0.45, t * 2.2);
  const lipT = t * 0.8;
  const leftLip = new THREE.Mesh(new THREE.BoxGeometry(lipT, lipH, d), mat);
  leftLip.position.set(-w / 2 + lipT / 2, -h / 2 + lipH / 2, 0);
  const rightLip = new THREE.Mesh(new THREE.BoxGeometry(lipT, lipH, d), mat);
  rightLip.position.set(w / 2 - lipT / 2, -h / 2 + lipH / 2, 0);
  const backLip = new THREE.Mesh(new THREE.BoxGeometry(w - lipT * 2, lipH, lipT), mat);
  backLip.position.set(0, -h / 2 + lipH / 2, -d / 2 + lipT / 2);
  group.add(leftLip, rightLip, backLip);

  return group;
}

export function createFoamCushion3D(params: CushionGeometryParams): THREE.Group {
  const group = new THREE.Group();
  const { width: w, height: h, depth: d, thickness: t } = params;

  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Charcoal open-cell high-damping acoustic/shock foam
    roughness: 0.95,
    metalness: 0.05,
  });

  // Base foam damping slab
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), foamMat);
  baseMesh.position.set(0, -h / 2 + t / 2, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Perimeter cushioning bumpers
  const bumpW = w * 0.14;
  const bumpH = h * 0.55;
  const leftBump = new THREE.Mesh(new THREE.BoxGeometry(bumpW, bumpH, d * 0.94), foamMat);
  leftBump.position.set(-w / 2 + bumpW / 2, -h / 2 + bumpH / 2, 0);
  const rightBump = new THREE.Mesh(new THREE.BoxGeometry(bumpW, bumpH, d * 0.94), foamMat);
  rightBump.position.set(w / 2 - bumpW / 2, -h / 2 + bumpH / 2, 0);
  group.add(leftBump, rightBump);

  return group;
}

export function createEmptyCushion3D(): THREE.Group {
  return new THREE.Group();
}

export function resolveCushionBuilder(cushionStr?: string): (params: CushionGeometryParams) => THREE.Group {
  if (!cushionStr) return createEmptyCushion3D;
  const s = cushionStr.toLowerCase();

  if (
    s.includes('none') ||
    s.includes('not required') ||
    s.includes('n/a') ||
    s.includes('integrated') ||
    s.includes('self-contained') ||
    s.includes('direct contact')
  ) {
    return createEmptyCushion3D;
  }

  if (s.includes('honeycomb') || s.includes('hex')) return createHoneycombPaper3D;
  if (s.includes('pulp') || s.includes('cellulose') || s.includes('bio-pulp') || s.includes('pocket') || s.includes('egg-crate')) {
    return createBioPulpCushion3D;
  }
  if (s.includes('foam') || s.includes('cell') || s.includes('open-cell') || s.includes('epe')) {
    return createFoamCushion3D;
  }
  if (s.includes('partition') || s.includes('divider') || s.includes('grid')) return createCardboardDividers3D;
  if (s.includes('bubble')) return createBubbleWrap3D;
  if (s.includes('paper') || s.includes('crumpled') || s.includes('scramble')) return createPaperPadding3D;
  if (s.includes('gel') || s.includes('refrigerant') || s.includes('thermal') || s.includes('wool')) return createThermalGelPacks3D;
  if (s.includes('damper') || s.includes('post') || s.includes('strut')) return createCornerDampers3D;

  return createHoneycombPaper3D;
}
