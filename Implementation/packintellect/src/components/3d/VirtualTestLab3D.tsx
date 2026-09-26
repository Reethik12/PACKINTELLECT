/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { FoodId, PackagingSpec, TestType } from '../../types/packaging';
import { foodKnowledgeService } from '../../services/foodKnowledgeService';
import { createFoodMesh, getFoodCargoFit } from './FoodMeshes';
import { buildPackageAssembly } from './PackageAssemblyEngine';
import { sound } from '../../utils/audioFeedback';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Thermometer,
  Droplets,
  ArrowDown,
  MoveVertical,
  Eye,
  Sparkles,
  X,
  ChevronRight,
  Gauge,
  Boxes,
  ShieldCheck,
} from 'lucide-react';

interface VirtualTestLab3DProps {
  foodId: FoodId;
  spec: PackagingSpec;
  isV2?: boolean;
  onFailDetected?: () => void;
  onProceedToRedesign?: () => void;
  onProceedToResults?: () => void;
  className?: string;
}

// Sequence tests in exact order required by engineering specification
const FULL_TEST_SEQUENCE: TestType[] = [
  'vibration',
  'impact',
  'drop',
  'compression',
  'temperature',
  'humidity',
];

interface TestIntroInfo {
  title: string;
  subtitle: string;
  standard: string;
}

const TEST_INTRO_MAP: Record<TestType, TestIntroInfo> = {
  vibration: {
    title: 'Vibration Resistance',
    subtitle: 'Simulating continuous road vibration (ASTM D4728 harmonic sweep).',
    standard: 'ASTM D4728 / ISTA 3A',
  },
  impact: {
    title: 'Incline Impact Shock',
    subtitle: 'Simulating sudden pallet collision & emergency braking at 2.4 m/s.',
    standard: 'ASTM D880 Grade II',
  },
  drop: {
    title: 'Free-Fall Corner Drop',
    subtitle: 'Simulating 1.2m manual handling drop onto weakest corner vertex.',
    standard: 'ASTM D5276 (1200mm)',
  },
  compression: {
    title: 'Dynamic Stacking Load',
    subtitle: 'Simulating warehouse top-load compression with stacked shipping units.',
    standard: 'ASTM D642 Top-Load',
  },
  temperature: {
    title: 'Thermal Transit Cycle',
    subtitle: 'Simulating transit environment from +4°C cold store to +45°C highway heat.',
    standard: 'ISTA 7D Thermal Profile',
  },
  humidity: {
    title: 'Tropical Moisture Chamber',
    subtitle: 'Simulating 85%–95% RH tropical humidity and vapor condensation.',
    standard: 'ASTM D4332 (85% RH)',
  },
};

