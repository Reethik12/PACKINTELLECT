import React from 'react';
import { FoodItem } from '../../types/packaging';
import { sound } from '../../utils/audioFeedback';
import { AlertOctagon, ArrowRight, ShieldAlert, Wrench } from 'lucide-react';

interface FailureModalProps {
  food: FoodItem;
  onInitiateRedesign: () => void;
  onDismiss: () => void;
}

export const FailureModal: React.FC<FailureModalProps> = ({
  food,
  onInitiateRedesign,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F5] max-w-lg w-full rounded-3xl border border-red-200/80 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle red emergency pulse banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider font-semibold text-red-700 block">
              Simulation Failure Event
            </span>
            <h3 className="font-display font-bold text-2xl text-stone-900">
              Something went wrong.
            </h3>
          </div>
        </div>

        <p className="text-stone-700 text-sm leading-relaxed mb-6 font-medium">
          The baseline V1 packaging was unable to protect the <span className="text-stone-950 font-bold">{food.name}</span> during the simulated road journey.
        </p>

        {/* Failure Breakdown Cards */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 bg-white rounded-xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-900 mb-1">
              <span>Failure Zone</span>
              <span className="text-red-600 font-mono">Corner Impact & Cushion Crush</span>
            </div>
            <p className="text-xs text-stone-500 leading-snug">
              Open-cell foam liner bottomed out under 5.8G deceleration shock, transmitting destructive impulse directly into the payload.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-900 mb-1">
              <span>Food Impact</span>
              <span className="text-amber-700 font-mono">{food.criticalFailureMode}</span>
            </div>
            <p className="text-xs text-stone-500 leading-snug">
              Permanent deformation and bruising verified. Payload integrity compromised before destination arrival.
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50/80 border border-amber-200/70 rounded-2xl mb-6">
          <span className="text-xs font-semibold text-amber-900 block mb-1">
            Engineering Assessment
          </span>
          <p className="text-xs text-amber-800 leading-relaxed">
            The package needs more protection: thicker micro-flute walls, high-density cellular honeycomb cushioning, and quad corner damping struts.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => {
              sound.click();
              onDismiss();
            }}
            className="px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
          >
            Inspect Failure in 3D
          </button>

          <button
            onClick={() => {
              sound.click();
              onInitiateRedesign();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium shadow-md transition-all active:scale-95"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Let's Redesign It</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
