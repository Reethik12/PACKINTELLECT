import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FoodId, PackagingSpec } from '../../types/packaging';
import { buildPackageAssembly, PackageAssemblyResult } from './PackageAssemblyEngine';
import { sound } from '../../utils/audioFeedback';
import { RotateCw, Eye, Layers, Scissors, AlertTriangle, ShieldCheck, Box, Package, Shield } from 'lucide-react';

interface PackagingBox3DProps {
  foodId: FoodId;
  spec: PackagingSpec;
  isV2?: boolean;
  hasFailed?: boolean;
  interactive?: boolean;
  className?: string;
  defaultMode?: 'normal' | 'cutaway' | 'exploded' | 'open';
}

export const PackagingBox3D: React.FC<PackagingBox3DProps> = ({
  foodId,
  spec,
  isV2 = false,
  hasFailed = false,
  interactive = true,
  className = '',
  defaultMode = 'normal',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'cutaway' | 'exploded' | 'open'>(defaultMode);
  const [autoRotate, setAutoRotate] = useState(true);

  // References for Three.js state
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    assemblyResult: null as PackageAssemblyResult | null,
    rootGroup: null as THREE.Group | null,
    failureMarkerGroup: null as THREE.Group | null,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotX: defaultMode === 'cutaway' ? 0.22 : 0.35,
    rotY: defaultMode === 'cutaway' ? -0.32 : -0.65,
    zoom: 7.2,
    fitZoom: 7.2,
    targetRotX: defaultMode === 'cutaway' ? 0.22 : 0.35,
    targetRotY: defaultMode === 'cutaway' ? -0.32 : -0.65,
    targetZoom: 7.2,
    explodedFactor: defaultMode === 'exploded' ? 1 : 0,
    targetExplodedFactor: defaultMode === 'exploded' ? 1 : 0,
    openFactor: defaultMode === 'open' ? 1 : 0,
    targetOpenFactor: defaultMode === 'open' ? 1 : 0,
    cutawayFactor: defaultMode === 'cutaway' ? 1 : 0,
    targetCutawayFactor: defaultMode === 'cutaway' ? 1 : 0,
    failurePulse: 0,
  });

  // Update target factors when viewMode changes for smooth 60fps interpolation
  useEffect(() => {
    const s = stateRef.current;
    if (viewMode === 'exploded') {
      s.targetExplodedFactor = 1.0;
      s.targetOpenFactor = 0.45;
      s.targetCutawayFactor = 0.0;
      s.targetRotX = 0.28;
      s.targetZoom = Math.min(10.5, s.fitZoom * 1.35);
    } else if (viewMode === 'cutaway') {
      s.targetExplodedFactor = 0.0;
      s.targetOpenFactor = 0.35;
      s.targetCutawayFactor = 1.0;
      s.targetRotX = 0.22;
      s.targetRotY = -0.32;
      s.targetZoom = s.fitZoom;
    } else if (viewMode === 'open') {
      s.targetExplodedFactor = 0.0;
      s.targetOpenFactor = 1.0;
      s.targetCutawayFactor = 0.0;
      s.targetRotX = 0.68;
      s.targetZoom = s.fitZoom * 0.95;
    } else {
      // Exterior view
      s.targetExplodedFactor = 0.0;
      s.targetOpenFactor = 0.0;
      s.targetCutawayFactor = 0.0;
      s.targetRotX = 0.35;
      s.targetZoom = s.fitZoom;
    }
    sound.click();
  }, [viewMode]);

  // Main Three.js initialization and rebuild on food or spec change
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAF9F5); // Warm cream studio background

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 7.2);
    camera.lookAt(0, 0, 0);

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

    // 4. Lighting - Refined 3-point studio lighting
    const ambientLight = new THREE.AmbientLight(0xFFFBF2, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFAF0, 1.8);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xE0F2FE, 0.7);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xFDE68A, 0.95);
    rimLight.position.set(2, -2, -5);
    scene.add(rimLight);

    // 5. Studio Pedestal / Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.55;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 6. Build Universal Food-Aware Package Assembly
    const assembly = buildPackageAssembly({
      foodId,
      spec,
      isV2,
      viewMode,
      cutawayFactor: viewMode === 'cutaway' ? 1.0 : 0.0,
      openFactor: viewMode === 'open' ? 1.0 : 0.0,
      explodedOffset: viewMode === 'exploded' ? 1.0 : 0.0,
    });
    scene.add(assembly.rootGroup);

    // Frame camera to fit the engineered assembly
    const totalBox = assembly.bounds.total;
    const totalSize = new THREE.Vector3();
    totalBox.getSize(totalSize);
    const maxDim = Math.max(totalSize.x, totalSize.y, totalSize.z);
    const fitZoom = Math.max(4.6, Math.min(8.2, maxDim * 2.2 + 1.8));
    stateRef.current.fitZoom = fitZoom;
    stateRef.current.targetZoom = fitZoom;
    stateRef.current.zoom = fitZoom;

    // 7. Failure Marker Group (clean, no unwanted sphere/ring artifacts)
    const failureMarkerGroup = new THREE.Group();
    assembly.rootGroup.add(failureMarkerGroup);

    // Save references in ref
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.assemblyResult = assembly;
    stateRef.current.rootGroup = assembly.rootGroup;
    stateRef.current.failureMarkerGroup = failureMarkerGroup;

    // 8. Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      // Auto rotation orbit
      if (autoRotate && !s.isDragging) {
        s.targetRotY += 0.0035;
      }

      // Smooth damping interpolation for camera orbit
      s.rotX += (s.targetRotX - s.rotX) * 0.1;
      s.rotY += (s.targetRotY - s.rotY) * 0.1;
      s.zoom += (s.targetZoom - s.zoom) * 0.1;

      // Smooth interpolation for exploded and cutaway factors
      s.explodedFactor += (s.targetExplodedFactor - s.explodedFactor) * 0.08;
      s.openFactor += (s.targetOpenFactor - s.openFactor) * 0.08;
      s.cutawayFactor += (s.targetCutawayFactor - s.cutawayFactor) * 0.08;

      // Update exploded offsets dynamically from base resting positions
      if (assembly) {
        const ef = s.explodedFactor;
        const bp = assembly.basePositions;
        if (assembly.secondaryGroup) {
          assembly.secondaryGroup.position.y = bp.secondaryY - ef * 1.05;
        }
        if (assembly.cushionGroup) {
          assembly.cushionGroup.position.y = bp.cushionY + ef * 0.40;
        }
        if (assembly.primaryGroup) {
          assembly.primaryGroup.position.y = bp.primaryY + ef * 1.25;
        }
        if (assembly.foodGroup) {
          assembly.foodGroup.position.y = bp.foodY + ef * 2.10 + Math.sin(time * 2.5) * (ef * 0.03);
        }
        if (assembly.lidGroup) {
          const baseLid = bp.lidY ?? (bp.secondaryY + 1.2);
          assembly.lidGroup.position.y = baseLid + ef * 2.95;
        }

        // Flaps rotation
        const flapLeft = assembly.lidGroup?.getObjectByName('flapLeft') as THREE.Mesh | undefined;
        const flapRight = assembly.lidGroup?.getObjectByName('flapRight') as THREE.Mesh | undefined;
        if (flapLeft && flapRight) {
          const flapAngle = s.openFactor * (Math.PI * 0.46) + (1 - s.openFactor) * (s.cutawayFactor * Math.PI * 0.18) + (ef * Math.PI * 0.15);
          flapLeft.rotation.z = flapAngle;
          flapRight.rotation.z = -flapAngle;
        }

        // Dynamic multi-layer cutaway transparency & render ordering
        const cf = s.cutawayFactor;
        const isCutawayActive = cf > 0.04;

        // 1. Food Payload: Solid, opaque, always prioritised in depth buffer
        if (assembly.foodGroup) {
          assembly.foodGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.renderOrder = 0;
              if (child.material) {
                const mat = child.material as THREE.MeshStandardMaterial;
                mat.depthWrite = true;
                mat.depthTest = true;
              }
            }
          });
        }

        // 2. Primary Packaging & Bio-Cradle Nest: Hide front rim/wall; frosted translucent sides
        if (assembly.primaryGroup) {
          assembly.primaryGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.renderOrder = 1;
              const mat = child.material as THREE.MeshStandardMaterial;
              if (child.name === 'frontRim' || child.name === 'frontWall') {
                if (isCutawayActive) {
                  mat.transparent = true;
                  mat.opacity = Math.max(0, 1.0 - cf * 1.15);
                  child.visible = mat.opacity > 0.02;
                } else {
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  child.visible = true;
                }
              } else {
                if (isCutawayActive) {
                  mat.transparent = true;
                  mat.opacity = Math.max(0.40, 1.0 - cf * 0.52);
                  mat.depthWrite = false;
                } else {
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  mat.depthWrite = true;
                }
              }
            }
          });
        }

        // 3. Cushioning & Isolation: Frosted translucent bed in cutaway
        if (assembly.cushionGroup) {
          assembly.cushionGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.renderOrder = 1;
              const mat = child.material as THREE.MeshStandardMaterial;
              if (isCutawayActive) {
                mat.transparent = true;
                mat.opacity = Math.max(0.45, 1.0 - cf * 0.50);
                mat.depthWrite = false;
              } else {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
              }
            }
          });
        }

        // 4. Secondary Outer Carton: Front wall fully hidden; side & back walls translucent
        if (assembly.secondaryGroup) {
          assembly.secondaryGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.renderOrder = 2;
              const mat = child.material as THREE.MeshStandardMaterial;
              if (child.name === 'frontWall') {
                if (isCutawayActive) {
                  mat.transparent = true;
                  mat.opacity = Math.max(0, 1.0 - cf * 1.05);
                  child.visible = mat.opacity > 0.01;
                } else {
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  child.visible = true;
                }
              } else if (child.name === 'boxWall') {
                if (isCutawayActive) {
                  mat.transparent = true;
                  mat.opacity = Math.max(0.30, 1.0 - cf * 0.70);
                  mat.depthWrite = false;
                } else {
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  mat.depthWrite = true;
                }
              } else if (child.name === 'bottomWall') {
                if (isCutawayActive) {
                  mat.transparent = true;
                  mat.opacity = Math.max(0.55, 1.0 - cf * 0.45);
                  mat.depthWrite = false;
                } else {
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  mat.depthWrite = true;
                }
              }
            }
          });
        }
      }

      // Orbit camera positioning
      const cy = Math.sin(s.rotX) * s.zoom;
      const horizDist = Math.cos(s.rotX) * s.zoom;
      const cx = Math.sin(s.rotY) * horizDist;
      const cz = Math.cos(s.rotY) * horizDist;

      camera.position.set(cx, cy, cz);
      camera.lookAt(0, -0.15, 0);

      // Failure marker pulse
      if (hasFailed && failureMarkerGroup.children.length > 0) {
        const pulse = 1 + Math.sin(time * 6) * 0.18;
        failureMarkerGroup.children[0].scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse & Touch Interaction
    const handleMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
      setAutoRotate(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.isDragging) return;
      const dx = e.clientX - s.prevMouseX;
      const dy = e.clientY - s.prevMouseY;
      s.targetRotY += dx * 0.008;
      s.targetRotX = Math.max(-1.2, Math.min(1.2, s.targetRotX + dy * 0.008));
      s.prevMouseX = e.clientX;
      s.prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      const s = stateRef.current;
      s.targetZoom = Math.max(4.5, Math.min(11, s.targetZoom + e.deltaY * 0.005));
    };

    const el = renderer.domElement;
    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('wheel', handleWheel, { passive: false });

    // Resize observer
    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
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
  }, [foodId, spec, isV2, hasFailed, interactive]);

  const packagingSystem = spec.packagingSystem;
  const primaryName = spec.primaryPackagingType || packagingSystem?.primaryPackaging?.type || (isV2 ? 'Molded Pulp Bio-Cradle Nest' : 'Form-Fitting Packaging Shell');
  const secondaryName = spec.secondaryPackagingType || packagingSystem?.secondaryPackaging?.type || (isV2 ? 'Double-Wall Micro-Flute Shipper Carton' : (spec.outerMaterial ? `${spec.outerMaterial} Shipper Carton` : 'Corrugated Shipper Box'));

  return (
    <div className={`relative w-full h-full select-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#FAF9F5] via-[#F6F4ED] to-[#ECE8DC] border border-stone-200/80 shadow-sm ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Mode Control Toolbar (Apple style glass bar) */}
      {interactive && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          {/* Packaging System Multi-Layer Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-stone-200 shadow-xs pointer-events-auto">
            {isV2 ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                V2 Certified System
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                V1 Prototype
              </span>
            )}
            <span className="text-stone-300">|</span>
            <span className="text-xs text-stone-700 font-medium truncate max-w-[240px]">
              {primaryName.split('with')[0].trim()}
            </span>
          </div>

          {/* Interactive Inspection Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md rounded-xl border border-stone-200/80 shadow-xs pointer-events-auto">
            <button
              onClick={() => setViewMode('normal')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'normal'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              Exterior
            </button>
            <button
              onClick={() => setViewMode('cutaway')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'cutaway'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Scissors className="w-3 h-3" />
              Cutaway
            </button>
            <button
              onClick={() => setViewMode('exploded')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'exploded'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Layers className="w-3 h-3" />
              Exploded View
            </button>
            <button
              onClick={() => setViewMode('open')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'open'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Eye className="w-3 h-3" />
              Open
            </button>
          </div>
        </div>
      )}

      {/* Floating Exploded Architecture Stack HUD */}
      {interactive && viewMode === 'exploded' && (
        <div className="absolute top-16 left-4 z-10 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-md flex flex-col gap-1.5 animate-fade-in pointer-events-none max-w-[280px]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-semibold flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-emerald-700" />
            Exploded Assembly Layers
          </span>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-2 text-stone-700">
              <span className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center text-[9px] font-mono font-bold text-stone-600">5</span>
              <span className="truncate">Top Flaps & Shipper Lid</span>
            </div>
            <div className="flex items-center gap-2 text-stone-900 font-semibold">
              <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[9px] font-mono font-bold">4</span>
              <span className="truncate">Solid Food Payload</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px] font-mono font-bold">3</span>
              <span className="truncate">{primaryName.split('with')[0].trim()}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-800 font-semibold">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[9px] font-mono font-bold">2</span>
              <span className="truncate">{spec.cushionMaterial} ({spec.supportType})</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600 font-medium">
              <span className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center text-[9px] font-mono font-bold text-stone-600">1</span>
              <span className="truncate">{secondaryName.split('with')[0].trim()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Component Architecture Footer Hint */}
      {interactive && (
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-stone-500 pointer-events-none z-10">
          <div className="flex items-center gap-2 bg-white/85 backdrop-blur-xs px-3 py-1 rounded-full border border-stone-200/60 shadow-2xs">
            <span className="font-semibold text-emerald-800">Primary:</span>
            <span className="text-stone-700 truncate max-w-[140px]">{primaryName.split('with')[0].trim()}</span>
            <span>·</span>
            <span className="font-semibold text-amber-800">Cushion:</span>
            <span className="text-stone-700 truncate max-w-[140px]">{spec.cushionMaterial}</span>
            <span>·</span>
            <span className="font-semibold text-stone-700">Secondary:</span>
            <span className="text-stone-600 truncate max-w-[150px]">{secondaryName.split('with')[0].trim()}</span>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-stone-200/60 pointer-events-auto hover:bg-white text-stone-600 cursor-pointer shadow-2xs"
          >
            <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Orbiting' : 'Paused'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
