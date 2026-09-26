import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FoodId, RedesignCandidate } from '../../types/packaging';
import { REDESIGN_CANDIDATES } from '../../data/mockData';
import { createFoodMesh, getFoodCargoFit } from './FoodMeshes';
import { sound } from '../../utils/audioFeedback';
import { Play, RotateCw, ArrowRight, Layers, Eye } from 'lucide-react';

interface PackagingTransformation3DProps {
  foodId: FoodId;
  initialCandidate?: RedesignCandidate;
  onTransformationComplete?: (candidate: RedesignCandidate) => void;
  className?: string;
}

export const PackagingTransformation3D: React.FC<PackagingTransformation3DProps> = ({
  foodId,
  initialCandidate,
  onTransformationComplete,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RedesignCandidate>(
    initialCandidate || REDESIGN_CANDIDATES[2]
  );
  const [morphT, setMorphT] = useState(0); // 0 = pure V1, 1 = target candidate V2
  const [isMorphing, setIsMorphing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3 | 4>(1);

  const stateRef = useRef({
    morphT: 0,
    targetMorphT: 0,
    selectedCandidate: selectedCandidate,
    packageGroup: null as THREE.Group | null,
    leftWall: null as THREE.Mesh | null,
    rightWall: null as THREE.Mesh | null,
    backWall: null as THREE.Mesh | null,
    bottomMesh: null as THREE.Mesh | null,
    bottomCushionMesh: null as THREE.Mesh | null,
    cLeft: null as THREE.Mesh | null,
    cRight: null as THREE.Mesh | null,
    cBack: null as THREE.Mesh | null,
    cartonMat: null as THREE.MeshStandardMaterial | null,
    cushionMat: null as THREE.MeshStandardMaterial | null,
    insertMat: null as THREE.MeshStandardMaterial | null,
    pylonsGroup: null as THREE.Group | null,
    crossRibGroup: null as THREE.Group | null,
    cornerBracesGroup: null as THREE.Group | null,
    foodGroup: null as THREE.Group | null,
    insertGroup: null as THREE.Group | null,
    rotY: -0.42,
    autoRotate: false,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotX: 0.20,
    zoom: 3.4,
    targetRotX: 0.20,
    targetRotY: -0.42,
    targetZoom: 3.4,
  });

  const handleSelectCandidate = (cand: RedesignCandidate) => {
    setSelectedCandidate(cand);
    stateRef.current.selectedCandidate = cand;
    sound.click();
  };

  const handleResetView = () => {
    stateRef.current.targetRotX = 0.20;
    stateRef.current.targetRotY = -0.42;
    stateRef.current.targetZoom = 3.4;
    sound.click();
  };

  const runMorphAnimation = () => {
    if (isMorphing) return;
    setIsMorphing(true);
    sound.morph();

    let t = 0;
    const interval = setInterval(() => {
      t += 0.015;
      if (t < 0.25) setCurrentPhase(1);
      else if (t < 0.5) setCurrentPhase(2);
      else if (t < 0.75) setCurrentPhase(3);
      else setCurrentPhase(4);

      if (t >= 1) {
        t = 1;
        clearInterval(interval);
        setIsMorphing(false);
        setMorphT(1);
        stateRef.current.targetMorphT = 1;
        setCurrentPhase(4);
        sound.success();
      } else {
        setMorphT(t);
        stateRef.current.targetMorphT = t;
      }
    }, 32);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMorphT(val);
    stateRef.current.targetMorphT = val;
    if (val < 0.25) setCurrentPhase(1);
    else if (val < 0.5) setCurrentPhase(2);
    else if (val < 0.75) setCurrentPhase(3);
    else setCurrentPhase(4);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 640;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAF9F5);

    // 2. Camera: angled slightly above and looking at the snug package center
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.55, 3.4);
    camera.lookAt(0, 0.42, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xFFFBF0, 0.90);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFAF0, 1.9);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xCFE2FE, 0.75);
    fillLight.position.set(-4, 3, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xFEF3C7, 0.55);
    rimLight.position.set(0, -2, -4);
    scene.add(rimLight);

    // 5. Contact Soft Shadow
    const shadowGeo = new THREE.PlaneGeometry(3.0, 3.0);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.07;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 6. Snug Physical Package Proportions (Identical to Truck & Food Selection)
    const packageGroup = new THREE.Group();
    // Elevated position so the entire box and food are in full view above bottom controls
    packageGroup.position.set(0, 0.08, 0);
    scene.add(packageGroup);
    stateRef.current.packageGroup = packageGroup;

    const packBoxW = 0.88;
    const packBoxH = 0.80;
    const packBoxD = 0.88;
    const baseWallT = 0.035;
    const bottomCushionH = 0.09;
    const cushionSurfaceY = baseWallT + bottomCushionH;

    // Helper: crisp structural wireframe outlines
    const addBoxWireframeEdges = (mesh: THREE.Mesh) => {
      try {
        const edgeGeo = new THREE.EdgesGeometry(mesh.geometry, 20);
        const edgeMat = new THREE.LineBasicMaterial({
          color: 0x332F2B, // Crisp dark stone structural edge
          transparent: true,
          opacity: 0.70,
          depthWrite: false,
        });
        const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
        edgeLines.renderOrder = 3;
        mesh.add(edgeLines);
      } catch {
        // Fallback
      }
    };

    // Frosted Translucent Outer Shipper Material
    const cartonMat = new THREE.MeshStandardMaterial({
      color: 0xCBB394, // V1 initial kraft, lerps to V2 candidate color
      transparent: true,
      opacity: 0.36,
      roughness: 0.28,
      metalness: 0.05,
      depthWrite: false, // Prevents occluding inner food & cradle!
      side: THREE.DoubleSide,
    });
    stateRef.current.cartonMat = cartonMat;

    const outerCartonGroup = new THREE.Group();
    packageGroup.add(outerCartonGroup);

    // Physical Base Floor Panel
    const bottomMesh = new THREE.Mesh(new THREE.BoxGeometry(packBoxW, baseWallT, packBoxD), cartonMat);
    bottomMesh.position.y = baseWallT / 2;
    bottomMesh.renderOrder = 2;
    bottomMesh.receiveShadow = true;
    addBoxWireframeEdges(bottomMesh);
    outerCartonGroup.add(bottomMesh);
    stateRef.current.bottomMesh = bottomMesh;

    // Center bottom kraft reinforcement tape
    const tapeMat = new THREE.MeshStandardMaterial({
      color: 0x926129,
      roughness: 0.55,
      metalness: 0.05,
    });
    const baseTape = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.28, baseWallT * 1.04, packBoxD * 1.002), tapeMat);
    baseTape.position.y = baseWallT / 2;
    outerCartonGroup.add(baseTape);

    // Left Wall (-X side) — Translucent with wireframe
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(baseWallT, packBoxH - baseWallT, packBoxD), cartonMat);
    leftWall.position.set(-packBoxW / 2 + baseWallT / 2, packBoxH / 2, 0);
    leftWall.renderOrder = 2;
    addBoxWireframeEdges(leftWall);
    outerCartonGroup.add(leftWall);
    stateRef.current.leftWall = leftWall;

    // Right Wall (+X side) — Translucent with wireframe
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(baseWallT, packBoxH - baseWallT, packBoxD), cartonMat);
    rightWall.position.set(packBoxW / 2 - baseWallT / 2, packBoxH / 2, 0);
    rightWall.renderOrder = 2;
    addBoxWireframeEdges(rightWall);
    outerCartonGroup.add(rightWall);
    stateRef.current.rightWall = rightWall;

    // Back Wall (-Z side) — Translucent with wireframe
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(packBoxW - baseWallT * 2, packBoxH - baseWallT, baseWallT), cartonMat);
    backWall.position.set(0, packBoxH / 2, -packBoxD / 2 + baseWallT / 2);
    backWall.renderOrder = 2;
    addBoxWireframeEdges(backWall);
    outerCartonGroup.add(backWall);
    stateRef.current.backWall = backWall;

    // Front Wall (+Z side, Facing Viewer) — Open viewing cutaway with low threshold rim & top trim
    const cutawayH = 0.16;
    const frontWallLower = new THREE.Mesh(new THREE.BoxGeometry(packBoxW - baseWallT * 2, cutawayH, baseWallT), cartonMat);
    frontWallLower.position.set(0, cutawayH / 2 + baseWallT / 2, packBoxD / 2 - baseWallT / 2);
    frontWallLower.renderOrder = 2;
    addBoxWireframeEdges(frontWallLower);
    outerCartonGroup.add(frontWallLower);

    // Realistic 3-ply flute edge trim along cut threshold rim
    const fluteEdgeMat = new THREE.MeshStandardMaterial({ color: 0xA3835B, roughness: 0.9 });
    const fluteEdge = new THREE.Mesh(new THREE.BoxGeometry(packBoxW - baseWallT * 2, 0.012, baseWallT * 1.02), fluteEdgeMat);
    fluteEdge.position.set(0, cutawayH + baseWallT / 2, packBoxD / 2 - baseWallT / 2);
    outerCartonGroup.add(fluteEdge);

    // Top Front Narrow Rim Flange
    const frontWallUpper = new THREE.Mesh(new THREE.BoxGeometry(packBoxW - baseWallT * 2, 0.05, baseWallT), cartonMat);
    frontWallUpper.position.set(0, packBoxH - 0.025, packBoxD / 2 - baseWallT / 2);
    frontWallUpper.renderOrder = 2;
    addBoxWireframeEdges(frontWallUpper);
    outerCartonGroup.add(frontWallUpper);

    // Top Flaps (Slightly angled open for dynamic realistic look)
    const flapT = baseWallT * 0.9;
    const flapGeoX = new THREE.BoxGeometry(flapT, 0.14, packBoxD * 0.96);
    const flapLeft = new THREE.Mesh(flapGeoX, cartonMat);
    flapLeft.position.set(-packBoxW / 2 + 0.04, packBoxH + 0.05, 0);
    flapLeft.rotation.z = 0.28;
    flapLeft.renderOrder = 2;
    addBoxWireframeEdges(flapLeft);

    const flapRight = new THREE.Mesh(flapGeoX, cartonMat);
    flapRight.position.set(packBoxW / 2 - 0.04, packBoxH + 0.05, 0);
    flapRight.rotation.z = -0.28;
    flapRight.renderOrder = 2;
    addBoxWireframeEdges(flapRight);

    const flapGeoZ = new THREE.BoxGeometry(packBoxW * 0.96, 0.14, flapT);
    const flapBack = new THREE.Mesh(flapGeoZ, cartonMat);
    flapBack.position.set(0, packBoxH + 0.05, -packBoxD / 2 + 0.04);
    flapBack.rotation.x = -0.28;
    flapBack.renderOrder = 2;
    addBoxWireframeEdges(flapBack);

    outerCartonGroup.add(flapLeft, flapRight, flapBack);

    // 7. Cushioning Bed & Liners
    const cushionGroup = new THREE.Group();
    packageGroup.add(cushionGroup);

    const innerW = packBoxW - baseWallT * 2;
    const innerD = packBoxD - baseWallT * 2;

    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0xF3F4F6,
      transparent: true,
      opacity: 0.75,
      roughness: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    stateRef.current.cushionMat = cushionMat;

    // Bottom Shock Absorption Pad
    const bottomCushionMesh = new THREE.Mesh(
      new THREE.BoxGeometry(innerW * 0.96, bottomCushionH, innerD * 0.96),
      cushionMat
    );
    bottomCushionMesh.position.set(0, baseWallT + bottomCushionH / 2, 0);
    bottomCushionMesh.renderOrder = 1;
    bottomCushionMesh.receiveShadow = true;
    cushionGroup.add(bottomCushionMesh);
    stateRef.current.bottomCushionMesh = bottomCushionMesh;

    // Perimeter Side Cushioning Liners
    const cushionSideT = 0.07;
    const sideCushionH = packBoxH - cushionSurfaceY - 0.08;

    const cLeft = new THREE.Mesh(new THREE.BoxGeometry(cushionSideT, sideCushionH, innerD - cushionSideT * 2), cushionMat);
    cLeft.position.set(-innerW / 2 + cushionSideT / 2, cushionSurfaceY + sideCushionH / 2, 0);
    cLeft.renderOrder = 1;

    const cRight = new THREE.Mesh(new THREE.BoxGeometry(cushionSideT, sideCushionH, innerD - cushionSideT * 2), cushionMat);
    cRight.position.set(innerW / 2 - cushionSideT / 2, cushionSurfaceY + sideCushionH / 2, 0);
    cRight.renderOrder = 1;

    const cBack = new THREE.Mesh(new THREE.BoxGeometry(innerW, sideCushionH, cushionSideT), cushionMat);
    cBack.position.set(0, cushionSurfaceY + sideCushionH / 2, -innerD / 2 + cushionSideT / 2);
    cBack.renderOrder = 1;

    // Front low cushion lip
    const cFrontH = Math.max(0.04, cutawayH - cushionSurfaceY);
    const cFront = new THREE.Mesh(new THREE.BoxGeometry(innerW, cFrontH, cushionSideT), cushionMat);
    cFront.position.set(0, cushionSurfaceY + cFrontH / 2, innerD / 2 - cushionSideT / 2);
    cFront.renderOrder = 1;

    cushionGroup.add(cLeft, cRight, cBack, cFront);
    stateRef.current.cLeft = cLeft;
    stateRef.current.cRight = cRight;
    stateRef.current.cBack = cBack;

    // 8. Food-Specific Protective Insert / Bio-Cradle Nest
    const insertGroup = new THREE.Group();
    insertGroup.position.set(0, cushionSurfaceY, 0);
    packageGroup.add(insertGroup);
    stateRef.current.insertGroup = insertGroup;

    const insertMat = new THREE.MeshStandardMaterial({
      color: 0xE5E7EB,
      roughness: 0.72,
    });
    stateRef.current.insertMat = insertMat;

    const foodFit = getFoodCargoFit(foodId, cushionSurfaceY);

    if (foodFit.insertType === 'cradle' || foodFit.insertType === 'tomato-nest' || foodFit.insertType === 'cell') {
      // Molded bottom tray bed
      const cradleBed = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.33, 0.04, 24), insertMat);
      cradleBed.scale.set(1.15, 1.0, 1.35);
      cradleBed.position.y = 0.02;
      cradleBed.renderOrder = 1;
      insertGroup.add(cradleBed);

      // Molded pulp bio-cradle tray with nest depression
      const cradleRim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.055, 12, 28), insertMat);
      cradleRim.scale.set(1.15, 0.60, 1.38);
      cradleRim.rotation.x = Math.PI / 2;
      cradleRim.position.y = 0.05;
      cradleRim.renderOrder = 1;
      insertGroup.add(cradleRim);
    } else if (foodFit.insertType === 'collar') {
      const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 32, 1, true), insertMat);
      collarMesh.position.y = 0.06;
      collarMesh.renderOrder = 1;
      insertGroup.add(collarMesh);

      const cornerOffsets = [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]];
      cornerOffsets.forEach(([wx, wz]) => {
        const cornerBlock = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.10), insertMat);
        cornerBlock.position.set(wx, 0.05, wz);
        cornerBlock.renderOrder = 1;
        insertGroup.add(cornerBlock);
      });
    } else if (foodFit.insertType === 'bottle-bracket') {
      const baseCup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.08, 24), insertMat);
      baseCup.position.y = 0.04;
      baseCup.renderOrder = 1;
      insertGroup.add(baseCup);

      const neckBracket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.55), insertMat);
      neckBracket.position.y = 0.38;
      neckBracket.renderOrder = 1;
      insertGroup.add(neckBracket);
    } else {
      // Form-Fit Recessed Stabilizer Tray
      const trayMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.65), insertMat);
      trayMesh.position.y = 0.02;
      trayMesh.renderOrder = 1;
      insertGroup.add(trayMesh);

      const borderRim = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.68), insertMat);
      borderRim.position.y = 0.03;
      borderRim.renderOrder = 1;
      insertGroup.add(borderRim);
    }

    // 9. V2 Metamorphosis Candidate Structural Reinforcements
    // Candidate C: Quad Interlocking Dampers / Pylons
    const pylonsGroup = new THREE.Group();
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35, metalness: 0.2 });
    const pylonGeo = new THREE.CylinderGeometry(0.045, 0.045, sideCushionH * 0.9, 14);
    const cornerCoords = [
      [-innerW / 2 + cushionSideT * 1.2, -innerD / 2 + cushionSideT * 1.2],
      [innerW / 2 - cushionSideT * 1.2, -innerD / 2 + cushionSideT * 1.2],
      [-innerW / 2 + cushionSideT * 1.2, innerD / 2 - cushionSideT * 1.2],
      [innerW / 2 - cushionSideT * 1.2, innerD / 2 - cushionSideT * 1.2],
    ];
    cornerCoords.forEach(([px, pz]) => {
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(px, cushionSurfaceY + (sideCushionH * 0.9) / 2, pz);
      pylon.castShadow = true;
      pylonsGroup.add(pylon);
    });
    packageGroup.add(pylonsGroup);
    stateRef.current.pylonsGroup = pylonsGroup;

    // Candidate B: Armor Cross-Rib Suspension Grid
    const crossRibGroup = new THREE.Group();
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x9A3412, roughness: 0.45 });
    const rib1 = new THREE.Mesh(new THREE.BoxGeometry(innerW * 0.88, 0.08, 0.14), ribMat);
    rib1.rotation.y = Math.PI / 4;
    const rib2 = new THREE.Mesh(new THREE.BoxGeometry(innerW * 0.88, 0.08, 0.14), ribMat);
    rib2.rotation.y = -Math.PI / 4;
    crossRibGroup.add(rib1, rib2);
    crossRibGroup.position.set(0, cushionSurfaceY + 0.04, 0);
    packageGroup.add(crossRibGroup);
    stateRef.current.crossRibGroup = crossRibGroup;

    // Candidate A: Molded Pulp Corner Gussets
    const cornerBracesGroup = new THREE.Group();
    const pulpBraceMat = new THREE.MeshStandardMaterial({ color: 0xA18072, roughness: 0.8 });
    const braceGeo = new THREE.ConeGeometry(0.18, 0.32, 4);
    braceGeo.rotateY(Math.PI / 4);
    cornerCoords.forEach(([px, pz]) => {
      const brace = new THREE.Mesh(braceGeo, pulpBraceMat);
      brace.position.set(px, cushionSurfaceY + 0.16, pz);
      cornerBracesGroup.add(brace);
    });
    packageGroup.add(cornerBracesGroup);
    stateRef.current.cornerBracesGroup = cornerBracesGroup;

    // 10. Solid Food Payload (Snug Proportions & 100% Fully Visible)
    const foodGroup = new THREE.Group();
    const foodMesh = createFoodMesh(foodId);
    // Identical scale multiplier as truck simulation for snug payload fit
    const cargoScale = foodFit.scale * 1.55;
    foodMesh.scale.set(cargoScale, cargoScale, cargoScale);

    // Solid opaque food rendering
    foodMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.renderOrder = 0;
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.depthWrite = true;
        }
      }
    });

    const foodBaseY = cushionSurfaceY + 0.11;
    foodGroup.position.set(0, foodBaseY, 0);
    foodGroup.add(foodMesh);
    packageGroup.add(foodGroup);
    stateRef.current.foodGroup = foodGroup;

    // 11. Animation Loop & Morphing System
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;

      s.morphT += (s.targetMorphT - s.morphT) * 0.1;
      const t = s.morphT;
      const cand = s.selectedCandidate;

      // Orbit camera rotation
      if (s.autoRotate && !s.isDragging) {
        s.targetRotY += 0.005;
      }
      s.rotX += (s.targetRotX - s.rotX) * 0.1;
      s.rotY += (s.targetRotY - s.rotY) * 0.1;
      s.zoom += (s.targetZoom - s.zoom) * 0.1;

      packageGroup.rotation.x = s.rotX;
      packageGroup.rotation.y = s.rotY;

      camera.position.set(0, 0.55, s.zoom);
      camera.lookAt(0, 0.42, 0);

      // --- TARGET MORPH PHYSICAL TRANSFORMATIONS ---
      const targetWallMm = cand.spec.wallThicknessMm;
      const targetCushionMm = cand.spec.cushionThicknessMm;

      // Wall Caliper Expansion: 4.5mm -> targetWallMm
      const wallThicknessRatio = 1.0 + t * ((targetWallMm / 4.5) - 1.0);
      if (leftWall && rightWall && backWall && bottomMesh) {
        leftWall.scale.x = wallThicknessRatio;
        rightWall.scale.x = wallThicknessRatio;
        backWall.scale.z = wallThicknessRatio;
        bottomMesh.scale.y = wallThicknessRatio;
      }

      // Cushion Depth Expansion: 12mm -> targetCushionMm
      const cushionThicknessRatio = 1.0 + t * ((targetCushionMm / 12.0) - 1.0);
      if (cLeft && cRight && cBack && bottomCushionMesh) {
        cLeft.scale.x = cushionThicknessRatio;
        cRight.scale.x = cushionThicknessRatio;
        cBack.scale.z = cushionThicknessRatio;
        bottomCushionMesh.scale.y = cushionThicknessRatio;
      }

      // Dynamic Material Sheens and Color Tones
      if (cartonMat && cushionMat && insertMat) {
        if (cand.id === 'candidate-a') {
          // Candidate A: Eco Molded Pulp
          cartonMat.color.lerpColors(new THREE.Color(0xCBB394), new THREE.Color(0xD8C7B0), t);
          cushionMat.color.lerpColors(new THREE.Color(0xF3F4F6), new THREE.Color(0xE7DFD5), t);
          insertMat.color.lerpColors(new THREE.Color(0xE5E7EB), new THREE.Color(0xC8B8A6), t);
        } else if (cand.id === 'candidate-b') {
          // Candidate B: Armor-Flute Heavy Box
          cartonMat.color.lerpColors(new THREE.Color(0xCBB394), new THREE.Color(0xB89369), t);
          cushionMat.color.lerpColors(new THREE.Color(0xF3F4F6), new THREE.Color(0xE2E8F0), t);
          insertMat.color.lerpColors(new THREE.Color(0xE5E7EB), new THREE.Color(0x94A3B8), t);
        } else {
          // Candidate C: Bio-Hex Quad-Lock Matrix
          cartonMat.color.lerpColors(new THREE.Color(0xCBB394), new THREE.Color(0xD7C4A8), t);
          cushionMat.color.lerpColors(new THREE.Color(0xF3F4F6), new THREE.Color(0xBBF7D0), t);
          insertMat.color.lerpColors(new THREE.Color(0xE5E7EB), new THREE.Color(0x86EFAC), t);
        }
      }

      // Support Manifestations
      if (pylonsGroup && crossRibGroup && cornerBracesGroup) {
        if (cand.id === 'candidate-c') {
          pylonsGroup.visible = true;
          crossRibGroup.visible = false;
          cornerBracesGroup.visible = false;
          pylonsGroup.position.y = 1.2 * (1 - t);
          const pScale = Math.min(1, t * 1.35);
          pylonsGroup.scale.set(pScale, 1, pScale);
        } else if (cand.id === 'candidate-b') {
          pylonsGroup.visible = false;
          crossRibGroup.visible = true;
          cornerBracesGroup.visible = false;
          crossRibGroup.scale.set(t, t, t);
        } else {
          pylonsGroup.visible = false;
          crossRibGroup.visible = false;
          cornerBracesGroup.visible = true;
          cornerBracesGroup.scale.set(t, t, t);
        }
      }

      // Food Cradle Stability Elevation
      if (foodGroup) {
        foodGroup.position.y = foodBaseY + t * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse Interaction
    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.isDragging) return;
      const dx = e.clientX - s.prevMouseX;
      const dy = e.clientY - s.prevMouseY;
      s.targetRotY += dx * 0.008;
      s.targetRotX = Math.max(-0.5, Math.min(0.9, s.targetRotX + dy * 0.008));
      s.prevMouseX = e.clientX;
      s.prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      s.targetZoom = Math.max(2.2, Math.min(5.2, s.targetZoom + e.deltaY * 0.004));
    };

    const el = renderer.domElement;
    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, [foodId, selectedCandidate.id]);

  // Derived Dynamic Metrics
  const liveWall = (4.5 + morphT * (selectedCandidate.spec.wallThicknessMm - 4.5)).toFixed(1);
  const liveCushion = (12.0 + morphT * (selectedCandidate.spec.cushionThicknessMm - 12.0)).toFixed(1);
  const liveShock = Math.round(22 + morphT * (selectedCandidate.shockAbsorptionPct - 22));
  const liveStack = Math.round(920 + morphT * (selectedCandidate.spec.boxHeightMm > 230 ? 1930 : 980));

  return (
    <div className={`relative w-full h-full select-none overflow-hidden rounded-3xl bg-[#FAF9F5] border border-stone-200/90 shadow-lg ${className}`}>
      {/* 3D Morph Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Bar: Redesign Architecture Switcher & Info Badges */}
      <div className="absolute top-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        {/* Architecture Selectors */}
        <div className="flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-xs pointer-events-auto">
          {REDESIGN_CANDIDATES.map((cand) => {
            const isChosen = cand.id === selectedCandidate.id;
            return (
              <button
                key={cand.id}
                onClick={() => handleSelectCandidate(cand)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isChosen
                    ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span>{cand.name}</span>
                {cand.id === 'candidate-c' && (
                  <span className="ml-1 text-[10px] text-amber-300">★</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Phase Badge & View Reset */}
        <div className="flex items-center gap-2 pointer-events-auto self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-stone-200 shadow-xs">
            <span className="text-[11px] font-mono text-stone-500 uppercase">Phase 0{currentPhase}:</span>
            <span className="text-xs font-semibold text-emerald-800">
              {currentPhase === 1 && `Wall Caliper Thickening (+${(parseFloat(liveWall) - 4.5).toFixed(1)}mm)`}
              {currentPhase === 2 && `Cellular Cushion Expansion (${liveCushion}mm)`}
              {currentPhase === 3 && `Deploying ${selectedCandidate.spec.supportType}`}
              {currentPhase === 4 && `Surface Rigidity & Barrier Locked`}
            </span>
          </div>

          <button
            onClick={handleResetView}
            title="Reset 3D Camera View"
            className="p-1.5 bg-white/90 backdrop-blur-md hover:bg-white text-stone-600 hover:text-stone-900 rounded-full border border-stone-200 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Translucent Disclaimer Pill */}
      <div className="absolute top-18 left-4 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 rounded-full shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-medium text-emerald-200">
            Translucent X-Ray Preview · Snug Fit & Open Front Cutaway
          </span>
        </div>
      </div>

      {/* Bottom Interactive Transformation Controller */}
      <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-900">
                Morphing into {selectedCandidate.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
                {selectedCandidate.focus}
              </span>
            </div>
            <span className="text-[11px] text-stone-500 block line-clamp-1">
              {selectedCandidate.description}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runMorphAnimation}
              disabled={isMorphing}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{isMorphing ? 'Morphing Geometry...' : 'Auto-Morph V1 → V2'}</span>
            </button>

            {onTransformationComplete && morphT >= 0.95 && (
              <button
                onClick={() => {
                  sound.click();
                  onTransformationComplete(selectedCandidate);
                }}
                className="flex items-center gap-2 px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95 animate-fade-in cursor-pointer"
              >
                <span>Re-Test Engineered V2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Continuous Morph Slider */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 mb-1">
            <span>0% V1 (Single-Wall Kraft)</span>
            <span className="text-emerald-700 font-semibold">{Math.round(morphT * 100)}% Metamorphosis Applied</span>
            <span>100% {selectedCandidate.name}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={morphT}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
          />
        </div>

        {/* 4 Dynamic Metric Readouts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100">
          <div className="p-1.5 px-2 bg-stone-50 rounded-xl">
            <span className="text-[9px] uppercase text-stone-400 font-mono block">Wall Thickness</span>
            <span className="text-xs font-semibold font-mono text-stone-800">{liveWall} mm</span>
            <span className="text-[9px] text-stone-400 block">Target: {selectedCandidate.spec.wallThicknessMm}mm</span>
          </div>

          <div className="p-1.5 px-2 bg-stone-50 rounded-xl">
            <span className="text-[9px] uppercase text-stone-400 font-mono block">Cushion Depth</span>
            <span className="text-xs font-semibold font-mono text-stone-800">{liveCushion} mm</span>
            <span className="text-[9px] text-stone-400 block">Target: {selectedCandidate.spec.cushionThicknessMm}mm</span>
          </div>

          <div className="p-1.5 px-2 bg-stone-50 rounded-xl">
            <span className="text-[9px] uppercase text-stone-400 font-mono block">Shock Attenuation</span>
            <span className="text-xs font-semibold font-mono text-emerald-700">{liveShock}%</span>
            <span className="text-[9px] text-stone-400 block">Target: {selectedCandidate.shockAbsorptionPct}%</span>
          </div>

          <div className="p-1.5 px-2 bg-stone-50 rounded-xl">
            <span className="text-[9px] uppercase text-stone-400 font-mono block">Compressive Stacking</span>
            <span className="text-xs font-semibold font-mono text-stone-800">{liveStack} N</span>
            <span className="text-[9px] text-stone-400 block">Max Top-Load</span>
          </div>
        </div>
      </div>
    </div>
  );
};