export const VirtualTestLab3D: React.FC<VirtualTestLab3DProps> = ({
  foodId,
  spec,
  isV2 = true,
  onFailDetected,
  onProceedToRedesign,
  onProceedToResults,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [selectedTier, setSelectedTier] = useState<'v2' | 'v1'>(isV2 ? 'v2' : 'v2');
  const effectiveIsV2 = selectedTier === 'v2';
  const effectiveSpec = useMemo(() => {
    if (selectedTier === 'v2') {
      return spec.dampingCoeff > 0.35 ? spec : foodKnowledgeService.getPackagingSpecs(foodId).v2;
    }
    return foodKnowledgeService.getPackagingSpecs(foodId).v1;
  }, [foodId, spec, selectedTier]);

  const testProfiles = useMemo(() => {
    return foodKnowledgeService.getVirtualTestProfiles(
      foodId,
      { quantity: effectiveSpec.quantity, totalWeightGrams: effectiveSpec.totalWeightGrams },
      effectiveSpec
    );
  }, [foodId, effectiveSpec]);

  // Mode: individual test or automated full sequence
  const [testMode, setTestMode] = useState<'individual' | 'full'>('individual');
  const [activeTest, setActiveTest] = useState<TestType>('vibration');

  // Full sequence states
  const [fullSequenceIndex, setFullSequenceIndex] = useState<number>(0);
  const [isSequencePaused, setIsSequencePaused] = useState<boolean>(false);
  const [sequenceStepPhase, setSequenceStepPhase] = useState<'intro' | 'active' | 'complete' | 'analysis' | 'done'>('intro');

  // Single test execution states
  const [isSingleRunning, setIsSingleRunning] = useState<boolean>(false);
  const [singleProgress, setSingleProgress] = useState<number>(0);
  const [singleOutcome, setSingleOutcome] = useState<'idle' | 'running' | 'failed' | 'passed'>('idle');

  // Full sequence completion state & results scorecard
  const [isFullTestComplete, setIsFullTestComplete] = useState<boolean>(false);
  const [fullTestPassed, setFullTestPassed] = useState<boolean>(false);
  const [completedTestsMap, setCompletedTestsMap] = useState<Record<string, boolean>>({});

  // Dynamic telemetry live values for physical display
  const [liveTelemetry, setLiveTelemetry] = useState({
    progress: 0,
    gForce: 0.2,
    impactG: 0,
    dropHeightCm: 0,
    stackingLoadN: 0,
    stackBoxCount: 0,
    temperatureC: 22,
    humidityPct: 60,
  });

  // Camera & view mode
  const [viewMode, setViewMode] = useState<'front' | 'iso' | 'closeup'>('front');

  // Internal 3D scene state reference
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    tableGroup: null as THREE.Group | null,
    packageGroup: null as THREE.Group | null,
    outerCartonGroup: null as THREE.Group | null,
    impactSledGroup: null as THREE.Group | null,
    impactRingMesh: null as THREE.Mesh | null,
    stackGroup: null as THREE.Group | null,
    stackBoxes: [] as THREE.Group[],
    thermalLight: null as THREE.PointLight | null,
    thermalHazeGroup: null as THREE.Group | null,
    moistureVaporGroup: null as THREE.Group | null,
    laserScannerGroup: null as THREE.Group | null,
    cornerImpactHighlight: null as THREE.Mesh | null,
    boxMesh: null as THREE.Mesh | null,
    boxFlaps: null as THREE.Group | null,
    cushionMesh: null as THREE.Mesh | null,
    foodGroup: null as THREE.Group | null,
    cartonMat: null as THREE.MeshStandardMaterial | null,
    cushionMat: null as THREE.MeshStandardMaterial | null,
    foodBaseY: 0,
    vibrationRipple: null as THREE.Mesh | null,

    // Interactive orbit controls
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotX: 0.16,
    rotY: 0.18,
    zoom: 6.5,
    targetRotX: 0.16,
    targetRotY: 0.18,
    targetZoom: 6.5,

    // Active test simulation parameters
    activeTest: 'vibration' as TestType | 'analysis',
    isRunning: false,
    testTime: 0,
    isV2: false,
    progress: 0,
    phase: 'active' as 'intro' | 'active' | 'complete' | 'analysis',
  });

  // Keep stateRef synced with active props
  useEffect(() => {
    stateRef.current.isV2 = isV2;
  }, [isV2]);

  // Handle View Mode adjustments
  useEffect(() => {
    const s = stateRef.current;
    if (viewMode === 'front') {
      s.targetRotX = 0.14;
      s.targetRotY = 0.14;
      s.targetZoom = 6.4;
    } else if (viewMode === 'iso') {
      s.targetRotX = 0.40;
      s.targetRotY = 0.68;
      s.targetZoom = 7.0;
    } else if (viewMode === 'closeup') {
      s.targetRotX = 0.14;
      s.targetRotY = 0.10;
      s.targetZoom = 3.8;
    }
  }, [viewMode]);

  // =========================================================================
  // SINGLE TEST EXECUTION LOGIC
  // =========================================================================
  const runSingleTest = () => {
    if (isSingleRunning || (testMode === 'full' && !isFullTestComplete)) return;
    setTestMode('individual');
    setIsSingleRunning(true);
    setSingleOutcome('running');
    setSingleProgress(0);

    stateRef.current.activeTest = activeTest;
    stateRef.current.isRunning = true;
    stateRef.current.testTime = 0;
    stateRef.current.phase = 'active';
    sound.click();

    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setSingleProgress(p);
      stateRef.current.progress = p;

      // Telemetry updates
      updateTelemetry(activeTest, p, isV2);

      if (p === 36 && activeTest === 'impact') {
        sound.impact();
      } else if (p === 50 && activeTest === 'drop') {
        sound.impact();
      }

      if (p >= 100) {
        clearInterval(interval);
        setIsSingleRunning(false);
        stateRef.current.isRunning = false;
        stateRef.current.phase = 'complete';

        const testProfile = testProfiles.find((t) => t.id === activeTest);
        const pass = effectiveIsV2 ? true : testProfile?.v1Pass ?? false;

        if (pass) {
          setSingleOutcome('passed');
          sound.success();
        } else {
          setSingleOutcome('failed');
          sound.warning();
          if (onFailDetected) {
            setTimeout(() => onFailDetected(), 1600);
          }
        }
      }
    }, 45);
  };

  // =========================================================================
  // AUTOMATED FULL VIRTUAL TEST SEQUENCE LOGIC
  // =========================================================================
  const fullSeqRef = useRef({
    stepIndex: 0,
    timer: null as NodeJS.Timeout | null,
    progressInterval: null as NodeJS.Timeout | null,
    isCancelled: false,
    isPaused: false,
  });

  const startFullVirtualTest = () => {
    // Reset full test state
    setTestMode('full');
    setIsFullTestComplete(false);
    setIsSequencePaused(false);
    fullSeqRef.current.isCancelled = false;
    fullSeqRef.current.isPaused = false;
    fullSeqRef.current.stepIndex = 0;
    setCompletedTestsMap({});
    sound.click();

    // Start with Step 0: Random Vibration Sweep
    executeFullTestStep(0);
  };

  const pauseFullVirtualTest = () => {
    setIsSequencePaused(true);
    fullSeqRef.current.isPaused = true;
    stateRef.current.isRunning = false;
    sound.click();
  };

  const resumeFullVirtualTest = () => {
    setIsSequencePaused(false);
    fullSeqRef.current.isPaused = false;
    stateRef.current.isRunning = true;
    sound.click();
  };

  const skipCurrentTest = () => {
    if (fullSeqRef.current.progressInterval) {
      clearInterval(fullSeqRef.current.progressInterval);
    }
    if (fullSeqRef.current.timer) {
      clearTimeout(fullSeqRef.current.timer);
    }

    const currentStep = FULL_TEST_SEQUENCE[fullSeqRef.current.stepIndex];
    if (currentStep) {
      setCompletedTestsMap((prev) => ({ ...prev, [currentStep]: effectiveIsV2 }));
    }

    const nextIndex = fullSeqRef.current.stepIndex + 1;
    if (nextIndex < FULL_TEST_SEQUENCE.length) {
      executeFullTestStep(nextIndex);
    } else {
      executeFinalAnalysisStep();
    }
    sound.click();
  };

  const executeFullTestStep = (stepIdx: number) => {
    if (fullSeqRef.current.isCancelled) return;
    fullSeqRef.current.stepIndex = stepIdx;
    setFullSequenceIndex(stepIdx);

    const testType = FULL_TEST_SEQUENCE[stepIdx];
    setActiveTest(testType);
    stateRef.current.activeTest = testType;
    stateRef.current.testTime = 0;

    // Phase 1: Test Introduction Display (1.2 seconds)
    setSequenceStepPhase('intro');
    stateRef.current.phase = 'intro';
    stateRef.current.isRunning = false;

    fullSeqRef.current.timer = setTimeout(() => {
      if (fullSeqRef.current.isCancelled) return;

      // Phase 2: Active 3D Physical Simulation (3.8 seconds)
      setSequenceStepPhase('active');
      stateRef.current.phase = 'active';
      stateRef.current.isRunning = true;
      let p = 0;

      fullSeqRef.current.progressInterval = setInterval(() => {
        if (fullSeqRef.current.isPaused || fullSeqRef.current.isCancelled) return;
        p += 2.5;
        stateRef.current.progress = p;
        updateTelemetry(testType, p, isV2);

        if (p === 35 && testType === 'impact') {
          sound.impact();
        } else if (p === 50 && testType === 'drop') {
          sound.impact();
        } else if ((p === 25 || p === 50 || p === 75) && testType === 'compression') {
          sound.click();
        }

        if (p >= 100) {
          if (fullSeqRef.current.progressInterval) {
            clearInterval(fullSeqRef.current.progressInterval);
          }
          stateRef.current.isRunning = false;

          // Mark current test as completed
          const testProfile = testProfiles.find((t) => t.id === testType);
          const pass = effectiveIsV2 ? true : testProfile?.v1Pass ?? false;
          setCompletedTestsMap((prev) => ({ ...prev, [testType]: pass }));

          // Phase 3: Test Completed Banner (1.0 second)
          setSequenceStepPhase('complete');
          stateRef.current.phase = 'complete';

          fullSeqRef.current.timer = setTimeout(() => {
            if (fullSeqRef.current.isCancelled) return;
            const nextIdx = stepIdx + 1;
            if (nextIdx < FULL_TEST_SEQUENCE.length) {
              executeFullTestStep(nextIdx);
            } else {
              executeFinalAnalysisStep();
            }
          }, 1100);
        }
      }, 75);
    }, 1200);
  };

  const executeFinalAnalysisStep = () => {
    setFullSequenceIndex(6); // 7th step: Final Analysis
    setSequenceStepPhase('analysis');
    stateRef.current.activeTest = 'analysis';
    stateRef.current.phase = 'analysis';
    stateRef.current.isRunning = true;
    stateRef.current.testTime = 0;

    sound.scan();

    // Run laser scan sweep animation for 3.2 seconds
    fullSeqRef.current.timer = setTimeout(() => {
      stateRef.current.isRunning = false;
      setSequenceStepPhase('done');
      setIsFullTestComplete(true);
      setFullTestPassed(effectiveIsV2);

      if (isV2) {
        sound.success();
      } else {
        sound.warning();
      }
    }, 3200);
  };

  // Helper to dynamically update telemetry values during test loop
  const updateTelemetry = (test: TestType, prog: number, v2: boolean) => {
    setLiveTelemetry((prev) => {
      const next = { ...prev, progress: Math.min(100, Math.round(prog)) };
      if (test === 'vibration') {
        next.gForce = v2 ? 0.28 + Math.sin(prog * 0.3) * 0.05 : 1.42 + Math.sin(prog * 0.4) * 0.25;
      } else if (test === 'impact') {
        if (prog >= 35 && prog <= 55) {
          next.impactG = v2 ? 3.2 : 14.8;
        } else {
          next.impactG = 0.4;
        }
      } else if (test === 'drop') {
        if (prog < 45) {
          next.dropHeightCm = Math.round((prog / 45) * 120);
        } else if (prog < 55) {
          next.dropHeightCm = 0;
        } else {
          next.dropHeightCm = 0;
        }
      } else if (test === 'compression') {
        if (prog < 30) {
          next.stackingLoadN = Math.round((prog / 30) * 850);
          next.stackBoxCount = 1;
        } else if (prog < 60) {
          next.stackingLoadN = Math.round(850 + ((prog - 30) / 30) * 950);
          next.stackBoxCount = 2;
        } else if (prog < 85) {
          next.stackingLoadN = Math.round(1800 + ((prog - 60) / 25) * 1050);
          next.stackBoxCount = 3;
        } else {
          // Releasing load
          next.stackingLoadN = Math.max(0, Math.round(2850 * (1 - (prog - 85) / 15)));
          next.stackBoxCount = 0;
        }
      } else if (test === 'temperature') {
        // Temperature sweep: 22°C -> 10°C (Cold) -> 22°C -> 45°C (Hot) -> 24°C
        if (prog < 30) {
          next.temperatureC = Math.round(22 - (prog / 30) * 12);
        } else if (prog < 55) {
          next.temperatureC = Math.round(10 + ((prog - 30) / 25) * 18);
        } else if (prog < 80) {
          next.temperatureC = Math.round(28 + ((prog - 55) / 25) * 17);
        } else {
          next.temperatureC = Math.round(45 - ((prog - 80) / 20) * 21);
        }
      } else if (test === 'humidity') {
        // Humidity: 60% -> 75% -> 85% -> 95%
        next.humidityPct = Math.round(60 + (prog / 100) * 35);
      }
      return next;
    });
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      fullSeqRef.current.isCancelled = true;
      if (fullSeqRef.current.timer) clearTimeout(fullSeqRef.current.timer);
      if (fullSeqRef.current.progressInterval) clearInterval(fullSeqRef.current.progressInterval);
    };
  }, []);

  // =========================================================================
  // THREE.JS 3D SCENE SETUP & ANIMATION LOOP
  // =========================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 920;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF6F5F0);
    scene.fog = new THREE.FogExp2(0xF6F5F0, 0.02);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.6);
    camera.lookAt(0, 0.60, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xFFFBEF, 0.85);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xFFFAF0, 2.4);
    mainSpot.position.set(0, 10, 5);
    mainSpot.angle = Math.PI / 3.2;
    mainSpot.penumbra = 0.4;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    const rimBlue = new THREE.DirectionalLight(0xBAE6FD, 0.6);
    rimBlue.position.set(-6, 4, -4);
    scene.add(rimBlue);

    // Thermal transit light (shifts color dynamically during temperature cycle)
    const thermalLight = new THREE.PointLight(0xFDBA74, 0, 12);
    thermalLight.position.set(0, 2.5, 1.5);
    scene.add(thermalLight);

    // 5. Rig Base
    const rigBase = new THREE.Group();
    scene.add(rigBase);

    // Precision Lab Floor with grid
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xEDE9DF, roughness: 0.88 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.6;
    floor.receiveShadow = true;
    rigBase.add(floor);

    // Lab floor grid marker lines
    const gridHelper = new THREE.GridHelper(24, 24, 0xD4CEBE, 0xE2DCD0);
    gridHelper.position.y = -1.59;
    rigBase.add(gridHelper);

    // 6. Hydraulic Shaker Table Assembly
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, -0.6, 0);
    rigBase.add(tableGroup);

    // Heavy steel test platen plate
    const platenGeo = new THREE.BoxGeometry(4.4, 0.25, 4.4);
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x3F4855,
      metalness: 0.85,
      roughness: 0.28,
    });
    const tableTop = new THREE.Mesh(platenGeo, steelMat);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Safety edge yellow hazard tape on steel table edges
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xEAB308 });
    const hazardStripeF = new THREE.Mesh(new THREE.BoxGeometry(4.42, 0.05, 0.04), hazardMat);
    hazardStripeF.position.set(0, 0, 2.21);
    tableGroup.add(hazardStripeF);

    // 4 Hydraulic Actuator Cylinders under table
    const pistonGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.0, 16);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.95, roughness: 0.1 });
    const actuatorPositions = [
      [-1.7, -0.5, -1.7],
      [1.7, -0.5, -1.7],
      [-1.7, -0.5, 1.7],
      [1.7, -0.5, 1.7],
    ];
    actuatorPositions.forEach(([ax, ay, az]) => {
      const piston = new THREE.Mesh(pistonGeo, chromeMat);
      piston.position.set(ax, ay, az);
      tableGroup.add(piston);
    });

    // Subtle vibration ground ripple ring (physical visual instead of tiny dots)
    const vibeRingGeo = new THREE.RingGeometry(2.3, 2.5, 32);
    const vibeRingMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const vibrationRipple = new THREE.Mesh(vibeRingGeo, vibeRingMat);
    vibrationRipple.rotation.x = -Math.PI / 2;
    vibrationRipple.position.set(0, 0.13, 0);
    tableGroup.add(vibrationRipple);

    // 7. Test Package Structure (Universal Food-Aware Package Assembly from PackageAssemblyEngine)
    const packageGroup = new THREE.Group();
    packageGroup.position.set(0, -0.35, 0);
    rigBase.add(packageGroup);

    // Build Universal Food-Aware Package Assembly (Real Solid Corrugated Box, Flaps, Cushioning, and Full Food Array)
    const assembly = buildPackageAssembly({
      foodId,
      spec: effectiveSpec,
      isV2: effectiveIsV2,
      viewMode: 'cutaway',
      cutawayFactor: 1.0,
      openFactor: 0.35,
    });

    // Measure assembly and scale it to fit the test rig table comfortably
    const rawBox = new THREE.Box3().setFromObject(assembly.rootGroup);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);

    const maxDim = Math.max(rawSize.x, rawSize.z, rawSize.y * 1.15);
    const targetSize = 2.4;
    const fitScale = maxDim > 0 ? targetSize / maxDim : 1.0;
    assembly.rootGroup.scale.set(fitScale, fitScale, fitScale);

    // Recompute bounding box after scale and place base on table y = 0
    const scaledBox = new THREE.Box3().setFromObject(assembly.rootGroup);
    assembly.rootGroup.position.set(0, -scaledBox.min.y, 0);

    packageGroup.add(assembly.rootGroup);
    stateRef.current.packageGroup = packageGroup;
    stateRef.current.foodGroup = assembly.foodGroup;
    stateRef.current.cushionMesh = assembly.cushionGroup as any;
    stateRef.current.boxMesh = assembly.secondaryGroup as any;
    stateRef.current.outerCartonGroup = assembly.secondaryGroup;
    stateRef.current.foodBaseY = assembly.foodGroup.position.y;

    const boxW = Math.max(1.8, scaledBox.max.x - scaledBox.min.x);
    const boxH = Math.max(1.8, scaledBox.max.y - scaledBox.min.y);
    const boxD = Math.max(1.8, scaledBox.max.z - scaledBox.min.z);

    // Identify carton material for thermal glow & moisture effects
    let foundCartonMat: THREE.MeshStandardMaterial | null = null;
    assembly.secondaryGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && !foundCartonMat) {
        if ((child.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          foundCartonMat = child.material as THREE.MeshStandardMaterial;
        }
      }
    });
    stateRef.current.cartonMat = foundCartonMat;

    // Corner Impact Stress Highlight (for Free-Fall Drop test)
    const cornerGeo = new THREE.BufferGeometry();
    const cornerMat = new THREE.MeshBasicMaterial({ visible: false });
    const cornerImpactHighlight = new THREE.Mesh(cornerGeo, cornerMat);
    cornerImpactHighlight.visible = false;
    packageGroup.add(cornerImpactHighlight);

    // 8. Impact Sled / Ram (for Incline Impact Shock)
    const impactSledGroup = new THREE.Group();
    const ramGeo = new THREE.BoxGeometry(1.0, 1.4, 1.0);
    const ramMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, metalness: 0.7, roughness: 0.25 });
    const ramMesh = new THREE.Mesh(ramGeo, ramMat);
    impactSledGroup.add(ramMesh);
    // Bumper pad
    const bumperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 })
    );
    bumperMesh.position.set(-0.55, 0, 0);
    impactSledGroup.add(bumperMesh);
    impactSledGroup.position.set(5.2, 0.7, 0);
    rigBase.add(impactSledGroup);

    // Impact shockwave pulse ring
    const impactRingGeo = new THREE.RingGeometry(0.2, 0.4, 24);
    const impactRingMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const impactRingMesh = new THREE.Mesh(impactRingGeo, impactRingMat);
    impactRingMesh.rotation.y = Math.PI / 2;
    impactRingMesh.position.set(boxW / 2 + 0.05, boxH / 2, 0);
    packageGroup.add(impactRingMesh);

    // 9. Dynamic Stacking Load (3 Descending Heavy Shipping Units)
    const stackGroup = new THREE.Group();
    rigBase.add(stackGroup);
    const stackBoxes: THREE.Group[] = [];

    for (let i = 0; i < 3; i++) {
      const sBox = new THREE.Group();
      const sW = 2.3 - i * 0.08;
      const sH = 1.35;
      const sD = 2.3 - i * 0.08;
      const sMesh = new THREE.Mesh(
        new THREE.BoxGeometry(sW, sH, sD),
        new THREE.MeshStandardMaterial({
          color: 0xC2A482,
          roughness: 0.75,
        })
      );
      sMesh.castShadow = true;
      sMesh.receiveShadow = true;
      sBox.add(sMesh);

      // Packing tape strip
      const sTape = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, sH + 0.01, sD + 0.01),
        new THREE.MeshStandardMaterial({ color: 0x96734B, roughness: 0.5 })
      );
      sBox.add(sTape);

      // Warning Stacking Label
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.45),
        new THREE.MeshBasicMaterial({ color: 0xF8FAFC, side: THREE.DoubleSide })
      );
      labelMesh.position.set(0, 0, sD / 2 + 0.01);
      sBox.add(labelMesh);

      sBox.position.set(0, 8.0 + i * 2.2, 0); // initial overhead position
      sBox.visible = false;
      stackGroup.add(sBox);
      stackBoxes.push(sBox);
    }

    // 10. Thermal Transit Chamber Haze & Convection Waves
    const thermalHazeGroup = new THREE.Group();
    scene.add(thermalHazeGroup);

    // Soft rising warm thermal convection bands
    const waveCount = 5;
    for (let i = 0; i < waveCount; i++) {
      const waveGeo = new THREE.PlaneGeometry(0.4, 2.2, 8, 8);
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0xF97316,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.position.set((i - 2) * 0.65, 1.2, 1.3);
      thermalHazeGroup.add(waveMesh);
    }

    // 11. Tropical Moisture Chamber (Realistic Soft Mist / Vapor Bands - NO TINY BLUE PARTICLES)
    const moistureVaporGroup = new THREE.Group();
    scene.add(moistureVaporGroup);

    // Billowing soft mist vapor bands around the chamber base and package
    for (let i = 0; i < 6; i++) {
      const vaporGeo = new THREE.CylinderGeometry(1.6 + i * 0.35, 1.8 + i * 0.35, 0.45, 24, 1, true);
      const vaporMat = new THREE.MeshBasicMaterial({
        color: 0xCCFBF1,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const vaporMesh = new THREE.Mesh(vaporGeo, vaporMat);
      vaporMesh.position.set(0, -0.4 + i * 0.4, 0);
      moistureVaporGroup.add(vaporMesh);
    }

    // 12. Laser Scanner Ring & Plane (for Final Analysis Sequence)
    const laserScannerGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(1.8, 1.95, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const laserRing = new THREE.Mesh(ringGeo, ringMat);
    laserRing.rotation.x = -Math.PI / 2;
    laserScannerGroup.add(laserRing);

    // Laser scanning sheet
    const sheetGeo = new THREE.CircleGeometry(1.8, 36);
    const sheetMat = new THREE.MeshBasicMaterial({
      color: 0x34D399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const laserSheet = new THREE.Mesh(sheetGeo, sheetMat);
    laserSheet.rotation.x = -Math.PI / 2;
    laserScannerGroup.add(laserSheet);

    laserScannerGroup.position.set(0, -0.2, 0);
    scene.add(laserScannerGroup);

    // Save references to stateRef
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.tableGroup = tableGroup;
    stateRef.current.packageGroup = packageGroup;
    stateRef.current.impactSledGroup = impactSledGroup;
    stateRef.current.impactRingMesh = impactRingMesh;
    stateRef.current.stackGroup = stackGroup;
    stateRef.current.stackBoxes = stackBoxes;
    stateRef.current.thermalLight = thermalLight;
    stateRef.current.thermalHazeGroup = thermalHazeGroup;
    stateRef.current.moistureVaporGroup = moistureVaporGroup;
    stateRef.current.laserScannerGroup = laserScannerGroup;
    stateRef.current.cornerImpactHighlight = cornerImpactHighlight;
    stateRef.current.vibrationRipple = vibrationRipple;

    // =========================================================================
    // 3D ANIMATION LOOP
    // =========================================================================
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      // Smooth camera orbit lerp
      s.rotX += (s.targetRotX - s.rotX) * 0.08;
      s.rotY += (s.targetRotY - s.rotY) * 0.08;
      s.zoom += (s.targetZoom - s.zoom) * 0.08;

      const targetLookY = 0.60;
      const camY = targetLookY + s.zoom * Math.sin(s.rotX);
      const camRadius = s.zoom * Math.cos(s.rotX);
      const camX = camRadius * Math.sin(s.rotY);
      const camZ = camRadius * Math.cos(s.rotY);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, targetLookY, 0);

      // Base resets when test not active
      if (s.impactSledGroup && s.activeTest !== 'impact') {
        s.impactSledGroup.position.set(5.2, 0.7, 0);
      }
      if (s.impactRingMesh && s.activeTest !== 'impact') {
        (s.impactRingMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
      if (s.cornerImpactHighlight && s.activeTest !== 'drop') {
        (s.cornerImpactHighlight.material as THREE.MeshBasicMaterial).opacity = 0;
      }
      if (s.thermalLight && s.activeTest !== 'temperature') {
        s.thermalLight.intensity = 0;
      }
      if (s.laserScannerGroup && s.activeTest !== 'analysis') {
        laserRing.material.opacity = 0;
        laserSheet.material.opacity = 0;
      }

      // Stack boxes handling: visible when in compression test mode
      if (s.stackBoxes.length) {
        if (s.activeTest !== 'compression') {
          s.stackBoxes.forEach((b) => {
            b.visible = false;
          });
        } else if (!s.isRunning) {
          // In compression test mode (idle/preview), show the overhead stack units clearly!
          const targetY1 = -0.35 + boxH + 0.68;
          s.stackBoxes[0].visible = true;
          s.stackBoxes[0].position.set(0, targetY1 + 1.2, 0);
          s.stackBoxes[1].visible = true;
          s.stackBoxes[1].position.set(0, targetY1 + 2.7, 0);
          s.stackBoxes[2].visible = true;
          s.stackBoxes[2].position.set(0, targetY1 + 4.2, 0);
        }
      }

      // Hide thermal haze when not in temperature
      if (s.thermalHazeGroup && s.activeTest !== 'temperature') {
        s.thermalHazeGroup.children.forEach((c) => {
          ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0;
        });
      }

      // Hide moisture vapor when not in humidity
      if (s.moistureVaporGroup && s.activeTest !== 'humidity') {
        s.moistureVaporGroup.children.forEach((c) => {
          ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0;
        });
      }

      // --- PHYSICAL TEST EXECUTION ---
      if (s.isRunning) {
        s.testTime += delta;
        const normProg = s.progress / 100;

        switch (s.activeTest) {
          // ---------------------------------------------------------------
          // 1. RANDOM VIBRATION SWEEP
          // ---------------------------------------------------------------
          case 'vibration': {
            const freq = 24;
            const vibeAmp = s.isV2 ? 0.035 : 0.14;

            // Hydraulic table oscillation
            if (s.tableGroup) {
              s.tableGroup.position.y = -0.6 + Math.sin(time * freq) * vibeAmp;
              s.tableGroup.position.x = Math.cos(time * freq * 0.7) * (vibeAmp * 0.4);
            }
            // Package response with inertia
            if (s.packageGroup) {
              s.packageGroup.position.y = -0.35 + Math.sin(time * freq * 0.95) * vibeAmp * (s.isV2 ? 0.4 : 1.35);
              s.packageGroup.rotation.z = Math.sin(time * freq * 0.45) * (s.isV2 ? 0.008 : 0.06);
            }
            // Internal cushioning compliance
            if (s.cushionMesh) {
              const comp = 1 - Math.sin(time * freq) * (s.isV2 ? 0.05 : 0.18);
              s.cushionMesh.scale.y = comp;
            }
            // Food dynamic compliance
            if (s.foodGroup) {
              if (s.isV2) {
                // Held snugly in tuned insert
                s.foodGroup.position.x = Math.sin(time * freq * 0.5) * 0.015;
                s.foodGroup.position.y = s.foodBaseY + Math.sin(time * freq) * 0.015;
              } else {
                // Rattling inside baseline cavity
                s.foodGroup.position.x = Math.sin(time * 30) * 0.09;
                s.foodGroup.position.y = s.foodBaseY + Math.abs(Math.sin(time * 24)) * 0.12;
              }
            }
            // Subtle physical vibration wave radiating from base
            if (s.vibrationRipple) {
              const pulse = (time * 3) % 1;
              s.vibrationRipple.scale.set(1 + pulse * 0.6, 1 + pulse * 0.6, 1);
              (s.vibrationRipple.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.6;
            }
            break;
          }

          // ---------------------------------------------------------------
          // 2. INCLINE IMPACT SHOCK
          // ---------------------------------------------------------------
          case 'impact': {
            if (s.impactSledGroup && s.tableGroup && s.packageGroup) {
              if (normProg < 0.34) {
                // Platform tilts slightly (simulating incline sled guide track)
                s.tableGroup.rotation.z = -(normProg / 0.34) * 0.12;
                s.packageGroup.rotation.z = -(normProg / 0.34) * 0.12;
                // Sled accelerates toward package
                s.impactSledGroup.position.x = 5.2 - (normProg / 0.34) * 3.4;
              } else if (normProg < 0.46) {
                // IMPACT MOMENT!
                s.impactSledGroup.position.x = 1.7;
                // Impact pulse wave expands
                if (s.impactRingMesh) {
                  const pulseAge = (normProg - 0.34) / 0.12;
                  s.impactRingMesh.scale.set(1 + pulseAge * 3.5, 1 + pulseAge * 3.5, 1);
                  (s.impactRingMesh.material as THREE.MeshBasicMaterial).opacity = 1 - pulseAge;
                }
                // Package jolts sideways
                const joltDist = s.isV2 ? 0.08 : 0.38;
                s.packageGroup.position.x = -joltDist;
                s.packageGroup.rotation.z = s.isV2 ? 0.02 : 0.12;

                // Cushioning compresses under impact shock
                if (s.cushionMesh) {
                  s.cushionMesh.scale.x = s.isV2 ? 0.94 : 0.72;
                }
                // Food surges against wall
                if (s.foodGroup) {
                  s.foodGroup.position.x = s.isV2 ? -0.06 : -0.28;
                }
              } else {
                // Sled rebounds back, platform levels
                const rebProg = (normProg - 0.46) / 0.54;
                s.impactSledGroup.position.x = 1.7 + rebProg * 2.2;
                s.tableGroup.rotation.z *= 0.92;
                s.packageGroup.position.x *= 0.92;
                s.packageGroup.rotation.z *= 0.92;
                if (s.cushionMesh) s.cushionMesh.scale.x += (1 - s.cushionMesh.scale.x) * 0.1;
                if (s.foodGroup) s.foodGroup.position.x *= 0.92;
              }
            }
            break;
          }

          // ---------------------------------------------------------------
          // 3. FREE-FALL CORNER DROP
          // ---------------------------------------------------------------
          case 'drop': {
            if (s.packageGroup) {
              if (normProg < 0.4) {
                // Hoisting package up to 1.2m equivalent height with 25° corner tilt
                const liftProg = normProg / 0.4;
                s.packageGroup.position.y = -0.35 + liftProg * 2.4;
                s.packageGroup.rotation.z = liftProg * 0.42;
                s.packageGroup.rotation.x = liftProg * 0.28;
              } else if (normProg < 0.52) {
                // Free fall acceleration: y = h - 0.5 * g * t^2
                const fallProg = (normProg - 0.4) / 0.12;
                s.packageGroup.position.y = -0.35 + 2.4 * (1 - fallProg * fallProg);
              } else if (normProg < 0.75) {
                // Impact on corner vertex!
                const impactAge = (normProg - 0.52) / 0.23;
                const bounce = Math.sin(impactAge * Math.PI * 3) * Math.exp(-impactAge * 4) * (s.isV2 ? 0.12 : 0.45);
                s.packageGroup.position.y = -0.35 + Math.max(0, bounce);
                s.packageGroup.rotation.z *= 0.88;
                s.packageGroup.rotation.x *= 0.88;

                // Highlight impact corner
                if (s.cornerImpactHighlight) {
                  (s.cornerImpactHighlight.material as THREE.MeshBasicMaterial).opacity = Math.max(
                    0,
                    1 - impactAge * 1.5
                  );
                }
                // Cushioning compression under vertical shock
                if (s.cushionMesh) {
                  s.cushionMesh.scale.y = s.isV2 ? 0.92 : 0.65;
                }
                // Food payload dynamic reaction inside cradle
                if (s.foodGroup) {
                  s.foodGroup.position.y = s.foodBaseY + Math.max(0, bounce) * (s.isV2 ? 0.35 : 0.85);
                }
              } else {
                // Returned to stable resting posture on table
                s.packageGroup.position.y = -0.35;
                s.packageGroup.rotation.set(0, 0, 0);
                if (s.cushionMesh) s.cushionMesh.scale.y += (1 - s.cushionMesh.scale.y) * 0.15;
                if (s.foodGroup) s.foodGroup.position.set(0, s.foodBaseY, 0);
              }
            }
            break;
          }

          // ---------------------------------------------------------------
          // 4. DYNAMIC STACKING LOAD (ACTUAL DESCENDING SHIPPING UNITS)
          // ---------------------------------------------------------------
          case 'compression': {
            if (s.stackBoxes.length === 3 && s.packageGroup && s.boxMesh) {
              const b1 = s.stackBoxes[0];
              const b2 = s.stackBoxes[1];
              const b3 = s.stackBoxes[2];

              b1.visible = true;
              b2.visible = normProg > 0.28;
              b3.visible = normProg > 0.55;

              // Box 1 descends onto test package lid
              const targetY1 = -0.35 + boxH + 0.68;
              if (normProg < 0.28) {
                const subProg = normProg / 0.28;
                b1.position.y = 7.0 - subProg * (7.0 - targetY1);
              } else {
                b1.position.y = targetY1;
              }

              // Box 2 descends onto Box 1
              const targetY2 = targetY1 + 1.35;
              if (normProg >= 0.28 && normProg < 0.55) {
                const subProg = (normProg - 0.28) / 0.27;
                b2.position.y = 8.5 - subProg * (8.5 - targetY2);
              } else if (normProg >= 0.55) {
                b2.position.y = targetY2;
              }

              // Box 3 descends onto Box 2
              const targetY3 = targetY2 + 1.35;
              if (normProg >= 0.55 && normProg < 0.82) {
                const subProg = (normProg - 0.55) / 0.27;
                b3.position.y = 9.8 - subProg * (9.8 - targetY3);
              } else if (normProg >= 0.82) {
                b3.position.y = targetY3;
              }

              // Downward compression effect on test package
              // V1 carton buckles/crushes by 24%, V2 only deflecting 3.5%
              const maxDeflection = s.isV2 ? 0.04 : 0.24;
              let currentDeflection = 0;
              if (normProg < 0.82) {
                currentDeflection = normProg * maxDeflection;
              } else {
                // Releasing load: boxes lift back up, package rebounds
                const releaseProg = (normProg - 0.82) / 0.18;
                currentDeflection = (1 - releaseProg) * maxDeflection;
                b1.position.y += releaseProg * 4.0;
                b2.position.y += releaseProg * 4.5;
                b3.position.y += releaseProg * 5.0;
              }

              if (s.outerCartonGroup) {
                s.outerCartonGroup.scale.y = 1 - currentDeflection;
              }
              if (s.boxMesh) {
                s.boxMesh.scale.y = 1 - currentDeflection;
              }
              if (s.cushionMesh) {
                s.cushionMesh.scale.y = 1 - currentDeflection * 1.4;
              }
            }
            break;
          }

          // ---------------------------------------------------------------
          // 5. THERMAL TRANSIT CYCLE (ENVIRONMENTAL ATMOSPHERE TRANSFORMATION)
          // ---------------------------------------------------------------
          case 'temperature': {
            if (s.thermalLight) {
              const bMat = s.cartonMat || (s.boxMesh?.material as THREE.MeshStandardMaterial);

              if (normProg < 0.35) {
                // COLD CYCLE: 10°C / 4°C -> Cool frosty light & atmosphere
                s.thermalLight.intensity = 2.2;
                s.thermalLight.color.setHex(0x38BDF8); // icy blue
                scene.fog?.color.setHex(0xEDF4FA);
                if (bMat && bMat.emissive) {
                  bMat.emissive.setHex(0x0284C7);
                  bMat.emissiveIntensity = 0.25;
                }
              } else if (normProg < 0.55) {
                // NORMAL INTERVAL: 22°C neutral transition
                s.thermalLight.intensity = 0.5;
                s.thermalLight.color.setHex(0xFFFBEF);
                scene.fog?.color.setHex(0xF6F5F0);
                if (bMat && bMat.emissive) {
                  bMat.emissive.setHex(0x000000);
                  bMat.emissiveIntensity = 0;
                }
              } else if (normProg < 0.85) {
                // HOT CYCLE: 45°C highway heat -> warm solar flare & heat shimmer convection waves
                s.thermalLight.intensity = 3.2;
                s.thermalLight.color.setHex(0xEA580C); // warm heat amber
                scene.fog?.color.setHex(0xFDF2E9);
                if (bMat && bMat.emissive) {
                  bMat.emissive.setHex(0xEA580C);
                  bMat.emissiveIntensity = 0.35;
                }

                // Animate vertical rising heat shimmer waves
                if (s.thermalHazeGroup) {
                  s.thermalHazeGroup.children.forEach((c, idx) => {
                    const wave = c as THREE.Mesh;
                    wave.position.y = 0.6 + ((time * 0.8 + idx * 0.3) % 2.0);
                    const mat = wave.material as THREE.MeshBasicMaterial;
                    mat.opacity = 0.35 * Math.sin(time * 6 + idx);
                  });
                }
              } else {
                // RECOVERING TO STANDARD AMBIENT
                s.thermalLight.intensity *= 0.9;
                if (bMat) bMat.emissiveIntensity *= 0.9;
                scene.fog?.color.setHex(0xF6F5F0);
              }
            }
            break;
          }

          // ---------------------------------------------------------------
          // 6. TROPICAL MOISTURE CHAMBER (REALISTIC BILLOWING MIST & SURFACE SHEEN)
          // ---------------------------------------------------------------
          case 'humidity': {
            if (s.moistureVaporGroup) {
              const bMat = s.cartonMat || (s.boxMesh?.material as THREE.MeshStandardMaterial);

              if (bMat) {
                // As humidity rises, package surfaces develop a glistening condensation dampness
                bMat.roughness = THREE.MathUtils.lerp(0.28, 0.08, normProg);
                bMat.metalness = THREE.MathUtils.lerp(0.05, 0.35, normProg);
              }

              // Soft billowing vapor mist bands circulating around package base
              s.moistureVaporGroup.children.forEach((c, idx) => {
                const vapor = c as THREE.Mesh;
                vapor.rotation.y = time * 0.25 * (idx % 2 === 0 ? 1 : -1);
                const mat = vapor.material as THREE.MeshBasicMaterial;
                mat.opacity = (normProg * 0.32) * (0.8 + Math.sin(time * 3 + idx) * 0.2);
              });
            }
            break;
          }

          // ---------------------------------------------------------------
          // 7. FINAL OVERALL ANALYSIS (LASER SCANNER SWEEP HUD)
          // ---------------------------------------------------------------
          case 'analysis': {
            if (s.laserScannerGroup) {
              laserRing.material.opacity = 0.9;
              laserSheet.material.opacity = 0.22;
              // Laser ring sweeps up and down package height
              const sweepCycle = (Math.sin(time * 4) + 1) / 2;
              s.laserScannerGroup.position.y = -0.35 + sweepCycle * (boxH + 0.4);
            }
            break;
          }
        }
      } else {
        // Return to neutral resting state when idle
        if (s.tableGroup) {
          s.tableGroup.position.set(0, -0.6, 0);
          s.tableGroup.rotation.set(0, 0, 0);
        }
        if (s.packageGroup) {
          s.packageGroup.position.set(0, -0.35, 0);
          s.packageGroup.rotation.set(0, 0, 0);
        }
        if (s.outerCartonGroup) {
          s.outerCartonGroup.scale.set(1, 1, 1);
        }
        if (s.boxMesh) {
          s.boxMesh.scale.set(1, 1, 1);
        }
        if (s.cartonMat && s.cartonMat.emissive) {
          s.cartonMat.emissive.setHex(0x000000);
          s.cartonMat.emissiveIntensity = 0;
          s.cartonMat.roughness = 0.28;
          s.cartonMat.metalness = 0.05;
        }
        if (s.cushionMesh) {
          s.cushionMesh.scale.set(1, 1, 1);
        }
        if (s.foodGroup) {
          s.foodGroup.position.set(0, s.foodBaseY, 0);
          s.foodGroup.rotation.set(0, 0, 0);
        }
        if (s.vibrationRipple) {
          (s.vibrationRipple.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse and Touch Drag Orbit Controls
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.isDragging) return;
      const dx = e.clientX - s.prevMouseX;
      const dy = e.clientY - s.prevMouseY;
      s.targetRotY += dx * 0.007;
      s.targetRotX = Math.max(-0.2, Math.min(1.2, s.targetRotX + dy * 0.007));
      s.prevMouseX = e.clientX;
      s.prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      s.targetZoom = Math.max(3.2, Math.min(9.5, s.targetZoom + e.deltaY * 0.005));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

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
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [foodId, effectiveIsV2, effectiveSpec]);

  const activeTestProfile = testProfiles.find((t) => t.id === activeTest) || testProfiles[0];
  const currentIntro = TEST_INTRO_MAP[activeTest] || TEST_INTRO_MAP.vibration;

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden rounded-3xl bg-[#FAF9F5] border border-stone-200/90 shadow-lg flex flex-col justify-between ${className}`}
    >
      {/* 3D Lab Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

      {/* =====================================================================
          TOP BAR: SEQUENCE TIMELINE & INDIVIDUAL TEST TABS
      ===================================================================== */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-3 pointer-events-none">
        {/* Row 1: Header + Architecture Selector + Camera View Modes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Facility Status Badge & Architecture Selector */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-stone-200/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-stone-700 tracking-tight">
                LAB FACILITY · CALIBRATED RIG
              </span>
              <span className="text-[10px] text-stone-400 font-mono">|</span>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                {effectiveIsV2 ? 'V2 ENGINEERED ARCHITECTURE (UPDATED BOX)' : 'V1 BASELINE SPEC'}
              </span>
            </div>

            {/* Architecture Selector Buttons */}
            <div className="flex items-center p-0.5 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-2xs gap-1">
              <button
                onClick={() => {
                  setSelectedTier('v2');
                  sound.click();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  selectedTier === 'v2'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>★ Updated Box (V2 Pass)</span>
              </button>
              <button
                onClick={() => {
                  setSelectedTier('v1');
                  sound.click();
                }}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                  selectedTier === 'v1'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span>V1 Baseline</span>
              </button>
            </div>
          </div>

          {/* Camera View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200 shadow-xs pointer-events-auto">
            <button
              onClick={() => setViewMode('front')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-xl transition-all ${
                viewMode === 'front' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Front Inspection
            </button>
            <button
              onClick={() => setViewMode('iso')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-xl transition-all ${
                viewMode === 'iso' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => setViewMode('closeup')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-xl transition-all ${
                viewMode === 'closeup' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Cavity Zoom
            </button>
          </div>
        </div>

        {/* Row 2: CINEMATIC FULL TEST STATE / TIMELINE PROGRESS INDICATOR */}
        {testMode === 'full' && (
          <div className="bg-stone-950/85 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-stone-800/80 shadow-lg pointer-events-auto transition-all animate-fade-in">
            <div className="flex items-center justify-between text-[11px] font-mono mb-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                END-TO-END VIRTUAL TEST JOURNEY
              </span>
              <span className="text-stone-400">
                STEP {Math.min(7, fullSequenceIndex + 1)} OF 7 ·{' '}
                {sequenceStepPhase === 'analysis' ? 'FINAL ANALYSIS' : activeTest.toUpperCase()}
              </span>
            </div>

            {/* Cinematic step progression indicator */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {[
                { id: 'vibration', label: 'VIBRATION' },
                { id: 'impact', label: 'IMPACT' },
                { id: 'drop', label: 'DROP' },
                { id: 'compression', label: 'STACKING' },
                { id: 'temperature', label: 'THERMAL' },
                { id: 'humidity', label: 'MOISTURE' },
                { id: 'analysis', label: 'FINAL ANALYSIS' },
              ].map((step, idx) => {
                const isCurrent = fullSequenceIndex === idx;
                const isCompleted = fullSequenceIndex > idx || isFullTestComplete;
                const passed = completedTestsMap[step.id] ?? isV2;

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-amber-400/20 border-amber-400/80 text-amber-300 ring-2 ring-amber-400/40'
                        : isCompleted
                        ? passed
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                          : 'bg-red-950/60 border-red-500/60 text-red-400'
                        : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold truncate max-w-full">
                      {step.label}
                    </span>
                    <span className="text-xs mt-0.5">
                      {isCompleted ? (
                        passed ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-red-400 font-bold">✗</span>
                        )
                      ) : isCurrent ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      ) : (
                        <span className="text-stone-600">○</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 3: INDIVIDUAL TEST SELECTOR TABS (KEEP EXISTING INDIVIDUAL TEST CONTROLS) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-xs overflow-x-auto max-w-full">
            {testProfiles.map((t) => {
              const isSelected = activeTest === t.id && testMode === 'individual';
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (!isSingleRunning && testMode !== 'full') {
                      setActiveTest(t.id);
                      setTestMode('individual');
                      sound.click();
                    }
                  }}
                  disabled={isSingleRunning || (testMode === 'full' && !isFullTestComplete)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 disabled:opacity-50'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>

          {/* ASTM Standard Chip */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-stone-200 shadow-xs text-xs font-mono text-stone-600">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>{activeTestProfile.standardCode}</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CINEMATIC TEST INTRO CHIP (Docked at top so 3D package is never blocked)
      ===================================================================== */}
      {testMode === 'full' && sequenceStepPhase === 'intro' && (
        <div className="absolute top-26 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center animate-fade-in w-full max-w-lg px-4">
          <div className="bg-stone-950/92 backdrop-blur-md border border-stone-700/80 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  TESTING
                </span>
                <span className="text-[11px] font-mono text-stone-400">· {currentIntro.standard}</span>
              </div>
              <h3 className="text-sm sm:text-base font-display font-bold text-white">
                {currentIntro.title}
              </h3>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/90 text-[11px] font-mono text-emerald-400 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Simulating...
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TEST COMPLETE CHIP (Docked at top so 3D package is never blocked)
      ===================================================================== */}
      {testMode === 'full' && sequenceStepPhase === 'complete' && (
        <div className="absolute top-26 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center animate-fade-in w-full max-w-md px-4">
          <div className="bg-emerald-950/92 backdrop-blur-md border border-emerald-500/50 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <span className="text-xs font-mono font-bold text-emerald-300 block uppercase tracking-wider">
                  {activeTest.toUpperCase()} COMPLETE ✓
                </span>
                <span className="text-[10px] text-stone-300">Preparing next physical simulation...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FINAL ANALYSIS SCANNER HUD OVERLAY (Docked at top, unblocking package)
      ===================================================================== */}
      {testMode === 'full' && sequenceStepPhase === 'analysis' && (
        <div className="absolute top-26 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center animate-fade-in w-full max-w-md px-4">
          <div className="bg-stone-950/92 backdrop-blur-md border border-emerald-500/60 text-white px-5 py-3 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  TRANSIT STRESS LAB · SCANNING
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300">VERIFYING MULTI-AXIS</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-left text-[10px] font-mono">
              <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded">
                <span className="text-stone-300">Vibration:</span>
                <span className="text-emerald-400 font-bold">✓ PASS</span>
              </div>
              <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded">
                <span className="text-stone-300">Impact:</span>
                <span className="text-emerald-400 font-bold">✓ PASS</span>
              </div>
              <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded">
                <span className="text-stone-300">Drop:</span>
                <span className="text-emerald-400 font-bold">✓ PASS</span>
              </div>
              <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded">
                <span className="text-stone-300">Stacking:</span>
                <span className="text-emerald-400 font-bold">✓ PASS</span>
              </div>
              <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded">
                <span className="text-stone-300">Thermal:</span>
                <span className="text-emerald-400 font-bold">✓ PASS</span>
              </div>
              <div className="flex items-center justify-between bg-stone-900/80 px-2 py-1 rounded">
                <span className="text-stone-300">Moisture:</span>
                <span className="text-emerald-400 font-bold">✓ PASS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BOTTOM HUD: CONTROLS & LIVE TELEMETRY CARD
      ===================================================================== */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row items-end justify-between gap-4 pointer-events-none">
        {/* Left Telemetry & Test Information Card */}
        <div className="max-w-md w-full p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-md pointer-events-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              {activeTestProfile.name}
            </span>
            <span className="text-[11px] font-mono text-stone-500">{activeTestProfile.unit}</span>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed mb-3">
            {activeTestProfile.description}
          </p>

          {/* Dynamic Physical Metric Readouts */}
          <div className="grid grid-cols-2 gap-2 mb-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs font-mono">
            {activeTest === 'vibration' && (
              <>
                <div>
                  <span className="text-[10px] text-stone-500 block">HARMONIC RMS</span>
                  <span className="font-bold text-stone-900">{liveTelemetry.gForce.toFixed(2)} G</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">FREQUENCY</span>
                  <span className="font-bold text-emerald-700">26.4 Hz PSD</span>
                </div>
              </>
            )}

            {activeTest === 'impact' && (
              <>
                <div>
                  <span className="text-[10px] text-stone-500 block">SLED VELOCITY</span>
                  <span className="font-bold text-stone-900">2.4 m/s</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">PEAK DECELERATION</span>
                  <span className={`font-bold ${liveTelemetry.impactG > 6.0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {liveTelemetry.impactG.toFixed(1)} G
                  </span>
                </div>
              </>
            )}

            {activeTest === 'drop' && (
              <>
                <div>
                  <span className="text-[10px] text-stone-500 block">DROP ELEVATION</span>
                  <span className="font-bold text-stone-900">{liveTelemetry.dropHeightCm} cm</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">TARGET VERTEX</span>
                  <span className="font-bold text-stone-800">Corner Post 4</span>
                </div>
              </>
            )}

            {activeTest === 'compression' && (
              <>
                <div>
                  <span className="text-[10px] text-stone-500 block">TOP STACK UNITS</span>
                  <span className="font-bold text-stone-900">{liveTelemetry.stackBoxCount} Cartons</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">LOAD RESISTANCE</span>
                  <span className="font-bold text-amber-700">{liveTelemetry.stackingLoadN} N</span>
                </div>
              </>
            )}

            {activeTest === 'temperature' && (
              <>
                <div>
                  <span className="text-[10px] text-stone-500 block">CHAMBER TEMP</span>
                  <span className="font-bold text-stone-900">{liveTelemetry.temperatureC} °C</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">CYCLE PHASE</span>
                  <span className="font-bold text-indigo-700">
                    {liveTelemetry.temperatureC < 15
                      ? 'Cold Store'
                      : liveTelemetry.temperatureC > 35
                      ? 'Midday Highway'
                      : 'Standard Ambient'}
                  </span>
                </div>
              </>
            )}

            {activeTest === 'humidity' && (
              <>
                <div>
                  <span className="text-[10px] text-stone-500 block">RELATIVE HUMIDITY</span>
                  <span className="font-bold text-teal-700">{liveTelemetry.humidityPct}% RH</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">SURFACE CONDENSATION</span>
                  <span className="font-bold text-stone-900">
                    {liveTelemetry.humidityPct > 80 ? 'Heavy Dew Sheen' : 'Vapor Equilibrium'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Progress bar during test */}
          {(isSingleRunning || (testMode === 'full' && sequenceStepPhase === 'active')) && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  SIMULATING PHYSICAL ASTM STRESS...
                </span>
                <span>{testMode === 'full' ? liveTelemetry.progress : singleProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-75"
                  style={{ width: `${testMode === 'full' ? liveTelemetry.progress : singleProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Outcome Status in Individual Mode */}
          {testMode === 'individual' && singleOutcome === 'failed' && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 animate-fade-in">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Failure Detected in V1 Baseline</span>
                <span className="text-red-700 leading-snug">{activeTestProfile.failureDescription}</span>
              </div>
            </div>
          )}

          {testMode === 'individual' && singleOutcome === 'passed' && (
            <div className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">V2 Test Passed with Safety Margin</span>
                <span className="text-emerald-700 leading-snug">{activeTestProfile.remedyDescription}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Primary Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto w-full sm:w-auto">
          {/* Individual Test Button (Kept as requested) */}
          <button
            onClick={runSingleTest}
            disabled={isSingleRunning || (testMode === 'full' && !isFullTestComplete)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium text-xs border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 shadow-sm transition-all active:scale-95 disabled:opacity-50`}
          >
            <Play className="w-3.5 h-3.5 fill-stone-700" />
            <span>{isSingleRunning ? 'Simulating...' : `Run Single: ${activeTestProfile.name}`}</span>
          </button>

          {/* PRIMARY ACTION: RUN FULL VIRTUAL TEST */}
          {testMode !== 'full' || isFullTestComplete ? (
            <div className="flex flex-col">
              <button
                onClick={startFullVirtualTest}
                disabled={isSingleRunning}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md hover:shadow-lg transition-all active:scale-95 group"
              >
                {isFullTestComplete ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-emerald-200 group-hover:rotate-180 transition-transform duration-500" />
                    <span>RUN FULL TEST AGAIN</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>RUN FULL VIRTUAL TEST</span>
                  </>
                )}
              </button>
              <span className="text-[10px] text-stone-500 text-center mt-1 font-mono">
                Run the complete journey from vibration to environmental stress.
              </span>
            </div>
          ) : (
            /* While full test is running: PAUSE / RESUME / SKIP controls */
            <div className="flex items-center gap-2">
              <button
                onClick={isSequencePaused ? resumeFullVirtualTest : pauseFullVirtualTest}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-xs bg-stone-900 hover:bg-stone-800 text-white shadow-md transition-all active:scale-95"
              >
                {isSequencePaused ? (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>RESUME TEST</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>PAUSE TEST</span>
                  </>
                )}
              </button>

              <button
                onClick={skipCurrentTest}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl font-medium text-xs bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 shadow-sm transition-all active:scale-95"
              >
                <SkipForward className="w-4 h-4" />
                <span>SKIP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          FINAL RESULT MODAL / OVERVIEW SUMMARY (Shown after full sequence finishes)
      ===================================================================== */}
      {isFullTestComplete && (
        <div className="absolute inset-0 z-30 bg-stone-950/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider font-semibold text-emerald-800 block mb-1">
                  DYNAMIC TRANSIT AUDIT REPORT
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-stone-900 tracking-tight">
                  OVERALL VIRTUAL TEST RESULT
                </h3>
              </div>
              <button
                onClick={() => setIsFullTestComplete(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Protection Assessment Card */}
            <div
              className={`p-4 rounded-2xl border mb-5 ${
                fullTestPassed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {fullTestPassed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <span className="font-bold text-sm">
                  Protection Assessment:{' '}
                  {fullTestPassed ? 'No Structural Failure' : 'Major Damage / Inadequate Protection'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-stone-700">
                {fullTestPassed
                  ? 'The package handled the virtual test sequence successfully. All vibration, shock, drop, dynamic stacking, and environmental parameters remained well within engineered safety margins.'
                  : 'The package completed the virtual test sequence with areas requiring improvement. Critical failure occurred under dynamic stacking compression and corner drop shock.'}
              </p>
            </div>

            {/* Test Summary Table */}
            <div className="mb-5 border border-stone-200 rounded-2xl overflow-hidden text-xs">
              <div className="bg-stone-100 px-4 py-2 font-mono font-bold text-stone-700 grid grid-cols-12 gap-2">
                <span className="col-span-5">TEST SEQUENCE</span>
                <span className="col-span-4">STANDARD</span>
                <span className="col-span-3 text-right">OUTCOME</span>
              </div>

              <div className="divide-y divide-stone-100">
                {testProfiles.map((test) => {
                  const pass = effectiveIsV2 ? true : test.v1Pass;
                  return (
                    <div key={test.id} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-5 font-medium text-stone-800 truncate">{test.name}</span>
                      <span className="col-span-4 font-mono text-[11px] text-stone-500 truncate">
                        {test.standardCode}
                      </span>
                      <span className="col-span-3 text-right">
                        {pass ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-red-600">
                            <ShieldAlert className="w-3.5 h-3.5" /> FAIL
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-stone-50 px-4 py-2.5 border-t border-stone-200 flex items-center justify-between font-mono font-bold">
                <span className="text-stone-700">OVERALL STATUS</span>
                <span className={fullTestPassed ? 'text-emerald-700 text-sm' : 'text-red-600 text-sm'}>
                  {fullTestPassed ? 'CERTIFIED PASS (V2)' : 'FAIL / REDESIGN REQUIRED (V1)'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={startFullVirtualTest}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-run Full Test</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsFullTestComplete(false)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-medium cursor-pointer"
                >
                  Inspect Individual Tests
                </button>

                {fullTestPassed && onProceedToResults && (
                  <button
                    onClick={() => {
                      setIsFullTestComplete(false);
                      onProceedToResults();
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    <span>View Engineering Results</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {!fullTestPassed && onProceedToRedesign && (
                  <button
                    onClick={() => {
                      setIsFullTestComplete(false);
                      onProceedToRedesign();
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    <span>Initiate Redesign</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
