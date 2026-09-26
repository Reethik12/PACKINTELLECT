import React, { useState } from 'react';
import { FoodItem, PackagingSpec } from '../../types/packaging';
import { PackagingBox3D } from './PackagingBox3D';
import { sound } from '../../utils/audioFeedback';
import { Sliders, ShieldCheck, Sparkles, ArrowRight, Layers, Eye, Scissors, RotateCcw } from 'lucide-react';

interface PackagingStudioProps {
  food: FoodItem;
  spec: PackagingSpec;
  isV2?: boolean;
  onUpdateSpec: (newSpec: PackagingSpec) => void;
  onLaunchJourney: () => void;
}

export const PackagingStudio: React.FC<PackagingStudioProps> = ({
  food,
  spec,
  isV2 = false,
  onUpdateSpec,
  onLaunchJourney,
}) => {
  const [showConfig, setShowConfig] = useState(false);

  const handleWallChange = (val: number) => {
    onUpdateSpec({ ...spec, wallThicknessMm: val });
  };

  const handleCushionChange = (val: number) => {
    onUpdateSpec({ ...spec, cushionThicknessMm: val });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-1">
            Step 02 · 3D Structural Inspection
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            {food.name} inside {isV2 ? 'V2 Engineered Package' : 'V1 Baseline Package'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.click();
              setShowConfig(!showConfig);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Hide Parameters' : 'Adjust Spec'}</span>
          </button>

          <button
            onClick={() => {
              sound.click();
              onLaunchJourney();
            }}
            className="flex items-center gap-2 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium shadow-md transition-all active:scale-95"
          >
            <span>Launch Simulated Journey</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Box Area */}
      <div className="h-[520px] w-full relative">
        <PackagingBox3D
          foodId={food.id}
          spec={spec}
          isV2={isV2}
          interactive={true}
          defaultMode="cutaway"
          className="h-full"
        />
      </div>

      {/* Parameter Adjustment Drawer (Dynamic Data-Driven 3D Controls) */}
      {showConfig && (
        <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase text-emerald-800 font-semibold">
              Live Data-Driven Parametric Adjustments
            </span>
            <span className="text-xs text-stone-500">
              The 3D model geometry rescales in real time.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wall Thickness Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-stone-700 mb-1.5">
                <span>Corrugated Outer Wall Thickness</span>
                <span className="font-semibold text-stone-900">{spec.wallThicknessMm} mm</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="12.0"
                step="0.5"
                value={spec.wallThicknessMm}
                onChange={(e) => handleWallChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Standard single-wall: 3-5mm · Double-wall micro-flute: 7-9mm · Quad-wall: 10-12mm
              </span>
            </div>

            {/* Cushion Thickness Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-stone-700 mb-1.5">
                <span>Protective Cushioning Depth</span>
                <span className="font-semibold text-stone-900">{spec.cushionThicknessMm} mm</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="35.0"
                step="1.0"
                value={spec.cushionThicknessMm}
                onChange={(e) => handleCushionChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Minimal liner: 10-15mm · Engineered cellular honeycomb: 22-28mm · Extreme suspension: 30-35mm
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Anatomy & Packaging System Explanation Footnote */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
        <div className="p-4 bg-white/80 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900 block text-xs">
              01. Primary Packaging
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Food Contact
            </span>
          </div>
          <span className="font-medium text-stone-800 text-[11px] block">
            {spec.primaryPackagingType || spec.packagingSystem?.primaryPackaging.type || 'Contoured Food-Grade Shell'}
          </span>
          <p className="text-stone-500 leading-relaxed text-[11px]">
            {spec.primaryPackagingMaterial || spec.packagingSystem?.primaryPackaging.material || spec.outerMaterial}
          </p>
        </div>

        <div className="p-4 bg-white/80 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900 block text-xs">
              02. Secondary / Protective Shell
            </span>
            <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200/80">
              Freight
            </span>
          </div>
          <span className="font-medium text-stone-800 text-[11px] block">
            {spec.secondaryPackagingType || spec.packagingSystem?.secondaryPackaging?.type || (isV2 ? 'Double-Wall Micro-Flute Shipper Carton' : 'Corrugated Shipper Carton')}
          </span>
          <p className="text-stone-500 leading-relaxed text-[11px]">
            {spec.secondaryPackagingMaterial || spec.packagingSystem?.secondaryPackaging?.material || (isV2 ? 'Moisture-Resistant Micro-Flute Corrugated Board' : 'Standard Kraft Corrugated Board')}
          </p>
        </div>

        <div className="p-4 bg-white/80 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900 block text-xs">
              03. Cushioning & Isolation
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {spec.cushionThicknessMm} mm Depth
            </span>
          </div>
          <span className="font-medium text-stone-800 text-[11px] block">
            {spec.cushionMaterial} ({spec.supportType})
          </span>
          <p className="text-stone-500 leading-relaxed text-[11px]">
            Calibrated damping ({spec.dampingCoeff}) absorbs {spec.impactAbsorptionJoules} Joules of kinetic impact shock.
          </p>
        </div>
      </div>
    </div>
  );
};
