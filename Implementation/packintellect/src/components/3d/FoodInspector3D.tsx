import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FoodId, FoodItem } from '../../types/packaging';
import { buildPackageAssembly, PackageAssemblyResult } from './PackageAssemblyEngine';
import { foodKnowledgeService } from '../../services/foodKnowledgeService';
import { sound } from '../../utils/audioFeedback';
import { Eye, Box, RotateCw, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface FoodInspector3DProps {
  food: FoodItem;
  className?: string;
}

export type InspectionViewMode = 'translucent' | 'solo' | 'solid';

export const FoodInspector3D: React.FC<FoodInspector3DProps> = ({ food, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<InspectionViewMode>('translucent');
  const [autoRotate, setAutoRotate] = useState(true);

  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    assembly: null as PackageAssemblyResult | null,
    initialFoodRestingY: 0,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotX: 0.28,
    rotY: -0.45,
    zoom: 6.2,
    targetRotX: 0.28,
    targetRotY: -0.45,
    targetZoom: 6.2,
    viewMode: 'translucent' as InspectionViewMode,
  });

  // Keep ref in sync with current viewMode
  useEffect(() => {
    stateRef.current.viewMode = viewMode;
    const s = stateRef.current;
    if (s.assembly) {
      applyViewModeStyles(s.assembly, viewMode, s.initialFoodRestingY);
    }
    sound.click();
  }, [viewMode]);

  // Helper to switch materials between Translucent X-Ray, Solid Opaque, and Food Solo
  const applyViewModeStyles = (
    assembly: PackageAssemblyResult,
    mode: InspectionViewMode,
    restingY: number
  ) => {
    const isTranslucent = mode === 'translucent';
    const isSolo = mode === 'solo';

    // 1. Food visibility and placement
    assembly.foodGroup.visible = true;
    assembly.foodGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.renderOrder = 0; // Opaque food renders first with depth
        if (child.material) {
          (child.material as THREE.Material).depthWrite = true;
        }
      }
    });

    if (isSolo) {
      assembly.foodGroup.position.set(0, 0, 0);
      assembly.primaryGroup.visible = false;
      assembly.secondaryGroup.visible = false;
      assembly.cushionGroup.visible = false;
      return;
    }

    // When showing package (translucent or solid), lock food to interior cavity floor
    assembly.foodGroup.position.set(0, restingY, 0);
    assembly.primaryGroup.visible = true;
    assembly.secondaryGroup.visible = true;
    assembly.cushionGroup.visible = true;

    // 2. Style container packaging (primary + secondary)
    const packageGroups = [assembly.primaryGroup, assembly.secondaryGroup];
    packageGroups.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Backup original opaque material on first encounter
          if (!child.userData.origMaterial) {
            child.userData.origMaterial = child.material;
          }

          if (isTranslucent) {
            const origColor = (child.userData.origMaterial as any)?.color
              ? (child.userData.origMaterial as any).color.clone()
              : new THREE.Color(0xD4C4AB);

            // Create crystal-clear translucent frosted engineering ghost material
            child.material = new THREE.MeshStandardMaterial({
              color: origColor,
              transparent: true,
              opacity: 0.36,
              roughness: 0.28,
              metalness: 0.05,
              depthWrite: false, // Prevents occluding inner food & cushioning!
              side: THREE.DoubleSide,
            });
            child.renderOrder = 2; // Renders after solid food

            // Create crisp structural edge outline wireframe
            if (!child.userData.edgeLines && child.geometry) {
              try {
                const edgeGeo = new THREE.EdgesGeometry(child.geometry, 22);
                const edgeMat = new THREE.LineBasicMaterial({
                  color: 0x44403C, // Crisp stone-700 structural outline
                  transparent: true,
                  opacity: 0.75,
                  depthWrite: false,
                });
                const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
                edgeLines.renderOrder = 3;
                child.add(edgeLines);
                child.userData.edgeLines = edgeLines;
              } catch {
                // Ignore unsupported non-indexed geometries
              }
            }
            if (child.userData.edgeLines) {
              child.userData.edgeLines.visible = true;
            }
          } else {
            // Restore solid opaque material
            if (child.userData.origMaterial) {
              child.material = child.userData.origMaterial;
              child.renderOrder = 0;
            }
            if (child.userData.edgeLines) {
              child.userData.edgeLines.visible = false;
            }
          }
        }
      });
    });

    // 3. Style cushioning group (semi-opaque inlay)
    assembly.cushionGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.origMaterial) {
          child.userData.origMaterial = child.material;
        }
        if (isTranslucent) {
          const origColor = (child.userData.origMaterial as any)?.color
            ? (child.userData.origMaterial as any).color.clone()
            : new THREE.Color(0x94A3B8);

          child.material = new THREE.MeshStandardMaterial({
            color: origColor,
            transparent: true,
            opacity: 0.72,
            roughness: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          child.renderOrder = 1;
        } else {
          if (child.userData.origMaterial) {
            child.material = child.userData.origMaterial;
            child.renderOrder = 0;
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAF9F5);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 6.2);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xFFFBF2, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFAF0, 1.9);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xDCE7FE, 0.65);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    // Subtle Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.14 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.35;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 5. Build True Physical Package Assembly using Engine
    const specs = foodKnowledgeService.getPackagingSpecs(food.id);
    const assembly = buildPackageAssembly({
      foodId: food.id,
      spec: specs.v1,
      isV2: false,
      viewMode: 'normal',
    });

    scene.add(assembly.rootGroup);

    // Record the exact resting height calculated by the engine for interior seating
    const initialFoodRestingY = assembly.foodGroup.position.y;

    // Apply active viewMode style
    applyViewModeStyles(assembly, viewMode, initialFoodRestingY);

    // Frame camera to fit the full assembly
    const totalBox = assembly.bounds.total;
    const totalSize = new THREE.Vector3();
    totalBox.getSize(totalSize);
    const maxDim = Math.max(totalSize.x, totalSize.y, totalSize.z);
    const fitZoom = Math.max(4.5, Math.min(8.5, maxDim * 2.2 + 1.2));
    stateRef.current.targetZoom = fitZoom;
    stateRef.current.zoom = fitZoom;

    // Save references
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.assembly = assembly;
    stateRef.current.initialFoodRestingY = initialFoodRestingY;

    // Animation Loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      // Auto-rotation when not dragging
      if (autoRotate && !s.isDragging) {
        s.targetRotY += 0.005;
      }
      s.rotX += (s.targetRotX - s.rotX) * 0.1;
      s.rotY += (s.targetRotY - s.rotY) * 0.1;
      s.zoom += (s.targetZoom - s.zoom) * 0.1;

      assembly.rootGroup.rotation.x = s.rotX;
      assembly.rootGroup.rotation.y = s.rotY;

      camera.position.set(0, 0.9, s.zoom);
      camera.lookAt(0, 0, 0);

      // In Food Solo mode, apply subtle organic floating hover
      if (s.viewMode === 'solo') {
        assembly.foodGroup.position.y = Math.sin(time * 2) * 0.04;
      } else {
        // In Package Fit (Translucent or Solid), keep food securely resting inside the cavity!
        assembly.foodGroup.position.y = s.initialFoodRestingY;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse Interaction
    const handleMouseDown = (e: MouseEvent) => {
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
      s.targetRotX = Math.max(-0.8, Math.min(1.1, s.targetRotX + dy * 0.008));
      s.prevMouseX = e.clientX;
      s.prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      s.targetZoom = Math.max(3.6, Math.min(9.5, s.targetZoom + e.deltaY * 0.005));
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
  }, [food.id]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#FAF9F5] via-[#F6F4ED] to-[#ECE8DC] border border-stone-200/90 shadow-sm ${className}`}>
      {/* 3D Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-stone-200 shadow-xs pointer-events-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-stone-900">{food.name}</span>
          <span className="text-stone-300">·</span>
          <span className="text-xs font-mono text-stone-500">{food.weightGrams}g</span>
        </div>

        {/* 3-State Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md rounded-xl border border-stone-200 shadow-xs pointer-events-auto">
          <button
            onClick={() => setViewMode('solo')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'solo' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Inspect food product geometry by itself"
          >
            <Eye className="w-3 h-3" />
            <span>Food Solo</span>
          </button>

          <button
            onClick={() => setViewMode('translucent')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'translucent' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Translucent X-Ray inspection of food seated inside packaging"
          >
            <Layers className="w-3 h-3" />
            <span>Translucent Fit</span>
          </button>

          <button
            onClick={() => setViewMode('solid')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'solid' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="View external finished opaque container"
          >
            <Box className="w-3 h-3" />
            <span>Solid Box</span>
          </button>
        </div>
      </div>

      {/* Translucent Disclaimer / Clarification Pill */}
      {viewMode === 'translucent' && (
        <div className="absolute top-14 left-4 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 backdrop-blur-md rounded-full text-[10.5px] font-mono text-emerald-200 border border-emerald-500/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Translucent X-Ray Preview · Actual Specification: 100% Opaque Material</span>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Strip */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-stone-600 pointer-events-none">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-stone-200/70 shadow-xs pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-[11px] text-stone-700">
              {viewMode === 'solo'
                ? 'Morphology & Surface Integrity'
                : 'Snug Fit · Rested on Interior Base'}
            </span>
          </div>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-mono text-[11px]">Center of Gravity: Centered</span>
          </div>
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="flex items-center gap-1 px-2.5 py-1 bg-white/80 backdrop-blur-md rounded-lg border border-stone-200/80 pointer-events-auto hover:bg-white text-stone-600 cursor-pointer"
        >
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="text-[11px]">{autoRotate ? 'Orbit On' : 'Paused'}</span>
        </button>
      </div>
    </div>
  );
};
