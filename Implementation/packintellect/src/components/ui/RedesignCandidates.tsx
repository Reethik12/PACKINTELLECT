import React, { useState, useMemo } from 'react';
import { FoodId, RedesignCandidate } from '../../types/packaging';
import { FoodQuantitySpec } from '../../types/foodKnowledge';
import { foodKnowledgeService } from '../../services/foodKnowledgeService';
import { PackagingBox3D } from '../3d/PackagingBox3D';
import { sound } from '../../utils/audioFeedback';
import { Sparkles, Scan, CheckCircle2, ArrowRight, ShieldCheck, Leaf } from 'lucide-react';

interface RedesignCandidatesProps {
  foodId: FoodId;
  quantitySpec?: FoodQuantitySpec;
  selectedCandidateId: string;
  onSelectCandidate: (candidate: RedesignCandidate) => void;
  onProceedToTransform: () => void;
}

export const RedesignCandidates: React.FC<RedesignCandidatesProps> = ({
  foodId,
  quantitySpec,
  selectedCandidateId,
  onSelectCandidate,
  onProceedToTransform,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const candidates = useMemo(() => {
    return foodKnowledgeService.getRedesignCandidates(foodId, quantitySpec);
  }, [foodId, quantitySpec]);

  const runEvaluationScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    sound.scan();

    let p = 0;
    const interval = setInterval(() => {
      p += 4;
      setScanProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        // Automatically select the recommended Candidate C
        const recommended = candidates.find((c) => c.isRecommended) || candidates[2];
        onSelectCandidate(recommended);
        sound.success();
      }
    }, 40);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-2">
          Step 03 · Multi-Objective Redesign
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-3">
          Evaluating 3 Structural Alternatives
        </h2>
        <p className="text-stone-600 text-sm leading-relaxed">
          Comparing physical structural designs to absorb road vibrations and impact shock without excessive tare weight.
        </p>
      </div>

      {/* Evaluation Scan Trigger Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-900 block">
              FEA Finite Element Stress & Drop Scanner
            </span>
            <span className="text-xs text-stone-500">
              Evaluates cushioning response, acceleration curves, and structural transit compliance.
            </span>
          </div>
        </div>

        <button
          onClick={runEvaluationScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-medium shadow-xs transition-transform active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isScanning ? `Evaluating Designs (${scanProgress}%)...` : 'Run Evaluation Scan'}</span>
        </button>
      </div>

      {/* 3 Real 3D Candidate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 relative">
        {/* Laser Scanning Line Overlay during evaluation */}
        {isScanning && (
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 shadow-[0_0_15px_#10B981] z-30 pointer-events-none transition-all duration-75"
            style={{ top: `${scanProgress}%` }}
          />
        )}

        {candidates.map((candidate) => {
          const isSelected = candidate.id === selectedCandidateId;
          return (
            <div
              key={candidate.id}
              onClick={() => {
                sound.click();
                onSelectCandidate(candidate);
              }}
              className={`flex flex-col rounded-3xl border transition-all overflow-hidden cursor-pointer bg-white relative ${
                isSelected
                  ? 'border-emerald-700 ring-2 ring-emerald-700/20 shadow-lg'
                  : 'border-stone-200/90 hover:border-stone-400 hover:shadow-md'
              }`}
            >
              {/* Recommended Ribbon */}
              {candidate.isRecommended && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-1 bg-emerald-700 text-white text-[11px] font-semibold rounded-full shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                  <span>AI Recommended V2</span>
                </div>
              )}

              {/* Real 3D Interactive Model Preview for each candidate */}
              <div className="h-64 w-full relative bg-[#F7F5EE]">
                <PackagingBox3D
                  foodId={foodId}
                  spec={candidate.spec}
                  isV2={candidate.isRecommended}
                  interactive={false}
                  defaultMode="cutaway"
                  className="rounded-none border-none shadow-none"
                />
              </div>

              {/* Candidate Info & Specs */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-stone-500 uppercase">{candidate.code}</span>
                    <span className="text-[11px] font-medium text-emerald-800">{candidate.focus}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-stone-900 mb-2">
                    {candidate.name}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    {candidate.description}
                  </p>
                </div>

                {/* Score Indicators */}
                <div className="space-y-2 pt-4 border-t border-stone-100">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-stone-500">Shock Attenuation</span>
                      <span className="font-semibold text-stone-900">{candidate.shockAbsorptionPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${candidate.shockAbsorptionPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-stone-500">Eco Recyclability</span>
                      <span className="font-semibold text-stone-900">{candidate.ecoScorePct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-700 rounded-full"
                        style={{ width: `${candidate.ecoScorePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-stone-500">
                    <span>Wall: {candidate.spec.wallThicknessMm}mm</span>
                    <span>Cushion: {candidate.spec.cushionThicknessMm}mm</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Proceed Action */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            sound.click();
            onProceedToTransform();
          }}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          <span>Apply Selected Architecture to V1 → V2 Physical Transformation</span>
          <ArrowRight className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
