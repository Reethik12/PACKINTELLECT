import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FoodId, JourneyStageId, PackagingSpec } from '../../types/packaging';
import { createFoodMesh, getFoodCargoFit } from './FoodMeshes';
import { sound } from '../../utils/audioFeedback';
import { Play, Pause, Zap, Camera, ShieldAlert, Sparkles, Activity, Layers } from 'lucide-react';

interface JourneySimulation3DProps {
  foodId: FoodId;
  spec: PackagingSpec;
  isV2?: boolean;
  activeStageId: JourneyStageId;
  onEnterLab?: () => void;
  className?: string;
}

export const JourneySimulation3D: React.FC<JourneySimulation3DProps> = ({
  foodId,
  spec,
  isV2 = false,
  activeStageId,
  onEnterLab,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [camMode, setCamMode] = useState<'chase' | 'package' | 'top'>('chase');
  const [isEventActive, setIsEventActive] = useState(false);
  const [instantGForce, setInstantGForce] = useState(0.35);
  const [stressLevel, setStressLevel] = useState(15); // 0 to 100%

  const stateRef = useRef({
    isPlaying: true,
    camMode: 'chase' as 'chase' | 'package' | 'top',
    activeStageId: activeStageId,
    isV2: isV2,
    speed: 0.8,
    wheelRot: 0,
    conveyorOffset: 0,
    eventTrigger: 0,
    stressPulse: 0,
    chassisBob: 0,
    packageBounce: 0,
    stressMeshes: [] as THREE.Mesh[],
  });

  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    stateRef.current.camMode = camMode;
  }, [camMode]);

  useEffect(() => {
    stateRef.current.activeStageId = activeStageId;
    stateRef.current.isV2 = isV2;
  }, [activeStageId, isV2]);

  // Trigger simulated mechanical transit event
  const triggerTransitEvent = () => {
    stateRef.current.eventTrigger = 1.0;
    setIsEventActive(true);
    sound.impact();

    const peakG = isV2 ? 1.6 : 5.8;
    setInstantGForce(peakG);
    setStressLevel(isV2 ? 28 : 96);

    setTimeout(() => {
      setIsEventActive(false);
      setInstantGForce(0.32);
      setStressLevel(isV2 ? 12 : 22);
    }, 1300);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 540;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF4F1EA);
    scene.fog = new THREE.FogExp2(0xF4F1EA, 0.02);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);
    camera.position.set(7, 3.8, 9);
    camera.lookAt(0, 1.2, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting based on environment
    const ambientLight = new THREE.AmbientLight(0xFFFBF0, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFF7E6, 1.8);
    sunLight.position.set(12, 18, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xCFE2FE, 0.6);
    fillLight.position.set(-10, 8, -8);
    scene.add(fillLight);

    // 5. Build Environment based on activeStageId
    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const scrollingObjects: THREE.Object3D[] = [];

    // --- ENVIRONMENT DEFINITIONS ---
    if (activeStageId === 'farm') {
      // 1. FARM / SOURCE: Rural orchard ground, rustic crates, trees
      scene.background.setHex(0xFAF4E8);
      scene.fog.color.setHex(0xFAF4E8);

      // Dirt road
      const dirtGeo = new THREE.PlaneGeometry(8, 120);
      const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8C7456, roughness: 0.95 });
      const dirtRoad = new THREE.Mesh(dirtGeo, dirtMat);
      dirtRoad.rotation.x = -Math.PI / 2;
      dirtRoad.receiveShadow = true;
      envGroup.add(dirtRoad);

      // Grass terrain
      const grassGeo = new THREE.PlaneGeometry(80, 120);
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x7E9A5B, roughness: 0.9 });
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.rotation.x = -Math.PI / 2;
      grass.position.y = -0.02;
      grass.receiveShadow = true;
      envGroup.add(grass);

      // Wooden orchard harvest crates along the path (strictly on far background side)
      for (let i = 0; i < 14; i++) {
        const crateGroup = new THREE.Group();
        const crateBox = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.8, 1.2),
          new THREE.MeshStandardMaterial({ color: 0xB58A57, roughness: 0.85 })
        );
        crateBox.position.y = 0.4;
        crateGroup.add(crateBox);

        // Orchard Tree
        const treeTrunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 2.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 })
        );
        treeTrunk.position.set(0, 1.1, 2.5);
        const foliage = new THREE.Mesh(
          new THREE.SphereGeometry(1.4, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x4D7C0F, roughness: 0.6 })
        );
        foliage.position.set(0, 2.6, 2.5);
        foliage.scale.set(1.1, 1.3, 1.1);
        crateGroup.add(treeTrunk, foliage);

        // Strictly on far background side (x < -4.5), never blocking camera on positive X!
        const farX = -5.5 - (i % 3) * 1.5;
        crateGroup.position.set(farX, 0, (i - 7) * 16);
        scrollingObjects.push(crateGroup);
        envGroup.add(crateGroup);
      }
    } else if (activeStageId === 'packing') {
      // 2. PACKING: High-tech cleanroom facility with stainless roller conveyor
      scene.background.setHex(0xF1F5F9);
      scene.fog.color.setHex(0xF1F5F9);

      // Cleanroom epoxy floor
      const floorGeo = new THREE.PlaneGeometry(30, 120);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.3, metalness: 0.1 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      envGroup.add(floor);

      // Conveyor frame bed
      const frameGeo = new THREE.BoxGeometry(4.2, 0.6, 120);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(0, 0.3, 0);
      envGroup.add(frame);

      // Stainless steel spinning rollers
      const rollerGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.8, 16);
      rollerGeo.rotateZ(Math.PI / 2);
      const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.9, roughness: 0.1 });
      for (let i = 0; i < 35; i++) {
        const roller = new THREE.Mesh(rollerGeo, rollerMat);
        roller.position.set(0, 0.65, (i - 17) * 1.8);
        scrollingObjects.push(roller);
        envGroup.add(roller);
      }

      // Overhead light trusses
      for (let i = 0; i < 6; i++) {
        const truss = new THREE.Mesh(
          new THREE.BoxGeometry(10, 0.2, 0.6),
          new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.7 })
        );
        truss.position.set(0, 5.5, (i - 3) * 22);
        // Light bar
        const lightBar = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.05, 0.3),
          new THREE.MeshBasicMaterial({ color: 0xF8FAFC })
        );
        lightBar.position.y = -0.12;
        truss.add(lightBar);
        scrollingObjects.push(truss);
        envGroup.add(truss);
      }
    } else if (activeStageId === 'warehouse') {
      // 3. WAREHOUSE: Logistics hub with 3-tier industrial pallet racks
      scene.background.setHex(0xEBE8E1);
      scene.fog.color.setHex(0xEBE8E1);

      // Concrete warehouse floor
      const concreteGeo = new THREE.PlaneGeometry(40, 120);
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0xD1D5DB, roughness: 0.7 });
      const concrete = new THREE.Mesh(concreteGeo, concreteMat);
      concrete.rotation.x = -Math.PI / 2;
      concrete.receiveShadow = true;
      envGroup.add(concrete);

      // Industrial Orange/Blue Pallet Racking on left and right
      const rackMat = new THREE.MeshStandardMaterial({ color: 0xEA580C, metalness: 0.6, roughness: 0.4 });
      const palletMat = new THREE.MeshStandardMaterial({ color: 0xA16207, roughness: 0.85 });

      for (let i = 0; i < 8; i++) {
        [-7, 7].forEach((sideX) => {
          const rack = new THREE.Group();
          // Upright posts
          const postGeo = new THREE.BoxGeometry(0.15, 6.0, 0.15);
          const p1 = new THREE.Mesh(postGeo, rackMat); p1.position.set(-1.2, 3.0, -1.2);
          const p2 = new THREE.Mesh(postGeo, rackMat); p2.position.set(1.2, 3.0, -1.2);
          const p3 = new THREE.Mesh(postGeo, rackMat); p3.position.set(-1.2, 3.0, 1.2);
          const p4 = new THREE.Mesh(postGeo, rackMat); p4.position.set(1.2, 3.0, 1.2);
          rack.add(p1, p2, p3, p4);

          // 3 Shelf levels with wrapped pallets
          [1.5, 3.2, 4.8].forEach((shelfY) => {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 2.6), rackMat);
            beam.position.y = shelfY;
            const pallet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 2.2), palletMat);
            pallet.position.y = shelfY + 0.45;
            rack.add(beam, pallet);
          });

          rack.position.set(sideX, 0, (i - 4) * 16);
          scrollingObjects.push(rack);
          envGroup.add(rack);
        });
      }
    } else {
      // 4. TRANSPORT & DELIVERY: Asphalt road, lines, guardrails, urban or highway
      scene.background.setHex(0xF4F1EA);
      scene.fog.color.setHex(0xF4F1EA);

      const roadGeo = new THREE.PlaneGeometry(8, 120);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x3E3A37, roughness: 0.9 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.receiveShadow = true;
      envGroup.add(road);

      const vergeGeo = new THREE.PlaneGeometry(80, 120);
      const vergeColor = activeStageId === 'delivery' ? 0xCBD5E1 : 0xDCE7C8;
      const vergeMat = new THREE.MeshStandardMaterial({ color: vergeColor, roughness: 0.95 });
      const verge = new THREE.Mesh(vergeGeo, vergeMat);
      verge.rotation.x = -Math.PI / 2;
      verge.position.y = -0.02;
      verge.receiveShadow = true;
      envGroup.add(verge);

      // Dashed highway stripes
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
      for (let i = 0; i < 15; i++) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2), stripeMat);
        s.rotation.x = -Math.PI / 2;
        s.position.set(0, 0.01, (i - 7) * 8);
        scrollingObjects.push(s);
        envGroup.add(s);
      }

      // Guardrails and street fixtures
      for (let i = 0; i < 12; i++) {
        const fixture = new THREE.Group();
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.8 })
        );
        post.position.y = 0.6;
        fixture.add(post);

        if (activeStageId === 'delivery') {
          // Urban Street Lamp on far side only
          const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), post.material);
          lampArm.position.set(0.35, 1.15, 0);
          fixture.add(lampArm);
          fixture.position.set(-5.0, 0, (i - 6) * 12);
        } else {
          // Highway guardrail posts
          const side = i % 2 === 0 ? -4.8 : 4.8;
          fixture.position.set(side, 0, (i - 6) * 10);
        }

        scrollingObjects.push(fixture);
        envGroup.add(fixture);
      }
    }

    // 6. Transport Carrier Assembly (Van, Conveyor Caddy, or Forklift)
    const carrierGroup = new THREE.Group();
    scene.add(carrierGroup);

    // Chassis Group
    const chassisGroup = new THREE.Group();
    carrierGroup.add(chassisGroup);

    // Van Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xFCFCFA,
      roughness: 0.25,
      metalness: 0.08,
    });
    const cabGeo = new THREE.BoxGeometry(2.4, 2.3, 5.2);
    const cabMesh = new THREE.Mesh(cabGeo, bodyMat);
    cabMesh.position.set(0, 1.6, 0);
    cabMesh.castShadow = true;
    chassisGroup.add(cabMesh);

    // Front Nose / Windshield
    const noseGeo = new THREE.BoxGeometry(2.38, 1.2, 1.5);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMat);
    noseMesh.position.set(0, 1.1, 2.9);
    noseMesh.castShadow = true;
    chassisGroup.add(noseMesh);

    // Large Transparent Cargo Inspection Window
    const cargoWindowGeo = new THREE.PlaneGeometry(2.4, 1.4);
    const cargoWindowMat = new THREE.MeshPhysicalMaterial({
      color: 0xE0F2FE,
      transparent: true,
      opacity: 0.2,
      roughness: 0.05,
    });
    const cargoWindow = new THREE.Mesh(cargoWindowGeo, cargoWindowMat);
    cargoWindow.position.set(1.21, 1.6, -0.6);
    cargoWindow.rotation.y = Math.PI / 2;
    chassisGroup.add(cargoWindow);

    // Wheels
    const wheels: THREE.Group[] = [];
    const wheelPositions = [
      [-1.25, 0.5, 1.7],
      [1.25, 0.5, 1.7],
      [-1.25, 0.5, -1.7],
      [1.25, 0.5, -1.7],
    ];
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1C1917, roughness: 0.85 });

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.castShadow = true;
      wGroup.add(tire);
      wheels.push(wGroup);
      carrierGroup.add(wGroup);
    });

    // 7. REAL 3D PACKAGE VISIBLE INSIDE WITH FINITE ELEMENT STRESS HOTSPOTS
    const packageInCargo = new THREE.Group();
    const packBoxW = 1.25;
    const packBoxH = 1.15;
    const packBoxD = 1.25;
    const wallT = 0.035;
    const bottomCushionH = 0.12;
    const cushionSurfaceY = wallT + bottomCushionH;

    packageInCargo.position.set(0.1, 0.65, -0.6);
    chassisGroup.add(packageInCargo);

    // --- OUTER CORRUGATED BOX (OPEN CUTAWAY PROFILE) ---
    const cartonMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0xD5C3A8 : 0xC4A784,
      roughness: 0.85,
      metalness: 0.02,
    });
    const boxGroup = new THREE.Group();
    packageInCargo.add(boxGroup);

    // Base Floor
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(packBoxW, wallT, packBoxD), cartonMat);
    baseMesh.position.y = wallT / 2;
    boxGroup.add(baseMesh);

    // Left Wall (-X)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, packBoxH, packBoxD), cartonMat);
    leftWall.position.set(-packBoxW / 2 + wallT / 2, packBoxH / 2, 0);
    boxGroup.add(leftWall);

    // Back Wall (-Z)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(packBoxW, packBoxH, wallT), cartonMat);
    backWall.position.set(0, packBoxH / 2, -packBoxD / 2 + wallT / 2);
    boxGroup.add(backWall);

    // Front Wall (+Z)
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(packBoxW, packBoxH, wallT), cartonMat);
    frontWall.position.set(0, packBoxH / 2, packBoxD / 2 - wallT / 2);
    boxGroup.add(frontWall);

    // Right Wall (+X, facing inspection window): Lowered cutaway rim + acrylic upper
    const cutawayH = 0.44;
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, cutawayH, packBoxD), cartonMat);
    rightWall.position.set(packBoxW / 2 - wallT / 2, cutawayH / 2, 0);
    boxGroup.add(rightWall);

    const acrylicMat = new THREE.MeshPhysicalMaterial({
      color: 0xE0F2FE,
      transparent: true,
      opacity: 0.16,
      roughness: 0.08,
    });
    const acrylicMesh = new THREE.Mesh(new THREE.BoxGeometry(0.015, packBoxH - cutawayH, packBoxD), acrylicMat);
    acrylicMesh.position.set(packBoxW / 2 - wallT / 2, cutawayH + (packBoxH - cutawayH) / 2, 0);
    boxGroup.add(acrylicMesh);

    // Open Flaps
    const flapWidth = 0.20;
    const flapL = new THREE.Mesh(new THREE.BoxGeometry(flapWidth, wallT, packBoxD * 0.98), cartonMat);
    flapL.position.set(-packBoxW / 2 - flapWidth * 0.4, packBoxH + 0.04, 0);
    flapL.rotation.z = 0.45;
    const flapB = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.98, wallT, flapWidth), cartonMat);
    flapB.position.set(0, packBoxH + 0.04, -packBoxD / 2 - flapWidth * 0.4);
    flapB.rotation.x = -0.45;
    const flapF = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.98, wallT, flapWidth), cartonMat);
    flapF.position.set(0, packBoxH + 0.04, packBoxD / 2 + flapWidth * 0.4);
    flapF.rotation.x = 0.45;
    boxGroup.add(flapL, flapB, flapF);

    // --- CUSHIONING SUPPORT & LINERS ---
    const innerW = packBoxW - wallT * 2 - 0.02;
    const innerD = packBoxD - wallT * 2 - 0.02;
    const cushionMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0xD1FAE5 : 0xF3F4F6,
      roughness: 0.7,
    });

    // Bottom Shock Pad
    const bottomPad = new THREE.Mesh(new THREE.BoxGeometry(innerW, bottomCushionH, innerD), cushionMat);
    bottomPad.position.set(0, wallT + bottomCushionH / 2, 0);
    packageInCargo.add(bottomPad);

    // Side Liners
    const cushionSideT = isV2 ? 0.14 : 0.09;
    const sideCushionH = packBoxH - cushionSurfaceY - 0.12;
    const cLeft = new THREE.Mesh(new THREE.BoxGeometry(cushionSideT, sideCushionH, innerD - cushionSideT * 2), cushionMat);
    cLeft.position.set(-innerW / 2 + cushionSideT / 2, cushionSurfaceY + sideCushionH / 2, 0);
    const cBack = new THREE.Mesh(new THREE.BoxGeometry(innerW, sideCushionH, cushionSideT), cushionMat);
    cBack.position.set(0, cushionSurfaceY + sideCushionH / 2, -innerD / 2 + cushionSideT / 2);
    const cFront = new THREE.Mesh(new THREE.BoxGeometry(innerW, sideCushionH, cushionSideT), cushionMat);
    cFront.position.set(0, cushionSurfaceY + sideCushionH / 2, innerD / 2 - cushionSideT / 2);
    packageInCargo.add(cLeft, cBack, cFront);

    // --- FOOD PROTECTIVE INSERT & FOOD MODEL ---
    const insertMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0xBBF7D0 : 0xE2E8F0,
      roughness: 0.72,
    });
    const foodFit = getFoodCargoFit(foodId, cushionSurfaceY);

    if (foodFit.insertType === 'cradle') {
      const cradleRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 12, 28), insertMat);
      cradleRim.scale.set(1.15, 0.55, 1.38);
      cradleRim.rotation.x = Math.PI / 2;
      cradleRim.position.set(0, cushionSurfaceY + 0.04, 0);
      packageInCargo.add(cradleRim);
    } else if (foodFit.insertType === 'collar') {
      const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 32, 1, true), insertMat);
      collarMesh.position.set(0, cushionSurfaceY + 0.06, 0);
      packageInCargo.add(collarMesh);
    } else if (foodFit.insertType === 'bottle-bracket') {
      const baseCup = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.08, 24), insertMat);
      baseCup.position.set(0, cushionSurfaceY + 0.04, 0);
      const neckBracket = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.035, 0.65), insertMat);
      neckBracket.position.set(0, cushionSurfaceY + 0.44, 0);
      packageInCargo.add(baseCup, neckBracket);
    } else if (foodFit.insertType === 'tomato-nest') {
      const nest = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.045, 12, 24), insertMat);
      nest.rotation.x = Math.PI / 2;
      nest.position.set(0, cushionSurfaceY + 0.035, 0);
      packageInCargo.add(nest);
    } else if (foodFit.insertType === 'cell') {
      const cellCup = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        insertMat
      );
      cellCup.position.set(0, cushionSurfaceY + 0.04, 0);
      packageInCargo.add(cellCup);
    } else if (foodFit.insertType === 'partition') {
      const partTray = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 0.68), insertMat);
      partTray.position.set(0, cushionSurfaceY + 0.06, 0);
      packageInCargo.add(partTray);
    }

    // Food item nested safely inside cavity!
    const foodInside = createFoodMesh(foodId);
    foodInside.scale.set(foodFit.scale, foodFit.scale, foodFit.scale);
    if (foodId === 'mango') {
      foodInside.rotation.z = 0.12;
      foodInside.rotation.x = 0.08;
    }
    foodInside.position.set(0, foodFit.baseY, 0);
    packageInCargo.add(foodInside);

    // FINITE ELEMENT STRESS HOTSPOTS (Visual reaction to movement and bumps)
    const stressMeshes: THREE.Mesh[] = [];
    const stressSpots = [
      [-packBoxW / 2 + 0.1, 0.2, -packBoxD / 2 + 0.1], // Bottom left rear corner
      [packBoxW / 2 - 0.1, 0.2, -packBoxD / 2 + 0.1],  // Bottom right rear corner
      [-packBoxW / 2 + 0.1, 0.2, packBoxD / 2 - 0.1],  // Bottom left front corner
      [packBoxW / 2 - 0.1, 0.2, packBoxD / 2 - 0.1],   // Bottom right front corner
      [0, packBoxH * 0.9, 0],                           // Top lid seam
    ];

    stressSpots.forEach(([sx, sy, sz]) => {
      const sGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const sMat = new THREE.MeshBasicMaterial({
        color: 0xEF4444,
        transparent: true,
        opacity: 0,
        wireframe: true,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(sx, sy, sz);
      packageInCargo.add(sMesh);
      stressMeshes.push(sMesh);
    });

    stateRef.current.stressMeshes = stressMeshes;

    // 8. Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      if (s.isPlaying) {
        // Scroll environment objects
        const scrollSpeed = s.speed * 0.85;
        scrollingObjects.forEach((obj) => {
          obj.position.z -= scrollSpeed;
          if (obj.position.z < -45) {
            obj.position.z += 90;
          }
        });

        // Rotate wheels
        s.wheelRot -= s.speed * 0.35;
        wheels.forEach((w) => {
          w.rotation.x = s.wheelRot;
        });

        // Environment-specific subtle vibration frequency
        let vibeFreq = 20;
        let vibeBase = s.isV2 ? 0.003 : 0.014;
        if (s.activeStageId === 'farm') {
          vibeFreq = 12; // slow rocking
          vibeBase = s.isV2 ? 0.005 : 0.022;
        } else if (s.activeStageId === 'packing') {
          vibeFreq = 50; // high freq micro-chatter
          vibeBase = 0.004;
        }

        s.chassisBob = Math.sin(time * vibeFreq) * vibeBase;

        // Dynamic Transit Event Physics (pothole, conveyor drop, dock leveler)
        if (s.eventTrigger > 0) {
          s.eventTrigger -= delta * 1.4;
          const evFactor = Math.sin(s.eventTrigger * Math.PI);

          // Chassis violent jolt
          chassisGroup.position.y = evFactor * 0.28 + s.chassisBob;
          chassisGroup.rotation.x = -Math.cos(s.eventTrigger * Math.PI * 2) * 0.08;

          // Reactive package bounce inside cargo
          const dampMult = s.isV2 ? 0.22 : 1.35;
          packageInCargo.position.y = 0.65 + Math.abs(Math.sin(s.eventTrigger * 8)) * 0.32 * dampMult;
          packageInCargo.rotation.z = Math.sin(s.eventTrigger * 12) * 0.1 * dampMult;

          // Illuminate Finite Element Stress Hotspots!
          stressMeshes.forEach((mesh) => {
            const pulse = 1.0 + evFactor * (s.isV2 ? 0.4 : 1.2);
            mesh.scale.set(pulse, pulse, pulse);
            const mat = mesh.material as THREE.MeshBasicMaterial;
            mat.opacity = s.isV2 ? evFactor * 0.4 : evFactor * 0.95;
            mat.color.setHex(s.isV2 ? 0x10B981 : 0xEF4444); // Green on V2, Red on V1
          });
        } else {
          // Cruising steady state
          chassisGroup.position.y = s.chassisBob;
          chassisGroup.rotation.x = Math.sin(time * 4) * 0.004;

          packageInCargo.position.y = 0.65 + Math.sin(time * vibeFreq * 1.2) * (s.isV2 ? 0.002 : 0.012);
          packageInCargo.rotation.z = 0;

          // Subtle idling stress glow
          stressMeshes.forEach((mesh) => {
            const mat = mesh.material as THREE.MeshBasicMaterial;
            mat.opacity = s.isV2 ? 0.0 : Math.sin(time * 6) * 0.15;
          });
        }
      }

      // Camera Modes Interpolation
      let targetCamPos = new THREE.Vector3(7, 3.8, 9);
      let targetLookAt = new THREE.Vector3(0, 1.2, 0);

      if (s.camMode === 'package') {
        // Close-up zoomed in at package window to inspect stress points & food!
        targetCamPos.set(2.6, 1.9, 0.4);
        targetLookAt.set(0.1, 1.35, -0.6);
      } else if (s.camMode === 'top') {
        // High top-down tracking drone
        targetCamPos.set(0, 9.5, 3.5);
        targetLookAt.set(0, 0, -1);
      } else {
        // Elevated chase view
        targetCamPos.set(6.8 + Math.sin(time * 0.4) * 0.5, 3.6, 8.5);
        targetLookAt.set(0, 1.2, -0.5);
      }

      camera.position.lerp(targetCamPos, 0.06);
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
    };

    animate();

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
      renderer.dispose();
    };
  }, [foodId, spec, isV2, activeStageId]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden rounded-3xl bg-[#FAF9F5] border border-stone-200/90 shadow-md ${className}`}>
      {/* 3D Scene */}
      <div ref={mountRef} className="w-full h-full cursor-default" />

      {/* Top Floating HUD: Telemetry & Accelerometer */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-stone-200 shadow-xs pointer-events-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-semibold text-stone-900 uppercase font-mono tracking-tight">
              {activeStageId.toUpperCase()} TRANSIT
            </span>
          </div>

          {/* Accelerometer Telemetry */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-mono shadow-xs transition-colors pointer-events-auto ${
            isEventActive
              ? isV2
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-800'
                : 'bg-red-50/95 border-red-300 text-red-700 animate-pulse'
              : 'bg-white/90 border-stone-200 text-stone-600'
          }`}>
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10px] text-stone-400 uppercase">Decel Shock:</span>
            <span className="font-bold">{instantGForce.toFixed(1)}G</span>
            <span className="text-stone-300">|</span>
            <span className="text-[10px] text-stone-400 uppercase">Stress:</span>
            <span className="font-bold">{stressLevel}%</span>
          </div>
        </div>

        {/* Camera Angle Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md rounded-xl border border-stone-200 shadow-xs pointer-events-auto">
          <button
            onClick={() => { setCamMode('chase'); sound.click(); }}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              camMode === 'chase' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3 h-3" />
            Chase Cam
          </button>
          <button
            onClick={() => { setCamMode('package'); sound.click(); }}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              camMode === 'package' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            Package Stress View
          </button>
          <button
            onClick={() => { setCamMode('top'); sound.click(); }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              camMode === 'top' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Drone Cam
          </button>
        </div>
      </div>

      {/* Bottom Interactive Control Strip */}
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between pointer-events-none">
        {/* Play/Pause & Trigger Mechanical Transit Shock */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => { setIsPlaying(!isPlaying); sound.click(); }}
            className="flex items-center justify-center w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200 text-stone-800 hover:bg-stone-50 shadow-sm cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={triggerTransitEvent}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
              activeStageId === 'packing'
                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                : activeStageId === 'warehouse'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-amber-500/90 hover:bg-amber-500 text-amber-950'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>
              {activeStageId === 'farm' && 'Simulate Orchard Rut Bump'}
              {activeStageId === 'packing' && 'Simulate Conveyor Step Transfer'}
              {activeStageId === 'warehouse' && 'Simulate Forklift Dock Drop'}
              {activeStageId === 'transport' && 'Simulate Highway Pothole (5.8G)'}
              {activeStageId === 'delivery' && 'Simulate Speed Hump & Curb Drop'}
            </span>
          </button>
        </div>

        {/* Transition to Test Lab */}
        {onEnterLab && (
          <button
            onClick={() => { sound.click(); onEnterLab(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-xl shadow-md transition-all active:scale-98 pointer-events-auto cursor-pointer"
          >
            <span>Proceed to Virtual Test Lab</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Warning/Success Banner on Event Trigger */}
      {isEventActive && !isV2 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-xs font-semibold shadow-lg animate-bounce pointer-events-none">
          <ShieldAlert className="w-4 h-4" />
          <span>V1 Package Failure: Critical 5.8G Shock Exceeds Cushioning Limits</span>
        </div>
      )}

      {isEventActive && isV2 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-semibold shadow-lg animate-fade-in pointer-events-none">
          <Sparkles className="w-4 h-4" />
          <span>V2 Engineered Dampers Absorbed Shock (1.6G - Safe Transit Margin)</span>
        </div>
      )}
    </div>
  );
};
