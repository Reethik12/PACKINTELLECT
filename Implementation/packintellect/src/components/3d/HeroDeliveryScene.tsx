import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FoodId, PackagingSpec, JourneyStageId } from '../../types/packaging';
import { createFoodMesh, getFoodCargoFit } from './FoodMeshes';
import { sound } from '../../utils/audioFeedback';
import { Play, Pause, Zap, Camera, ShieldAlert, Sparkles, Navigation, ArrowDown, ArrowUp, Compass } from 'lucide-react';

export interface HeroDeliverySceneProps {
  foodId: FoodId;
  spec: PackagingSpec;
  isV2?: boolean;
  onEnterLab?: () => void;
  className?: string;
  activeStageId?: JourneyStageId;
  stageName?: string;
}

export type BumpIntensity = 'low' | 'medium' | 'high';
export type ManeuverType = 'none' | 'brake' | 'accel' | 'turnLeft' | 'turnRight';

// --- PROCEDURAL TEXTURES FOR REALISTIC CARGO INTERIOR ---
function createCargoFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Industrial dark slate base
  ctx.fillStyle = '#2B3544';
  ctx.fillRect(0, 0, 512, 512);

  // Anti-slip ribbed diamond tread pattern
  ctx.lineWidth = 1.6;
  for (let y = 0; y < 512; y += 16) {
    for (let x = 0; x < 512; x += 16) {
      const isAlt = ((x + y) / 16) % 2 === 0;
      if (isAlt) {
        // Highlight stroke
        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 8);
        ctx.lineTo(x + 8, y + 2);
        ctx.lineTo(x + 14, y + 8);
        ctx.stroke();

        // Shadow groove stroke
        ctx.strokeStyle = '#1E293B';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 8);
        ctx.lineTo(x + 8, y + 14);
        ctx.lineTo(x + 14, y + 8);
        ctx.stroke();
      }
    }
  }

  // Metallic micro-stipple noise
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 2500; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillRect(rx, ry, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 5);
  return texture;
}

function createCargoWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Semi-gloss insulated composite cargo wall panel
  ctx.fillStyle = '#EDECE4';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical panel seams & joints
  ctx.strokeStyle = '#D1CEC4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 0); ctx.lineTo(128, 512);
  ctx.moveTo(256, 0); ctx.lineTo(256, 512);
  ctx.moveTo(384, 0); ctx.lineTo(384, 512);
  ctx.stroke();

  // Panel highlight seam
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(130, 0); ctx.lineTo(130, 512);
  ctx.moveTo(258, 0); ctx.lineTo(258, 512);
  ctx.moveTo(386, 0); ctx.lineTo(386, 512);
  ctx.stroke();

  // Fastener rivet dots along top, bottom, and mid-rails
  ctx.fillStyle = '#94A3B8';
  for (let x = 32; x < 512; x += 64) {
    ctx.beginPath(); ctx.arc(x, 24, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, 488, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, 256, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Soft rounded radial ambient occlusion contact shadow
  const grad = ctx.createRadialGradient(128, 128, 24, 128, 128, 122);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.76)');
  grad.addColorStop(0.4, 'rgba(15, 23, 42, 0.44)');
  grad.addColorStop(0.75, 'rgba(15, 23, 42, 0.12)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

export const HeroDeliveryScene: React.FC<HeroDeliverySceneProps> = ({
  foodId,
  spec,
  isV2 = false,
  onEnterLab,
  className = '',
  activeStageId,
  stageName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [camMode, setCamMode] = useState<'cargo' | 'chase' | 'front'>('cargo'); // Default to Cargo Cutaway
  const [bumpIntensity, setBumpIntensity] = useState<BumpIntensity>('high');
  const [bumpActive, setBumpActive] = useState(false);
  const [bumpStepText, setBumpStepText] = useState('');
  const [activeManeuver, setActiveManeuver] = useState<ManeuverType>('none');
  const [shockG, setShockG] = useState(0.4);
  const [speedKmh, setSpeedKmh] = useState(65);

  const stateRef = useRef({
    isPlaying: true,
    camMode: 'cargo' as 'chase' | 'cargo' | 'front',
    bumpIntensity: 'high' as BumpIntensity,
    isV2: isV2,
    baseSpeed: 0.85,
    currentSpeed: 0.85,
    targetSpeed: 0.85,
    speedKmh: 65,
    wheelRot: 0,
    steerAngle: 0,
    targetSteerAngle: 0,
    // Cutaway animation progress (0 = solid panel, 1 = fully open cutaway)
    cutawayT: 1.0,
    targetCutawayT: 1.0,
    // Maneuver state machine
    maneuver: 'none' as ManeuverType,
    maneuverTime: 0,
    maneuverDuration: 0,
    // Accelerations (for physics inheritance)
    longitudinalAccel: 0, // forward/backward
    lateralAccel: 0,      // centrifugal turning
    verticalAccel: 0,     // bumps
    // Bump timeline
    bumpActive: false,
    bumpSequenceTime: 0,
    bumpSequenceDuration: 0,
    // Truck chassis suspension states
    suspensionFront: 0,
    suspensionRear: 0,
    chassisPitch: 0,
    chassisRoll: 0,
    chassisYaw: 0,
    chassisY: 0,
    // --- TRUE SPRING-DAMPER PACKAGE PHYSICS ---
    packagePosX: 0, // lateral
    packagePosY: 0, // vertical
    packagePosZ: 0, // longitudinal
    packageVelX: 0,
    packageVelY: 0,
    packageVelZ: 0,
    packageRotX: 0, // pitch tilt
    packageRotY: 0, // yaw
    packageRotZ: 0, // roll tilt
    // --- INTERNAL FOOD PAYLOAD SPRING-DAMPER ---
    foodDispX: 0,
    foodDispY: 0,
    foodDispZ: 0,
    foodVelX: 0,
    foodVelY: 0,
    foodVelZ: 0,
    // --- VISCOELASTIC CUSHION SPRING DEFORMER ---
    cushionCompression: 0,
    cushionVelocity: 0,
    // Scene objects references
    chassisGroup: null as THREE.Group | null,
    frontWheelsGroup: null as THREE.Group | null,
    rearWheelsGroup: null as THREE.Group | null,
    frontL: null as THREE.Group | null,
    frontR: null as THREE.Group | null,
    cargoCutawayWall: null as THREE.Mesh | null,
    packageGroup: null as THREE.Group | null,
    foodMeshGroup: null as THREE.Group | null,
    cushionMesh: null as THREE.Mesh | null,
    cargoDomeLight: null as THREE.PointLight | null,
    potholeMesh: null as THREE.Mesh | null,
    speedBumpMesh: null as THREE.Mesh | null,
    stressRing: null as THREE.Mesh | null,
    stripes: [] as THREE.Mesh[],
    backgroundScenery: [] as THREE.Object3D[],
  });

  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    stateRef.current.camMode = camMode;
    stateRef.current.targetCutawayT = camMode === 'cargo' ? 1.0 : 0.0;
  }, [camMode]);

  useEffect(() => {
    stateRef.current.bumpIntensity = bumpIntensity;
  }, [bumpIntensity]);

  useEffect(() => {
    stateRef.current.isV2 = isV2;
  }, [isV2]);

  useEffect(() => {
    if (!activeStageId) return;
    const stageSpeedMap: Record<string, { speed: number; intensity: BumpIntensity }> = {
      farm: { speed: 0.45, intensity: 'medium' },
      packing: { speed: 0.35, intensity: 'low' },
      warehouse: { speed: 0.40, intensity: 'medium' },
      transport: { speed: 1.0, intensity: 'high' },
      delivery: { speed: 0.60, intensity: 'high' },
    };
    const config = stageSpeedMap[activeStageId] || { speed: 0.85, intensity: 'high' };
    stateRef.current.baseSpeed = config.speed;
    stateRef.current.targetSpeed = config.speed;
    setBumpIntensity(config.intensity);
  }, [activeStageId]);

  // Trigger Road Irregularities Sequence
  const triggerMultiBumpTest = () => {
    const s = stateRef.current;
    if (s.bumpActive) return;

    s.bumpActive = true;
    s.bumpSequenceTime = 0;
    s.bumpSequenceDuration = bumpIntensity === 'high' ? 3.4 : bumpIntensity === 'medium' ? 2.2 : 1.2;
    setBumpActive(true);

    const peakG = isV2
      ? (bumpIntensity === 'high' ? 1.8 : bumpIntensity === 'medium' ? 1.2 : 0.6)
      : (bumpIntensity === 'high' ? 5.8 : bumpIntensity === 'medium' ? 3.4 : 1.6);
    setShockG(peakG);
    sound.impact();
  };

  // Trigger Dynamic Driving Maneuvers (Braking, Acceleration, Turn Left, Turn Right)
  const triggerManeuver = (type: ManeuverType) => {
    const s = stateRef.current;
    s.maneuver = type;
    s.maneuverTime = 0;
    s.maneuverDuration = type === 'brake' ? 1.4 : type === 'accel' ? 1.4 : 1.8;
    setActiveManeuver(type);
    sound.click();

    setTimeout(() => {
      setActiveManeuver('none');
      s.maneuver = 'none';
    }, s.maneuverDuration * 1000);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 560;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF6F4EE); // Warm cream daylight
    scene.fog = new THREE.FogExp2(0xF6F4EE, 0.016);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 140);
    camera.position.set(2.85, 1.85, 0.3);
    camera.lookAt(0.0, 1.25, -0.8);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting: Three-Point Studio + Sunlight + Cargo Dome Spotlight
    const ambientLight = new THREE.AmbientLight(0xFFFBF0, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFF7E6, 1.8);
    sunLight.position.set(10, 18, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xDCE7FE, 0.55);
    fillLight.position.set(-10, 6, -8);
    scene.add(fillLight);

    // 5. Road & Environment
    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const roadWidth = 8.5;
    const roadLength = 130;
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x3A3734,
      roughness: 0.88,
      metalness: 0.05,
    });
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, roadLength, 1, 80), roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = -0.01;
    roadMesh.receiveShadow = true;
    envGroup.add(roadMesh);

    // Curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.7 });
    const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, roadLength), curbMat);
    leftCurb.position.set(-roadWidth / 2 - 0.15, 0.05, 0);
    const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, roadLength), curbMat);
    rightCurb.position.set(roadWidth / 2 + 0.15, 0.05, 0);
    envGroup.add(leftCurb, rightCurb);

    // Grass verge
    const grassMat = new THREE.MeshStandardMaterial({ color: 0xDCE8CC, roughness: 0.95 });
    const grassMesh = new THREE.Mesh(new THREE.PlaneGeometry(80, roadLength), grassMat);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.y = -0.04;
    grassMesh.receiveShadow = true;
    envGroup.add(grassMesh);

    // Dashed centerlines
    const stripes: THREE.Mesh[] = [];
    const stripeCount = 18;
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
    for (let i = 0; i < stripeCount; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.2), stripeMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.01, (i - stripeCount / 2) * 7.5);
      stripes.push(s);
      envGroup.add(s);
    }
    stateRef.current.stripes = stripes;

    // Real 3D road obstacles
    const bumpGeo = new THREE.CylinderGeometry(0.45, 0.45, 3.8, 16, 1, false, 0, Math.PI);
    bumpGeo.rotateZ(Math.PI / 2);
    const bumpMat = new THREE.MeshStandardMaterial({ color: 0xEAB308, roughness: 0.8 });
    const speedBumpMesh = new THREE.Mesh(bumpGeo, bumpMat);
    speedBumpMesh.position.set(0, 0.02, 35);
    envGroup.add(speedBumpMesh);
    stateRef.current.speedBumpMesh = speedBumpMesh;

    const potholeMat = new THREE.MeshStandardMaterial({ color: 0x1E1E1E, roughness: 0.95 });
    const potholeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.55, 0.1, 16), potholeMat);
    potholeMesh.position.set(0.6, -0.02, 55);
    envGroup.add(potholeMesh);
    stateRef.current.potholeMesh = potholeMesh;

    // Continuous roadside trees (STRICTLY ON FAR BACKGROUND SIDE x < -5.0)
    const backgroundScenery: THREE.Object3D[] = [];
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 });
    const foliageMatA = new THREE.MeshStandardMaterial({ color: 0x4D7C0F, roughness: 0.7 });
    const foliageMatB = new THREE.MeshStandardMaterial({ color: 0x3F6212, roughness: 0.7 });

    for (let i = 0; i < 14; i++) {
      const treeGroup = new THREE.Group();
      const hScale = 0.8 + (i % 5) * 0.15;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16 * hScale, 0.22 * hScale, 2.2 * hScale, 8),
        treeTrunkMat
      );
      trunk.position.y = 1.1 * hScale;

      const folMat = i % 2 === 0 ? foliageMatA : foliageMatB;
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.3 * hScale, 10, 10), folMat);
      foliage.position.y = 2.4 * hScale;
      foliage.scale.set(1.0, 1.25, 1.0);
      treeGroup.add(trunk, foliage);

      // Strictly far background side
      const farX = -5.5 - (i % 3) * 1.4;
      const zPos = (i - 7) * 9.5;
      treeGroup.position.set(farX, 0, zPos);
      backgroundScenery.push(treeGroup);
      envGroup.add(treeGroup);
    }
    stateRef.current.backgroundScenery = backgroundScenery;

    // 6. REALISTIC SMALL DELIVERY TRUCK
    const vehicleGroup = new THREE.Group();
    scene.add(vehicleGroup);

    const chassisGroup = new THREE.Group();
    vehicleGroup.add(chassisGroup);
    stateRef.current.chassisGroup = chassisGroup;

    // Materials
    const cabPaintMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.22, metalness: 0.08 });
    const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.65 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.85, roughness: 0.2 });
    const windshieldGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x94A3B8, transparent: true, opacity: 0.45, roughness: 0.08 });

    // Cab
    const cabW = 2.3;
    const cabH = 2.1;
    const cabL = 2.0;
    const cabMesh = new THREE.Mesh(new THREE.BoxGeometry(cabW, cabH, cabL), cabPaintMat);
    cabMesh.position.set(0, 1.45, 1.6);
    cabMesh.castShadow = true;
    chassisGroup.add(cabMesh);

    // Hood
    const hoodMesh = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.98, 0.95, 1.2), cabPaintMat);
    hoodMesh.position.set(0, 1.0, 2.9);
    hoodMesh.castShadow = true;
    chassisGroup.add(hoodMesh);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(cabW * 0.92, 1.05), windshieldGlassMat);
    windshield.position.set(0, 1.95, 2.45);
    windshield.rotation.x = -0.42;
    chassisGroup.add(windshield);

    // Grille & Headlights
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.1), darkTrimMat);
    grille.position.set(0, 0.95, 3.52);
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, emissive: 0xFEF08A, emissiveIntensity: 0.9 });
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.08), hlMat);
    hlL.position.set(-0.85, 1.05, 3.52);
    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.08), hlMat);
    hlR.position.set(0.85, 1.05, 3.52);
    chassisGroup.add(grille, hlL, hlR);

    // Roof fairing
    const fairing = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.95, 0.55, 1.1), cabPaintMat);
    fairing.position.set(0, 2.45, 1.3);
    fairing.rotation.x = 0.22;
    chassisGroup.add(fairing);

    // Cargo Box
    const cargoW = 2.45;
    const cargoH = 2.4;
    const cargoL = 3.6;
    const cargoCenterZ = -1.2;
    const cargoBoxMat = new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.35, metalness: 0.05 });

    // --- TEXTURED CARGO FLOOR SURFACE & GROUNDING ---
    const floorY = 0.65;
    const cargoFloorTex = createCargoFloorTexture();
    const cargoFloorMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      map: cargoFloorTex,
      bumpMap: cargoFloorTex,
      bumpScale: 0.035,
      roughness: 0.58,
      metalness: 0.38,
    });
    const cargoFloor = new THREE.Mesh(new THREE.BoxGeometry(cargoW * 0.94, 0.08, cargoL * 0.96), cargoFloorMat);
    cargoFloor.position.set(0, floorY, cargoCenterZ);
    cargoFloor.receiveShadow = true;
    chassisGroup.add(cargoFloor);

    // Aluminum Anti-Slip Floor Runner Ribs
    const runnerGeo = new THREE.BoxGeometry(0.042, 0.014, cargoL * 0.94);
    const runnerMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.85, roughness: 0.22 });
    const runnerXOffsets = [-0.88, -0.52, -0.18, 0.18, 0.52, 0.88];
    runnerXOffsets.forEach((rx) => {
      const runner = new THREE.Mesh(runnerGeo, runnerMat);
      runner.position.set(rx, floorY + 0.047, cargoCenterZ);
      runner.receiveShadow = true;
      chassisGroup.add(runner);
    });

    // Floor Logistics Tie-Down Anchor Tracks (Zinc-plated E-Tracks)
    const etrackMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.38 });
    const etrackL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, cargoL * 0.92), etrackMat);
    etrackL.position.set(-cargoW * 0.42, floorY + 0.048, cargoCenterZ);
    const etrackR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, cargoL * 0.92), etrackMat);
    etrackR.position.set(cargoW * 0.42, floorY + 0.048, cargoCenterZ);
    chassisGroup.add(etrackL, etrackR);

    // Grounding Ambient Occlusion Contact Shadow underneath the package
    const contactShadowTex = createContactShadowTexture();
    const contactShadowGeo = new THREE.PlaneGeometry(1.85, 1.85);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
    });
    const contactShadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.set(0, floorY + 0.041, cargoCenterZ);
    chassisGroup.add(contactShadowMesh);

    // --- TEXTURED INTERIOR WALLS & BULKHEAD ---
    const cargoCeiling = new THREE.Mesh(new THREE.BoxGeometry(cargoW, 0.08, cargoL), cargoBoxMat);
    cargoCeiling.position.set(0, floorY + cargoH, cargoCenterZ);

    const cargoWallTex = createCargoWallTexture();
    const cargoWallMat = new THREE.MeshStandardMaterial({
      color: 0xF3F2EA,
      map: cargoWallTex,
      roughness: 0.46,
      metalness: 0.06,
    });
    const bulkhead = new THREE.Mesh(new THREE.BoxGeometry(cargoW, cargoH, 0.08), cargoWallMat);
    bulkhead.position.set(0, floorY + cargoH / 2, cargoCenterZ + cargoL / 2);
    const leftCargoWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, cargoH, cargoL), cargoWallMat);
    leftCargoWall.position.set(-cargoW / 2, floorY + cargoH / 2, cargoCenterZ);
    chassisGroup.add(cargoCeiling, bulkhead, leftCargoWall);

    // Heavy-Duty Galvanized Scuff Kick-Plates along wall perimeters
    const scuffMat = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.78, roughness: 0.28 });
    const leftScuff = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.20, cargoL * 0.96), scuffMat);
    leftScuff.position.set(-cargoW / 2 + 0.042, floorY + 0.10, cargoCenterZ);
    const frontScuff = new THREE.Mesh(new THREE.BoxGeometry(cargoW * 0.94, 0.20, 0.015), scuffMat);
    frontScuff.position.set(0, floorY + 0.10, cargoCenterZ + cargoL / 2 - 0.042);
    chassisGroup.add(leftScuff, frontScuff);

    // Wall Logistics Tie-Down Rub-Rail along left interior wall
    const wallRubRail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.10, cargoL * 0.92), etrackMat);
    wallRubRail.position.set(-cargoW / 2 + 0.045, floorY + 1.15, cargoCenterZ);
    chassisGroup.add(wallRubRail);

    // Rear Doors
    const rearDoorGeo = new THREE.BoxGeometry(cargoW * 0.48, cargoH * 0.96, 0.08);
    const rearDoorL = new THREE.Mesh(rearDoorGeo, cargoBoxMat);
    rearDoorL.position.set(-cargoW * 0.24, floorY + cargoH / 2, cargoCenterZ - cargoL / 2);
    const rearDoorR = new THREE.Mesh(rearDoorGeo, cargoBoxMat);
    rearDoorR.position.set(cargoW * 0.24, floorY + cargoH / 2, cargoCenterZ - cargoL / 2);
    chassisGroup.add(rearDoorL, rearDoorR);

    // Cutaway side panel
    const cutawayPanelMat = new THREE.MeshPhysicalMaterial({
      color: 0xF5F3EC,
      roughness: 0.25,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    const cargoCutawayWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, cargoH * 0.88, cargoL * 0.92), cutawayPanelMat);
    cargoCutawayWall.position.set(cargoW / 2, floorY + cargoH / 2, cargoCenterZ);
    chassisGroup.add(cargoCutawayWall);
    stateRef.current.cargoCutawayWall = cargoCutawayWall;

    // --- SOFT AMBIENT LIGHTING & CARGO ILLUMINATION ---
    // Linear Ceiling LED Luminaire Bar
    const ledHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.025, cargoL * 0.65),
      new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 })
    );
    ledHousing.position.set(0, floorY + cargoH - 0.02, cargoCenterZ);
    const ledDiffuser = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.015, cargoL * 0.62),
      new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFBEB,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      })
    );
    ledDiffuser.position.set(0, floorY + cargoH - 0.035, cargoCenterZ);
    chassisGroup.add(ledHousing, ledDiffuser);

    // Overhead Interior Dome Spotlight
    const cargoDomeLight = new THREE.PointLight(0xFFFAF0, 2.2, 5.0);
    cargoDomeLight.position.set(0, floorY + cargoH - 0.12, cargoCenterZ);
    cargoDomeLight.castShadow = true;
    cargoDomeLight.shadow.bias = -0.0003;
    chassisGroup.add(cargoDomeLight);
    stateRef.current.cargoDomeLight = cargoDomeLight;

    // Soft warm interior ambient fill light (diffuses dark corners and renders textures warmly)
    const cargoInteriorFill = new THREE.PointLight(0xFEF3C7, 1.4, 4.2);
    cargoInteriorFill.position.set(0.1, floorY + 1.25, cargoCenterZ);
    chassisGroup.add(cargoInteriorFill);

    // Subtle upward floor bounce light (illuminates package base, runner ribs, and chocks)
    const cargoFloorBounce = new THREE.DirectionalLight(0xE2E8F0, 0.45);
    cargoFloorBounce.position.set(0.5, floorY - 0.5, cargoCenterZ);
    cargoFloorBounce.target.position.set(0, floorY + 0.6, cargoCenterZ);
    chassisGroup.add(cargoFloorBounce, cargoFloorBounce.target);

    // Wheels & Steering
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1C1917, roughness: 0.88 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8, roughness: 0.2 });
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.36, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const createWheel = () => {
      const w = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      w.add(tire, rim);
      return w;
    };

    const frontL = new THREE.Group();
    frontL.position.set(-1.25, 0.48, 2.0);
    frontL.add(createWheel());
    const frontR = new THREE.Group();
    frontR.position.set(1.25, 0.48, 2.0);
    frontR.add(createWheel());
    const rearL = new THREE.Group();
    rearL.position.set(-1.25, 0.48, -1.8);
    rearL.add(createWheel());
    const rearR = new THREE.Group();
    rearR.position.set(1.25, 0.48, -1.8);
    rearR.add(createWheel());

    vehicleGroup.add(frontL, frontR, rearL, rearR);
    stateRef.current.frontL = frontL;
    stateRef.current.frontR = frontR;

    // 7. TRANSLUCENT FOOD-AWARE PACKAGING MODEL (SNUG FIT & OPEN FRONT CUTAWAY)
    const packageGroup = new THREE.Group();
    // Snug physical proportions tuned directly to food payload (eliminating excessive void)
    const packBoxW = 0.88;
    const packBoxH = 0.80;
    const packBoxD = 0.88;
    const wallT = 0.035; // Volumetric physical corrugated wall thickness
    const bottomCushionH = 0.09; // Base shock absorption pad height
    const cushionSurfaceY = wallT + bottomCushionH; // y = 0.125

    packageGroup.position.set(0.0, floorY + 0.04, cargoCenterZ);
    chassisGroup.add(packageGroup);
    stateRef.current.packageGroup = packageGroup;

    // --- 1. TRANSLUCENT OUTER CORRUGATED BOX (WITH OPEN FRONT CUTAWAY & WIREFRAME EDGES) ---
    // Identical frosted translucent ghost material as seen in Food Select inspection
    const cartonMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0xD7C4A8 : 0xCBB394,
      transparent: true,
      opacity: 0.36,
      roughness: 0.28,
      metalness: 0.05,
      depthWrite: false, // Ensures internal food & cushioning are completely visible
      side: THREE.DoubleSide,
    });

    const addBoxWireframeEdges = (mesh: THREE.Mesh) => {
      try {
        const edgeGeo = new THREE.EdgesGeometry(mesh.geometry, 20);
        const edgeMat = new THREE.LineBasicMaterial({
          color: 0x332F2B, // Crisp dark stone structural outline
          transparent: true,
          opacity: 0.70,
          depthWrite: false,
        });
        const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
        edgeLines.renderOrder = 3;
        mesh.add(edgeLines);
      } catch {
        // Safe fallback
      }
    };

    const outerCartonGroup = new THREE.Group();
    packageGroup.add(outerCartonGroup);

    // Physical Base Floor Panel (Volumetric solid with thickness wallT)
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(packBoxW, wallT, packBoxD), cartonMat);
    baseMesh.position.y = wallT / 2;
    baseMesh.renderOrder = 2;
    baseMesh.receiveShadow = true;
    addBoxWireframeEdges(baseMesh);
    outerCartonGroup.add(baseMesh);

    // Bottom center kraft sealing tape
    const tapeMat = new THREE.MeshStandardMaterial({
      color: 0x926129,
      roughness: 0.55,
      metalness: 0.05,
    });
    const baseTape = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.28, wallT * 1.04, packBoxD * 1.002), tapeMat);
    baseTape.position.y = wallT / 2;
    outerCartonGroup.add(baseTape);

    // Left Wall (-X side) — Translucent with structural wireframe
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, packBoxH - wallT, packBoxD), cartonMat);
    leftWall.position.set(-packBoxW / 2 + wallT / 2, packBoxH / 2, 0);
    leftWall.renderOrder = 2;
    addBoxWireframeEdges(leftWall);
    outerCartonGroup.add(leftWall);

    // Back Wall (-Z side) — Translucent with structural wireframe
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(packBoxW - wallT * 2, packBoxH - wallT, wallT), cartonMat);
    backWall.position.set(0, packBoxH / 2, -packBoxD / 2 + wallT / 2);
    backWall.renderOrder = 2;
    addBoxWireframeEdges(backWall);
    outerCartonGroup.add(backWall);

    // Front Wall (+Z side) — Translucent with structural wireframe
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(packBoxW - wallT * 2, packBoxH - wallT, wallT), cartonMat);
    frontWall.position.set(0, packBoxH / 2, packBoxD / 2 - wallT / 2);
    frontWall.renderOrder = 2;
    addBoxWireframeEdges(frontWall);
    outerCartonGroup.add(frontWall);

    // Right Wall (+X side, facing viewer cutaway):
    // Open inspection window with a low protective threshold rim
    const cutawayH = 0.18;
    const rightWallLower = new THREE.Mesh(new THREE.BoxGeometry(wallT, cutawayH - wallT, packBoxD), cartonMat);
    rightWallLower.position.set(packBoxW / 2 - wallT / 2, cutawayH / 2, 0);
    rightWallLower.renderOrder = 2;
    addBoxWireframeEdges(rightWallLower);
    outerCartonGroup.add(rightWallLower);

    // Corrugated core fluting edge (showing realistic 3-ply corrugated thickness along cut rim)
    const fluteEdgeMat = new THREE.MeshStandardMaterial({ color: 0xA3835B, roughness: 0.9 });
    const fluteEdge = new THREE.Mesh(new THREE.BoxGeometry(wallT, 0.015, packBoxD * 0.98), fluteEdgeMat);
    fluteEdge.position.set(packBoxW / 2 - wallT / 2, cutawayH, 0);
    outerCartonGroup.add(fluteEdge);

    // --- TOP MAJOR FLAPS & INTERIOR DUST FLAPS ---
    const dustFlapMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0xD0BEA3 : 0xBEA07D,
      transparent: true,
      opacity: 0.40,
      depthWrite: false,
      roughness: 0.85,
    });
    // Rear Interior Dust Flap
    const rearDustFlap = new THREE.Mesh(
      new THREE.BoxGeometry(packBoxW - wallT * 2 - 0.02, wallT * 0.8, packBoxD * 0.28),
      dustFlapMat
    );
    rearDustFlap.position.set(0, packBoxH - wallT * 1.4, -packBoxD / 2 + (packBoxD * 0.28) / 2 + wallT);
    rearDustFlap.renderOrder = 2;

    // Front Interior Dust Flap
    const frontDustFlap = new THREE.Mesh(
      new THREE.BoxGeometry(packBoxW - wallT * 2 - 0.02, wallT * 0.8, packBoxD * 0.28),
      dustFlapMat
    );
    frontDustFlap.position.set(0, packBoxH - wallT * 1.4, packBoxD / 2 - (packBoxD * 0.28) / 2 - wallT);
    frontDustFlap.renderOrder = 2;
    outerCartonGroup.add(rearDustFlap, frontDustFlap);

    // 4 vertical corner folds
    const foldCreaseMat = new THREE.MeshStandardMaterial({ color: 0x9C7F5B, roughness: 0.9 });
    const cornerOffsets = [
      [-packBoxW / 2 + wallT, -packBoxD / 2 + wallT],
      [packBoxW / 2 - wallT, -packBoxD / 2 + wallT],
      [-packBoxW / 2 + wallT, packBoxD / 2 - wallT],
      [packBoxW / 2 - wallT, packBoxD / 2 - wallT],
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const crease = new THREE.Mesh(new THREE.BoxGeometry(0.010, packBoxH - wallT * 2, 0.010), foldCreaseMat);
      crease.position.set(cx, packBoxH / 2, cz);
      outerCartonGroup.add(crease);
    });

    // Top Major Flaps (partially open so interior is visible from elevated & front angles)
    const topFlapL = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.45, wallT, packBoxD), cartonMat);
    topFlapL.position.set(-packBoxW * 0.27, packBoxH - wallT / 2, 0);
    topFlapL.renderOrder = 2;
    addBoxWireframeEdges(topFlapL);

    const topFlapR = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.18, wallT, packBoxD), cartonMat);
    topFlapR.position.set(packBoxW * 0.14, packBoxH - wallT / 2, 0);
    topFlapR.renderOrder = 2;
    addBoxWireframeEdges(topFlapR);
    outerCartonGroup.add(topFlapL, topFlapR);

    // Top Center Seam Tape
    const topTape = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, packBoxD * 1.002), tapeMat);
    topTape.position.set(-packBoxW * 0.05, packBoxH + 0.004, 0);
    outerCartonGroup.add(topTape);

    // --- 2. CUSHIONING SUPPORT BASE & SIDE CAVITY LINERS ---
    const innerW = packBoxW - wallT * 2 - 0.015;
    const innerD = packBoxD - wallT * 2 - 0.015;
    const cushionGroup = new THREE.Group();
    packageGroup.add(cushionGroup);

    const cushionMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0x86EFAC : 0xE2E8F0,
      transparent: true,
      opacity: 0.72,
      roughness: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Bottom Shock Absorption Pad (Cushioning directly supporting food cradle)
    const bottomCushionMesh = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, bottomCushionH, innerD),
      cushionMat
    );
    bottomCushionMesh.position.set(0, wallT + bottomCushionH / 2, 0);
    bottomCushionMesh.renderOrder = 1;
    bottomCushionMesh.receiveShadow = true;
    cushionGroup.add(bottomCushionMesh);
    stateRef.current.cushionMesh = bottomCushionMesh;

    // Perimeter Side Cushioning Liners (snugly filling space around product)
    const cushionSideT = isV2 ? 0.09 : 0.07;
    const sideCushionH = packBoxH - cushionSurfaceY - 0.08;

    // Left cushion wall
    const cLeft = new THREE.Mesh(new THREE.BoxGeometry(cushionSideT, sideCushionH, innerD - cushionSideT * 2), cushionMat);
    cLeft.position.set(-innerW / 2 + cushionSideT / 2, cushionSurfaceY + sideCushionH / 2, 0);
    cLeft.renderOrder = 1;

    // Back cushion wall
    const cBack = new THREE.Mesh(new THREE.BoxGeometry(innerW, sideCushionH, cushionSideT), cushionMat);
    cBack.position.set(0, cushionSurfaceY + sideCushionH / 2, -innerD / 2 + cushionSideT / 2);
    cBack.renderOrder = 1;

    // Front cushion wall
    const cFront = new THREE.Mesh(new THREE.BoxGeometry(innerW, sideCushionH, cushionSideT), cushionMat);
    cFront.position.set(0, cushionSurfaceY + sideCushionH / 2, innerD / 2 - cushionSideT / 2);
    cFront.renderOrder = 1;

    // Right cushion wall (lower cutaway profile matching inspection face)
    const cRightH = Math.max(0.06, cutawayH - cushionSurfaceY);
    const cRight = new THREE.Mesh(new THREE.BoxGeometry(cushionSideT, cRightH, innerD - cushionSideT * 2), cushionMat);
    cRight.position.set(innerW / 2 - cushionSideT / 2, cushionSurfaceY + cRightH / 2, 0);
    cRight.renderOrder = 1;

    cushionGroup.add(cLeft, cBack, cFront, cRight);

    // V2 High-Protection Engineered Dampers & Corner Pylons
    if (isV2) {
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4, metalness: 0.1 });
      const pylonGeo = new THREE.CylinderGeometry(0.045, 0.045, sideCushionH * 0.9, 12);
      const corners = [
        [-innerW / 2 + cushionSideT, -innerD / 2 + cushionSideT],
        [innerW / 2 - cushionSideT, -innerD / 2 + cushionSideT],
        [-innerW / 2 + cushionSideT, innerD / 2 - cushionSideT],
        [innerW / 2 - cushionSideT, innerD / 2 - cushionSideT],
      ];
      corners.forEach(([cx, cz]) => {
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(cx, cushionSurfaceY + (sideCushionH * 0.9) / 2, cz);
        pylon.renderOrder = 1;
        cushionGroup.add(pylon);
      });
    }

    // --- 3. FOOD-SPECIFIC PROTECTIVE INSERT / CRADLE (MATCHES FOOD SELECTION) ---
    const insertGroup = new THREE.Group();
    insertGroup.position.set(0, cushionSurfaceY, 0);
    packageGroup.add(insertGroup);

    const insertMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0xBBF7D0 : 0xE5E7EB,
      roughness: 0.72,
    });

    const foodFit = getFoodCargoFit(foodId, cushionSurfaceY);
    const foodBaseY = cushionSurfaceY + 0.11;

    if (foodFit.insertType === 'cradle') {
      // Molded bottom tray bed
      const cradleBed = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.33, 0.04, 24), insertMat);
      cradleBed.scale.set(1.15, 1.0, 1.35);
      cradleBed.position.y = 0.025;
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
      // Cake circular protective collar + corner dampening blocks
      const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 32, 1, true), insertMat);
      collarMesh.position.y = 0.06;
      collarMesh.renderOrder = 1;
      insertGroup.add(collarMesh);

      const wedgeMat = new THREE.MeshStandardMaterial({ color: isV2 ? 0x86EFAC : 0xCBD5E1 });
      const wedgeOffsets = [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]];
      wedgeOffsets.forEach(([wx, wz]) => {
        const wedge = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.10), wedgeMat);
        wedge.position.set(wx, 0.05, wz);
        wedge.renderOrder = 1;
        insertGroup.add(wedge);
      });
    } else if (foodFit.insertType === 'bottle-bracket') {
      // Bottle dual-tier vertical stabilizer: base cup + neck collar bracket
      const baseCup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.08, 24), insertMat);
      baseCup.position.y = 0.04;
      baseCup.renderOrder = 1;
      insertGroup.add(baseCup);

      const neckBracket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.55), insertMat);
      neckBracket.position.y = 0.40;
      neckBracket.renderOrder = 1;
      const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 10, 24), insertMat);
      collarRing.rotation.x = Math.PI / 2;
      collarRing.position.y = 0.40;
      collarRing.renderOrder = 1;
      insertGroup.add(neckBracket, collarRing);
    } else if (foodFit.insertType === 'tomato-nest') {
      // Tomato 4-lobe molded pulp cradle
      const nest = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.045, 12, 24), insertMat);
      nest.rotation.x = Math.PI / 2;
      nest.position.y = 0.035;
      const nestBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.03, 24), insertMat);
      nestBase.position.y = 0.015;
      insertGroup.add(nest, nestBase);
    } else if (foodFit.insertType === 'cell') {
      // Apple deep molded pulp cell
      const cellCup = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        insertMat
      );
      cellCup.position.y = 0.04;
      insertGroup.add(cellCup);
    } else if (foodFit.insertType === 'partition') {
      // Partition / pouch tray (for dal, atta, rice, biscuits, chips)
      const partTray = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.10, 0.56), insertMat);
      partTray.position.y = 0.05;
      partTray.renderOrder = 1;
      insertGroup.add(partTray);
    }

    // --- 4. SOLID FOOD MODEL (SNUG WITHIN CAVITY, NO EXCESSIVE VOID) ---
    const foodMeshGroup = new THREE.Group();
    const foodMesh = createFoodMesh(foodId);
    // Scale food to fill ~75-80% of container cavity, eliminating cavernous empty space
    const cargoScale = foodFit.scale * 1.55;
    foodMesh.scale.set(cargoScale, cargoScale, cargoScale);

    // Natural resting angle for delicate organic items
    if (foodId === 'mango') {
      foodMesh.rotation.z = 0.12;
      foodMesh.rotation.x = 0.08;
    }

    // Ensure food meshes are 100% solid, opaque, and rendered with full depth
    foodMeshGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.renderOrder = 0; // Opaque food renders first
        if (child.material) {
          (child.material as THREE.Material).depthWrite = true;
        }
      }
    });

    foodMeshGroup.add(foodMesh);
    foodMeshGroup.position.set(0, foodBaseY, 0);
    packageGroup.add(foodMeshGroup);
    stateRef.current.foodMeshGroup = foodMeshGroup;

    // Floor Chocks holding the outer box securely on cargo floor
    const chockMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
    const chockFront = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.9, 0.08, 0.10), chockMat);
    chockFront.position.set(0, 0.04, packBoxD / 2 + 0.05);
    const chockRear = new THREE.Mesh(new THREE.BoxGeometry(packBoxW * 0.9, 0.08, 0.10), chockMat);
    chockRear.position.set(0, 0.04, -packBoxD / 2 - 0.05);
    packageGroup.add(chockFront, chockRear);

    // Stress ring around package base
    const ringGeo = new THREE.TorusGeometry(0.52, 0.022, 8, 28);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, transparent: true, opacity: 0 });
    const stressRing = new THREE.Mesh(ringGeo, ringMat);
    stressRing.position.y = 0.08;
    packageGroup.add(stressRing);
    stateRef.current.stressRing = stressRing;

    // 8. ANIMATION LOOP WITH SECOND-ORDER SPRING-DAMPER INERTIAL COUPLING
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.04);
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      // Cutaway Panel Animation
      s.cutawayT += (s.targetCutawayT - s.cutawayT) * 0.08;
      if (cargoCutawayWall) {
        cargoCutawayWall.position.y = (floorY + cargoH / 2) + s.cutawayT * 1.8;
        (cargoCutawayWall.material as THREE.MeshPhysicalMaterial).opacity = (1 - s.cutawayT) * 0.92;
        cargoCutawayWall.visible = s.cutawayT < 0.98;
      }
      if (cargoDomeLight) {
        cargoDomeLight.intensity = 1.2 + s.cutawayT * 1.8;
      }

      if (s.isPlaying) {
        // --- DRIVING MANEUVER DYNAMICS (BRAKING, ACCELERATION, TURNING) ---
        let targetLongAccel = 0;
        let targetLatAccel = 0;
        let targetSteer = 0;

        if (s.maneuver !== 'none') {
          s.maneuverTime += delta;
          const progress = s.maneuverTime / s.maneuverDuration;

          if (s.maneuver === 'brake') {
            // Hard braking cycle: rapid speed drop from 65 to 35 km/h, negative accel
            const brakeProfile = Math.sin(progress * Math.PI);
            targetLongAccel = -4.5 * brakeProfile; // -4.5 m/s² deceleration
            s.targetSpeed = s.baseSpeed * (1 - brakeProfile * 0.55);
            setBumpStepText('Hard Braking: Inertial Forward Surge');
          } else if (s.maneuver === 'accel') {
            // Rapid acceleration sprint: speed jumps from 65 to 88 km/h, positive accel
            const accelProfile = Math.sin(progress * Math.PI);
            targetLongAccel = 3.8 * accelProfile; // +3.8 m/s² forward thrust
            s.targetSpeed = s.baseSpeed * (1 + accelProfile * 0.4);
            setBumpStepText('Rapid Acceleration: Backward Inertial Squat');
          } else if (s.maneuver === 'turnLeft') {
            // Lane change / turn left: steering angle turns left, centrifugal lateral accel to right
            const turnProfile = Math.sin(progress * Math.PI);
            targetSteer = 0.28 * turnProfile;
            targetLatAccel = 3.6 * turnProfile; // lateral push
            setBumpStepText('Sharp Left Turn: Centrifugal Lateral Shift');
          } else if (s.maneuver === 'turnRight') {
            // Turn right: steering angle turns right, centrifugal lateral accel to left
            const turnProfile = Math.sin(progress * Math.PI);
            targetSteer = -0.28 * turnProfile;
            targetLatAccel = -3.6 * turnProfile;
            setBumpStepText('Sharp Right Turn: Centrifugal Lateral Shift');
          }

          if (s.maneuverTime >= s.maneuverDuration) {
            s.maneuver = 'none';
            s.targetSpeed = s.baseSpeed;
            targetSteer = 0;
            setBumpStepText('');
          }
        } else {
          // Standard cruising micro-dynamics: gentle highway sway & throttle breathing
          const cruiseBreathe = Math.sin(time * 0.8) * 0.05;
          targetLongAccel = Math.cos(time * 0.8) * 0.4;
          targetLatAccel = Math.sin(time * 0.5) * 0.5;
          targetSteer = Math.sin(time * 0.5) * 0.03;
          s.targetSpeed = s.baseSpeed + cruiseBreathe;
        }

        // Smooth acceleration and steering interpolation
        s.longitudinalAccel += (targetLongAccel - s.longitudinalAccel) * 0.2;
        s.lateralAccel += (targetLatAccel - s.lateralAccel) * 0.2;
        s.steerAngle += (targetSteer - s.steerAngle) * 0.15;
        s.currentSpeed += (s.targetSpeed - s.currentSpeed) * 0.1;

        // Update live speed display
        s.speedKmh = Math.round(s.currentSpeed * 76);
        setSpeedKmh(s.speedKmh);

        // Steer front wheels
        if (frontL && frontR) {
          frontL.rotation.y = s.steerAngle;
          frontR.rotation.y = s.steerAngle;
        }

        // Scroll Road Stripes and Scenery based on live speed
        const scrollSpeed = s.currentSpeed * 0.9;
        stripes.forEach((stripe) => {
          stripe.position.z -= scrollSpeed;
          if (stripe.position.z < -45) stripe.position.z += 90;
        });

        backgroundScenery.forEach((obj) => {
          obj.position.z -= scrollSpeed;
          if (obj.position.z < -60) obj.position.z += 120;
        });

        if (speedBumpMesh && potholeMesh) {
          speedBumpMesh.position.z -= scrollSpeed;
          potholeMesh.position.z -= scrollSpeed;
          if (speedBumpMesh.position.z < -30) speedBumpMesh.position.z += 70;
          if (potholeMesh.position.z < -30) potholeMesh.position.z += 70;
        }

        // Rotate Wheel Meshes
        s.wheelRot -= s.currentSpeed * 0.32;
        [frontL, frontR, rearL, rearR].forEach((w) => {
          if (w) {
            w.children.forEach((child) => {
              child.children.forEach((mesh) => {
                mesh.rotation.x = s.wheelRot;
              });
            });
          }
        });

        // --- ROAD IRREGULARITY BUMP SEQUENCE PHYSICS ---
        let roadImpulseFront = 0;
        let roadImpulseRear = 0;

        if (s.bumpActive) {
          s.bumpSequenceTime += delta;
          const seq = s.bumpSequenceTime;
          const ampScale = s.bumpIntensity === 'high' ? 1.0 : s.bumpIntensity === 'medium' ? 0.6 : 0.3;

          if (seq > 0.2 && seq < 0.7) {
            const t1 = (seq - 0.2) / 0.5;
            setBumpStepText('Encountering Road Irregularity (Low)');
            roadImpulseFront = Math.sin(t1 * Math.PI) * 0.08 * ampScale;
            if (t1 > 0.2) roadImpulseRear = Math.sin((t1 - 0.2) * Math.PI * 1.25) * 0.08 * ampScale;
          } else if (seq > 0.9 && seq < 1.9) {
            const t2 = (seq - 0.9) / 1.0;
            setBumpStepText('Pothole Impact: 5.8G Deceleration Shock');
            roadImpulseFront = -Math.sin(t2 * Math.PI) * 0.22 * ampScale;
            if (t2 > 0.15) roadImpulseRear = -Math.sin((t2 - 0.15) * Math.PI) * 0.2 * ampScale;
          } else if (seq > 2.1 && seq < 3.1) {
            const t3 = (seq - 2.1) / 1.0;
            setBumpStepText('Speed Hump: Suspension Compression & Rebound');
            roadImpulseFront = Math.sin(t3 * Math.PI) * 0.18 * ampScale;
            if (t3 > 0.16) roadImpulseRear = Math.sin((t3 - 0.16) * Math.PI) * 0.18 * ampScale;
          }

          if (s.bumpSequenceTime >= s.bumpSequenceDuration) {
            s.bumpActive = false;
            setBumpActive(false);
            setShockG(0.35);
            setBumpStepText('');
          }
        }

        // Suspension physics
        s.suspensionFront += (roadImpulseFront - s.suspensionFront) * 0.35;
        s.suspensionRear += (roadImpulseRear - s.suspensionRear) * 0.35;

        // Truck body pitch, roll, and yaw (reacts to acceleration, steering, and road bumps!)
        const cruiseVibe = Math.sin(time * 22) * 0.005;
        const accelPitch = s.longitudinalAccel * -0.015; // nose dives on brake (-), squats on accel (+)
        const turnRoll = s.lateralAccel * 0.025;         // body rolls outward in turns
        const turnYaw = s.steerAngle * 0.4;             // truck heading

        s.chassisPitch = (s.suspensionFront - s.suspensionRear) * 0.28 + accelPitch;
        s.chassisRoll = turnRoll + Math.sin(time * 3) * 0.003;
        s.chassisYaw = turnYaw;
        s.chassisY = (s.suspensionFront + s.suspensionRear) * 0.5 + cruiseVibe;

        if (chassisGroup) {
          chassisGroup.position.y = s.chassisY;
          chassisGroup.position.x = s.steerAngle * -0.3; // subtle lane drift
          chassisGroup.rotation.x = s.chassisPitch;
          chassisGroup.rotation.y = s.chassisYaw;
          chassisGroup.rotation.z = s.chassisRoll;
        }

        // --- REALISTIC SECOND-ORDER SPRING-DAMPER PACKAGE PHYSICS ---
        // Tuned mechanical parameters:
        // V2 has high-damping tuned bio-cellular suspension; V1 is under-damped and rattles
        const pkgK = s.isV2 ? 45.0 : 20.0;    // spring stiffness
        const pkgC = s.isV2 ? 14.0 : 5.5;     // damping coefficient
        const mass = 1.0;

        // 1. Longitudinal Axis (Z) Inertia (Acceleration / Braking)
        // Truck acceleration produces inertial force F_z = -mass * accel
        const targetInertiaZ = -s.longitudinalAccel * 0.045; // forward shift on braking, back on accel
        const dispZ = targetInertiaZ - s.packagePosZ;
        const forceZ = dispZ * pkgK - s.packageVelZ * pkgC;
        s.packageVelZ += (forceZ / mass) * delta;
        s.packagePosZ += s.packageVelZ * delta;
        // Restrain by cargo floor chocks
        s.packagePosZ = Math.max(-0.16, Math.min(0.16, s.packagePosZ));

        // 2. Lateral Axis (X) Inertia (Turning & Centrifugal shifts)
        // Truck turn produces centrifugal inertial force F_x = mass * a_lateral
        const targetInertiaX = s.lateralAccel * 0.04;
        const dispX = targetInertiaX - s.packagePosX;
        const forceX = dispX * pkgK - s.packageVelX * pkgC;
        s.packageVelX += (forceX / mass) * delta;
        s.packagePosX += s.packageVelX * delta;
        s.packagePosX = Math.max(-0.18, Math.min(0.18, s.packagePosX));

        // 3. Vertical Axis (Y) Dynamics (Bumps & road vibration)
        const bumpImpulseY = (roadImpulseFront + roadImpulseRear) * 0.5;
        const targetDispY = 0;
        const forceY = (targetDispY - s.packagePosY) * pkgK - s.packageVelY * pkgC;
        s.packageVelY += (forceY / mass) * delta;

        // Kinetic upward kick from road bumps
        if (Math.abs(bumpImpulseY) > 0.02) {
          const kickMultiplier = s.isV2 ? 0.35 : 1.35;
          s.packageVelY += bumpImpulseY * 16 * kickMultiplier * delta;
        }
        s.packagePosY += s.packageVelY * delta;
        s.packagePosY = Math.max(0, s.packagePosY); // Cannot penetrate floor

        // Angular tilt derived from spring-damper positions and body roll
        s.packageRotX = s.packagePosZ * 0.5 + s.chassisPitch * 0.3;
        s.packageRotZ = -s.packagePosX * 0.6 - s.chassisRoll * 0.8;
        s.packageRotY = s.chassisYaw * 0.2;

        // Apply to 3D Package resting on floor
        if (packageGroup) {
          packageGroup.position.x = s.packagePosX;
          packageGroup.position.y = (floorY + 0.05) + s.packagePosY * 0.4;
          packageGroup.position.z = cargoCenterZ + s.packagePosZ;
          packageGroup.rotation.x = s.packageRotX;
          packageGroup.rotation.y = s.packageRotY;
          packageGroup.rotation.z = s.packageRotZ;
        }

        // --- INTERNAL FOOD PAYLOAD & CUSHIONING COMPLIANCE ---
        // Food shifts within cushioning in response to package inertial forces
        const foodK = s.isV2 ? 55.0 : 22.0;
        const foodC = s.isV2 ? 16.0 : 4.0;

        // Food reacts to relative package acceleration
        const foodForceX = (-s.packagePosX * 0.6 - s.foodDispX) * foodK - s.foodVelX * foodC;
        const foodForceY = (s.packagePosY * 0.4 - s.foodDispY) * foodK - s.foodVelY * foodC;
        const foodForceZ = (-s.packagePosZ * 0.6 - s.foodDispZ) * foodK - s.foodVelZ * foodC;

        s.foodVelX += foodForceX * delta;
        s.foodVelY += foodForceY * delta;
        s.foodVelZ += foodForceZ * delta;

        s.foodDispX += s.foodVelX * delta;
        s.foodDispY += s.foodVelY * delta;
        s.foodDispZ += s.foodVelZ * delta;

        // --- VISCOELASTIC SPRING-BASED CUSHIONING COMPRESSION DEFORMER ---
        // Dynamically couples road bump impact shock, chassis vibration, and payload downward momentum
        const cushionK = s.isV2 ? 150.0 : 48.0; // Stiffness: V2 is engineered high-resilience bio-foam, V1 is softer baseline foam
        const cushionC = s.isV2 ? 25.0 : 6.2;   // Damping: V2 is critically damped (absorbs shock rapidly), V1 is under-damped (exhibits ringing)

        // Dynamic shock load pushing down into the cushioning material:
        // 1. Road bump vertical impact shock (from potholes, humps, and suspension rebound kicks)
        const verticalShockImpulse = Math.max(0, -roadImpulseFront * 2.2, roadImpulseRear * 1.8);
        // 2. Downward inertial force from food payload mass
        const payloadInertialPush = Math.max(0, -s.foodDispY * 3.2);
        // 3. Chassis vertical jerk coupling
        const chassisJerk = Math.max(0, -s.suspensionFront * 0.8, -s.suspensionRear * 0.8);

        // Target instantaneous compression under dynamic transit load
        const targetCompression = (
          verticalShockImpulse * (s.isV2 ? 0.15 : 0.34) +
          payloadInertialPush * (s.isV2 ? 0.08 : 0.22) +
          chassisJerk * (s.isV2 ? 0.05 : 0.14)
        );

        // Spring-damper differential equation: F = k*(x_target - x) - c*v
        const springForce = (targetCompression - s.cushionCompression) * cushionK - s.cushionVelocity * cushionC;
        s.cushionVelocity += springForce * delta;
        s.cushionCompression += s.cushionVelocity * delta;

        // Physical compression bounds (0% up to max 35% on V1, 16% on V2)
        s.cushionCompression = Math.max(0, Math.min(s.isV2 ? 0.16 : 0.35, s.cushionCompression));
        const comp = s.cushionCompression;

        // 1. Physical bottom cushion pad deformation:
        // Firmly seated on rigid base floor (y = wallT), compressing downward from top surface
        if (bottomCushionMesh) {
          const compressedPadH = bottomCushionH * (1.0 - comp);
          bottomCushionMesh.scale.y = 1.0 - comp;
          bottomCushionMesh.position.y = wallT + compressedPadH / 2;
          // Volumetric Poisson lateral bulge (foam expands outward horizontally when compressed vertically)
          bottomCushionMesh.scale.x = 1.0 + comp * 0.22;
          bottomCushionMesh.scale.z = 1.0 + comp * 0.22;

          // Clear visual feedback of dampening & strain absorption
          if (comp > 0.03) {
            if (s.isV2) {
              // V2: Crisp emerald kinetic energy absorption dissipation sheen
              (cushionMat as THREE.MeshStandardMaterial).emissive.setHex(0x10B981);
              (cushionMat as THREE.MeshStandardMaterial).emissiveIntensity = comp * 1.8;
            } else {
              // V1: Warning amber/red strain flush indicating high shock load & near bottom-out
              (cushionMat as THREE.MeshStandardMaterial).emissive.setHex(0xEF4444);
              (cushionMat as THREE.MeshStandardMaterial).emissiveIntensity = comp * 2.4;
            }
          } else {
            (cushionMat as THREE.MeshStandardMaterial).emissiveIntensity = 0;
          }
        }

        // 2. Physical protective insert deformation (sits directly on compressing cushion bed)
        if (insertGroup) {
          insertGroup.position.y = wallT + bottomCushionH * (1.0 - comp);
          // Insert material also flexes elastically
          insertGroup.scale.y = 1.0 - comp * 0.35;
          insertGroup.scale.x = 1.0 + comp * 0.12;
          insertGroup.scale.z = 1.0 + comp * 0.12;

          if (comp > 0.03) {
            if (s.isV2) {
              (insertMat as THREE.MeshStandardMaterial).emissive.setHex(0x059669);
              (insertMat as THREE.MeshStandardMaterial).emissiveIntensity = comp * 1.2;
            } else {
              (insertMat as THREE.MeshStandardMaterial).emissive.setHex(0xDC2626);
              (insertMat as THREE.MeshStandardMaterial).emissiveIntensity = comp * 1.6;
            }
          } else {
            (insertMat as THREE.MeshStandardMaterial).emissiveIntensity = 0;
          }
        }

        // 3. Food payload moves synchronously with compressed cushioning bed
        if (foodMeshGroup) {
          foodMeshGroup.position.x = s.foodDispX * (s.isV2 ? 0.025 : 0.06);
          foodMeshGroup.position.y = (foodBaseY - bottomCushionH * comp) + s.foodDispY * (s.isV2 ? 0.015 : 0.035);
          foodMeshGroup.position.z = s.foodDispZ * (s.isV2 ? 0.025 : 0.06);
        }

        // 4. Lateral side cushion liners viscoelastic compliance
        if (cLeft && cRight && cFront && cBack) {
          const pushX = s.foodDispX;
          cLeft.scale.x = pushX < 0 ? Math.max(0.72, 1.0 + pushX * 0.35) : 1.0;
          cRight.scale.x = pushX > 0 ? Math.max(0.72, 1.0 - pushX * 0.35) : 1.0;
          const pushZ = s.foodDispZ;
          cFront.scale.z = pushZ > 0 ? Math.max(0.72, 1.0 - pushZ * 0.35) : 1.0;
          cBack.scale.z = pushZ < 0 ? Math.max(0.72, 1.0 + pushZ * 0.35) : 1.0;
        }

        // Stress Ring on Package (lights up under high inertial load or bump)
        if (stressRing) {
          const totalStress = Math.abs(s.packagePosX) * 4 + Math.abs(s.packagePosZ) * 4 + Math.abs(bumpImpulseY) * 5;
          const isStressed = totalStress > 0.25;
          const targetRingOpacity = isStressed ? (s.isV2 ? 0.3 : 0.85) : 0.0;
          (stressRing.material as THREE.MeshBasicMaterial).opacity +=
            (targetRingOpacity - (stressRing.material as THREE.MeshBasicMaterial).opacity) * 0.2;
          (stressRing.material as THREE.MeshBasicMaterial).color.setHex(s.isV2 ? 0x10B981 : 0xEF4444);
        }
      }

      // Camera Position Interpolation
      let targetCamPos = new THREE.Vector3(2.85, 1.85, 0.3);
      let targetLookAt = new THREE.Vector3(0.0, 1.25, -0.8);

      if (s.camMode === 'cargo') {
        // CLOSE-UP SIDE / REAR CARGO CUTAWAY VIEW - snug framing into open package cutaway
        targetCamPos.set(2.45, 1.48, -0.2);
        targetLookAt.set(0.0, 1.08, -1.15);
      } else if (s.camMode === 'front') {
        targetCamPos.set(1.8, 1.3, 5.8);
        targetLookAt.set(0.0, 1.2, 1.2);
      } else {
        // 3/4 Elevated Chase Cam
        targetCamPos.set(6.2 + Math.sin(time * 0.3) * 0.4, 3.4, 7.5);
        targetLookAt.set(0.0, 1.2, -0.5);
      }

      if (s.bumpActive) {
        targetCamPos.y += s.chassisY * 0.15;
      }

      camera.position.lerp(targetCamPos, 0.05);
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
  }, [foodId, spec, isV2]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden rounded-3xl bg-[#FAF9F5] border border-stone-200/90 shadow-lg ${className}`}>
      {/* 3D Scene Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-default" />

      {/* Top Floating Telemetry & Inspection Controls */}
      <div className="absolute top-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-stone-200/90 shadow-xs pointer-events-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-semibold text-stone-900 tracking-tight">
              {stageName || 'Real Road Transit Testing'}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs font-mono text-stone-600">
              {isPlaying ? `${speedKmh} km/h` : 'PAUSED'}
            </span>
          </div>

          {/* Accelerometer Peak Deceleration */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-mono shadow-xs transition-colors pointer-events-auto ${
            bumpActive || activeManeuver !== 'none'
              ? isV2
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-800'
                : 'bg-red-50/95 border-red-300 text-red-700 animate-pulse'
              : 'bg-white/90 border-stone-200 text-stone-600'
          }`}>
            <span className="text-[10px] uppercase font-sans text-stone-400">Peak Decel:</span>
            <span className="font-bold">{shockG.toFixed(1)}G</span>
            {isV2 ? (
              <span className="text-[10px] text-emerald-700 font-semibold">(V2 Damped)</span>
            ) : (
              <span className="text-[10px] text-red-600 font-semibold">(V1 Vulnerable)</span>
            )}
          </div>

          {/* Spring Dampening Feedback Badge */}
          <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-mono shadow-xs transition-colors pointer-events-auto ${
            bumpActive || activeManeuver !== 'none'
              ? isV2
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-800'
                : 'bg-amber-50/95 border-amber-300 text-amber-800'
              : 'bg-white/90 border-stone-200 text-stone-600'
          }`}>
            <span className="text-[10px] uppercase font-sans text-stone-400">Foam Spring Dampener:</span>
            <span className="font-bold">
              {bumpActive
                ? isV2
                  ? '94% Absorbed (14% Flex)'
                  : 'High Strain (32% Flex)'
                : isV2
                ? 'Active Bio-Cellular'
                : 'Standard Low-Density'}
            </span>
          </div>
        </div>

        {/* Camera Angle & Inspection Modes */}
        <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-xs pointer-events-auto self-start sm:self-auto">
          <button
            onClick={() => { setCamMode('cargo'); sound.click(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              camMode === 'cargo'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Cargo Cutaway</span>
          </button>
          <button
            onClick={() => { setCamMode('chase'); sound.click(); }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              camMode === 'chase' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Chase Cam
          </button>
          <button
            onClick={() => { setCamMode('front'); sound.click(); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              camMode === 'front' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Front Angle
          </button>
        </div>
      </div>

      {/* Cargo Cutaway Active Watermark Label */}
      {camMode === 'cargo' && (
        <div className="absolute top-16 left-4 flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-lg border border-stone-200/60 text-[11px] font-mono text-stone-600 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
          <span>CARGO CUTAWAY · Inspecting package & payload inside vehicle</span>
        </div>
      )}

      {/* Bottom Interactive Control Strip: Maneuvers & Bump Triggers */}
      <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        {/* Play/Pause & Dynamic Driving Maneuvers */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <button
            onClick={() => { setIsPlaying(!isPlaying); sound.click(); }}
            className="flex items-center justify-center w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200 text-stone-800 hover:bg-stone-50 shadow-sm transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause Motion' : 'Resume Motion'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Dynamic Maneuvers: Brake, Accel, Turn Left, Turn Right */}
          <div className="flex items-center p-1 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200 shadow-2xs gap-1">
            <button
              onClick={() => triggerManeuver('brake')}
              disabled={activeManeuver !== 'none'}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                activeManeuver === 'brake' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Brake: Shifts package forward against front chocks"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Brake</span>
            </button>

            <button
              onClick={() => triggerManeuver('accel')}
              disabled={activeManeuver !== 'none'}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                activeManeuver === 'accel' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Accelerate: Shifts package backward with inertia"
            >
              <ArrowUp className="w-3 h-3" />
              <span>Accel</span>
            </button>

            <button
              onClick={() => triggerManeuver('turnLeft')}
              disabled={activeManeuver !== 'none'}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                activeManeuver === 'turnLeft' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Turn Left: Centrifugal force shifts package to right"
            >
              <span>← Turn L</span>
            </button>

            <button
              onClick={() => triggerManeuver('turnRight')}
              disabled={activeManeuver !== 'none'}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                activeManeuver === 'turnRight' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Turn Right: Centrifugal force shifts package to left"
            >
              <span>Turn R →</span>
            </button>
          </div>

          {/* Bump Sequence Trigger */}
          <button
            onClick={triggerMultiBumpTest}
            disabled={bumpActive}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
              bumpActive
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-amber-500 hover:bg-amber-600 text-amber-950'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{bumpActive ? 'Pothole Test...' : 'Pothole Bumps'}</span>
          </button>
        </div>

        {/* Transition to Virtual Test Lab CTA */}
        {onEnterLab && (
          <button
            onClick={() => { sound.click(); onEnterLab(); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-98 pointer-events-auto cursor-pointer shrink-0"
          >
            <span>Proceed to Virtual Test Lab</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Dynamic Road Sequence Notification Banner */}
      {(bumpActive || activeManeuver !== 'none') && bumpStepText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-stone-900/90 text-white rounded-full text-xs font-semibold shadow-lg backdrop-blur-md animate-fade-in pointer-events-none">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{bumpStepText}</span>
        </div>
      )}
    </div>
  );
};
