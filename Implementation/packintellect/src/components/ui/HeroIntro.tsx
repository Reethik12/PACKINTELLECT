import React from 'react';
import { FoodId, FoodItem } from '../../types/packaging';
import { sound } from '../../utils/audioFeedback';
import { ArrowRight, Sparkles, ShieldCheck, Activity, Leaf, Truck, Box, ArrowUpRight, Gauge } from 'lucide-react';

interface HeroIntroProps {
  selectedFood: FoodItem;
  onSelectFoodId: (id: FoodId) => void;
  onStartEngineering: () => void;
  onEnterLab: () => void;
  onLaunchJourney?: () => void;
}

export const HeroIntro: React.FC<HeroIntroProps> = ({
  selectedFood,
  onSelectFoodId,
  onStartEngineering,
  onEnterLab,
  onLaunchJourney,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-4 pb-20 flex flex-col gap-12 sm:gap-16">
      {/* Hero Typography & Tagline */}
      <div className="min-h-[46vh] sm:min-h-[50vh] flex flex-col items-center justify-center text-center max-w-5xl mx-auto space-y-6 py-10 sm:py-12">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-xs font-mono font-semibold tracking-wider text-emerald-900 uppercase shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Autonomous Packaging Intelligence</span>
          <span aria-hidden="true" className="text-emerald-300">·</span>
          <span>Physics-Grade Transit Simulator</span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-[82px] font-display font-black text-stone-900 tracking-tight leading-[1.04] text-balance">
          Don't just recommend packaging.{' '}
          <span className="text-emerald-800">Engineer it.</span>
        </h1>

        <p className="text-stone-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed text-balance pt-1">
          Place real food into dynamic 3D packaging, simulate real-world road transit hazards, discover catastrophic failure zones, and morph into an engineered protective structure.
        </p>

        {/* Engineering Pillars & Value Propositions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Physics-Driven Spatial Fit</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-semibold shadow-2xs">
            <Activity className="w-4 h-4 text-amber-700" />
            <span>Real-World Road Transit Testing</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50/90 border border-teal-200/80 text-teal-900 text-xs font-semibold shadow-2xs">
            <Leaf className="w-4 h-4 text-teal-700" />
            <span>100% Bio-Circular Materials</span>
          </div>
        </div>

        {/* Active Demonstration Payload Badge */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 text-xs text-stone-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-stone-400 uppercase text-[10px]">Loaded Simulation:</span>
            <span className="font-semibold text-stone-900">{selectedFood.name}</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500">{selectedFood.category}</span>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => {
                sound.click();
                onStartEngineering();
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline underline-offset-2 transition-colors ml-1"
            >
              Browse Full Catalog →
            </button>
          </div>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              sound.click();
              onStartEngineering();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Start Engineering Experience</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onLaunchJourney && (
            <button
              onClick={() => {
                sound.click();
                onLaunchJourney();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Truck className="w-4 h-4 text-emerald-200" />
              <span>Simulate Transit Journey</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.click();
              onEnterLab();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-medium text-sm rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <span>Launch Virtual Test Lab</span>
          </button>
        </div>
      </div>

      {/* Feature Capabilities Grid (Replaces the inline truck with dedicated platform modules) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: In-Transit Truck Logistics */}
        <div 
          onClick={() => {
            sound.click();
            onLaunchJourney ? onLaunchJourney() : onStartEngineering();
          }}
          className="group relative p-8 bg-white/90 hover:bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-900 font-mono text-[10px] font-semibold uppercase mb-2">
                Real Transport Road Simulator
              </div>
              <h3 className="font-display font-bold text-xl text-stone-900 group-hover:text-amber-800 transition-colors">
                Dynamic In-Transit Journey
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mt-1">
                Real vehicular kinematics, highway potholes, cornering centrifugal drift, and interior cargo cutaway inspecting live product stress.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <span>Explore Vehicle Simulation</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Module 2: ASTM / ISTA Test Lab */}
        <div 
          onClick={() => {
            sound.click();
            onEnterLab();
          }}
          className="group relative p-8 bg-white/90 hover:bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 font-mono text-[10px] font-semibold uppercase mb-2">
                6 ASTM/ISTA Profiles
              </div>
              <h3 className="font-display font-bold text-xl text-stone-900 group-hover:text-emerald-800 transition-colors">
                Virtual Test Lab
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mt-1">
                Random vibration sweeps (ASTM D4728), 1.2m corner drops (ASTM D5276), and dynamic compression stacking loads up to 3,500 N.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <span>Launch Stress Testing</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Module 3: 3D Packaging Engineering Studio */}
        <div 
          onClick={() => {
            sound.click();
            onStartEngineering();
          }}
          className="group relative p-8 bg-white/90 hover:bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 group-hover:scale-110 transition-transform">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-100/70 text-teal-900 font-mono text-[10px] font-semibold uppercase mb-2">
                Autonomous AI Redesign
              </div>
              <h3 className="font-display font-bold text-xl text-stone-900 group-hover:text-teal-800 transition-colors">
                3D Packaging Studio
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mt-1">
                Food-specific inserts, molded pulp egg-crates, ventilated corrugated boxes, and bio-honeycomb cushioning engineered to prevent failure.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-teal-800">
            <span>Configure Packaging Spec</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* The 8-Stage Visual Story Sequence */}
      <div className="p-8 bg-white/80 rounded-3xl border border-stone-200/80 shadow-xs">
        <div className="text-center mb-6">
          <span className="text-xs uppercase font-mono tracking-wider font-semibold text-stone-500 block mb-1">
            The Autonomous Loop
          </span>
          <h3 className="font-display font-bold text-xl text-stone-900">
            How PackIntellect Works in 10 Seconds
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          {[
            { step: '01', title: 'Food', desc: 'True 3D fruit/bakery morphology' },
            { step: '02', title: 'Package', desc: 'Outer carton, liner, supports' },
            { step: '03', title: 'Journey', desc: 'Real vehicle & road physics' },
            { step: '04', title: 'Test Lab', desc: 'Vibration, drop, top-load' },
            { step: '05', title: 'Failure', desc: 'Visual stress & bruise zone' },
            { step: '06', title: 'Redesign', desc: '3 candidate 3D architectures' },
            { step: '07', title: 'V1 → V2', desc: 'Visible physical morphing' },
            { step: '08', title: 'Re-Test', desc: 'Zero deformation verified' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/50 flex flex-col items-center">
              <span className="text-[10px] font-mono text-emerald-800 font-semibold mb-1">
                {item.step}
              </span>
              <span className="text-xs font-bold text-stone-900 mb-0.5">
                {item.title}
              </span>
              <span className="text-[10px] text-stone-500 leading-tight">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
