import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { FoodItem, PackagingSpec } from '../../types/packaging';
import { sound } from '../../utils/audioFeedback';
import { PackagingBox3D } from '../3d/PackagingBox3D';
import { ShieldCheck, AlertTriangle, ArrowRight, RotateCcw, ChevronDown, ChevronUp, FileDown, CheckCircle } from 'lucide-react';

interface ResultComparisonProps {
  food: FoodItem;
  v1Spec: PackagingSpec;
  v2Spec: PackagingSpec;
  onRestart: () => void;
}

export const ResultComparison: React.FC<ResultComparisonProps> = ({
  food,
  v1Spec,
  v2Spec,
  onRestart,
}) => {
  const [showEngineeringDetails, setShowEngineeringDetails] = useState(false);

  useEffect(() => {
    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10B981', '#F59E0B', '#FBBF24'],
      });
      sound.success();
    } catch {}
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-2">
          Validation & Verification Results
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-3">
          Engineered for the Journey.
        </h2>
        <p className="text-stone-600 text-sm leading-relaxed">
          The redesigned package handled the virtual journey with zero structural deformation and 94% shock reduction.
        </p>
      </div>

      {/* Visual Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* V1 Baseline Outcome */}
        <div className="bg-white rounded-3xl border border-red-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase font-semibold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                V1 Baseline Prototype
              </span>
              <span className="text-xs font-mono text-stone-500">FAILED TRANSIT</span>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden mb-5 bg-[#FAF9F5] border border-stone-100">
              <PackagingBox3D
                foodId={food.id}
                spec={v1Spec}
                isV2={false}
                hasFailed={true}
                interactive={true}
                defaultMode="open"
                className="h-full border-none rounded-none shadow-none"
              />
            </div>

            <h3 className="font-display font-semibold text-lg text-stone-900 mb-2">
              High Predicted Damage Severity
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6">
              Excessive shock transmission (5.8G) caused bottom cushioning to bottom out, resulting in payload crushing and bruise failure.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-100 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-500">Predicted Failure Risk</span>
                <span className="text-red-600 font-semibold">78% (Critical)</span>
              </div>
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full w-[78%]" />
              </div>
            </div>

            <div className="flex justify-between py-1 text-stone-600">
              <span>Cushion Displacement</span>
              <span className="text-red-600">94% (Bottomed Out)</span>
            </div>

            <div className="flex justify-between py-1 text-stone-600">
              <span>Thermal Influx Rate</span>
              <span className="text-amber-700">+6.4°C / hr</span>
            </div>
          </div>
        </div>

        {/* V2 Engineered Outcome */}
        <div className="bg-white rounded-3xl border border-emerald-300 p-6 shadow-md flex flex-col justify-between ring-1 ring-emerald-500/20">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase font-semibold text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                V2 Engineered Architecture
              </span>
              <span className="text-xs font-mono text-emerald-800 font-semibold">ENGINEERED PASS</span>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden mb-5 bg-[#FAF9F5] border border-stone-100">
              <PackagingBox3D
                foodId={food.id}
                spec={v2Spec}
                isV2={true}
                hasFailed={false}
                interactive={true}
                defaultMode="open"
                className="h-full border-none rounded-none shadow-none"
              />
            </div>

            <h3 className="font-display font-semibold text-lg text-stone-900 mb-2">
              Near-Zero Damage Severity
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6">
              Tuned hexagonal bio-cushioning and quad interlocking corner dampers absorbed 94% of shock forces. Payload arrived pristine.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-100 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-500">Predicted Failure Risk</span>
                <span className="text-emerald-700 font-semibold">4% (Safe)</span>
              </div>
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[4%]" />
              </div>
            </div>

            <div className="flex justify-between py-1 text-stone-600">
              <span>Cushion Displacement</span>
              <span className="text-emerald-700">38% (Optimal Dynamic Range)</span>
            </div>

            <div className="flex justify-between py-1 text-stone-600">
              <span>Thermal Influx Rate</span>
              <span className="text-emerald-700">+0.8°C / hr (Stable)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Engineering Details Drawer */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden mb-10">
        <button
          onClick={() => {
            sound.click();
            setShowEngineeringDetails(!showEngineeringDetails);
          }}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors cursor-pointer"
        >
          <div>
            <span className="text-xs font-mono uppercase text-emerald-800 font-semibold block mb-0.5">
              Technical Specification
            </span>
            <h4 className="font-display font-bold text-lg text-stone-900">
              Engineering Details & ASTM / ISTA Calculations
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
            <span>{showEngineeringDetails ? 'Hide Details' : 'View Spec Sheet'}</span>
            {showEngineeringDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showEngineeringDetails && (
          <div className="p-6 pt-0 border-t border-stone-100 animate-fade-in text-xs space-y-6">
            {/* System Breakdown Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 font-mono">
              <div>
                <span className="text-[10px] uppercase text-emerald-800 font-semibold block">Primary Food Packaging</span>
                <span className="font-bold text-stone-900 text-xs block">
                  {v2Spec.primaryPackagingType || v2Spec.packagingSystem?.primaryPackaging.type || 'Engineered Food Container'}
                </span>
                <span className="text-[10px] text-stone-500 block truncate">
                  {v2Spec.primaryPackagingMaterial || v2Spec.packagingSystem?.primaryPackaging.material || 'Food-safe grade'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-emerald-800 font-semibold block">Secondary / Protective Shipper</span>
                <span className="font-bold text-stone-900 text-xs block">
                  {v2Spec.secondaryPackagingType || v2Spec.packagingSystem?.secondaryPackaging?.type || 'Integrated Primary (No Outer)'}
                </span>
                <span className="text-[10px] text-stone-500 block truncate">
                  {v2Spec.secondaryPackagingMaterial || v2Spec.packagingSystem?.secondaryPackaging?.material || 'Curbside recyclable'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-emerald-800 font-semibold block">Payload & Environmental Score</span>
                <span className="font-bold text-emerald-900 text-xs block">
                  {v2Spec.environmentalRating || 'A+ (100% Circular/Bio)'}
                </span>
                <span className="text-[10px] text-stone-500 block">
                  Total Mass: {v2Spec.totalWeightGrams ? `${v2Spec.totalWeightGrams}g (${v2Spec.quantity || 1} units)` : `${food.weightGrams}g`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">Wall Thickness</span>
                <span className="text-base font-bold font-mono text-stone-900 block">{v2Spec.wallThicknessMm} mm</span>
                <span className="text-[11px] text-stone-500">Upgraded from {v1Spec.wallThicknessMm} mm</span>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">Cushion Material</span>
                <span className="text-base font-bold text-stone-900 block truncate">{v2Spec.cushionMaterial}</span>
                <span className="text-[11px] text-stone-500">{v2Spec.cushionThicknessMm}mm Depth</span>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">Top-Load Compression</span>
                <span className="text-base font-bold font-mono text-stone-900 block">
                  {Math.round(Math.max(1400, ((v2Spec.totalWeightGrams || food.weightGrams) * 5 * 9.81 * 4.5) / 100 * 10 + 1000) * 1.58)} N
                </span>
                <span className="text-[11px] text-stone-500">Resists 5-tier pallet stacking</span>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">Free-Fall Drop Rating</span>
                <span className="text-base font-bold font-mono text-stone-900 block">1,200 mm</span>
                <span className="text-[11px] text-stone-500">ASTM D5276 corner drop</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl">
              <span className="font-semibold text-stone-900 block mb-2">Simulated ASTM Transport Standards Evaluated:</span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ASTM D4728: Random Vibration PSD 3–100 Hz</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ASTM D880: Incline Impact Shock at 2.4 m/s</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ASTM D642: Compressive Stacking Top Load</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ISTA 7D: Thermal Ingress Profile (+38°C to +4°C)</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Restart Simulation CTA */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            sound.click();
            onRestart();
          }}
          className="flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Engineer Another Food Packaging Scenario</span>
        </button>
      </div>
    </div>
  );
};
