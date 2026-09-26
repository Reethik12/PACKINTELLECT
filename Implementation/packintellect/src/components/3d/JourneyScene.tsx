import React from 'react';
import { FoodItem, PackagingSpec } from '../../types/packaging';
import { HeroDeliveryScene } from './HeroDeliveryScene';
import { Truck, Activity, Gauge, Compass, Zap } from 'lucide-react';

interface JourneySceneProps {
  food: FoodItem;
  spec: PackagingSpec;
  isV2?: boolean;
  onProceedToTestLab: () => void;
}

export const JourneyScene: React.FC<JourneySceneProps> = ({
  food,
  spec,
  isV2 = false,
  onProceedToTestLab,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-1">
            Dynamic Transit Simulator · Live Vehicular Physics
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Real Transport & Road Testing
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Simulate live transit velocity, emergency braking inertia, centrifugal cornering forces, and severe pothole road shock on your packaging payload.
          </p>
        </div>

        {/* Vehicle Status Badges */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-xl text-xs font-semibold text-stone-800">
            <Truck className="w-4 h-4 text-emerald-700" />
            <span>Heavy Freight Carrier</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl text-xs font-semibold text-emerald-900">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Road Rig</span>
          </div>
        </div>
      </div>

      {/* Realistic In-Transit Logistics & Vehicle Simulation Viewport */}
      <div className="h-[580px] sm:h-[640px] w-full relative rounded-3xl overflow-hidden shadow-xl">
        <HeroDeliveryScene
          foodId={food.id}
          spec={spec}
          isV2={isV2}
          stageName="Real Road Testing"
          onEnterLab={onProceedToTestLab}
          className="h-full"
        />
      </div>

      {/* Real Transport Dynamic Telemetry Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="p-3.5 bg-stone-50 rounded-xl">
          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <Gauge className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px] uppercase font-mono font-semibold">Chassis Kinematics</span>
          </div>
          <span className="text-sm font-semibold text-stone-900 block">65–75 km/h Cruising</span>
          <span className="text-[11px] text-stone-500">Dual-spring damping suspension</span>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl">
          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <Activity className="w-4 h-4 text-amber-700" />
            <span className="text-[10px] uppercase font-mono font-semibold">Vibration Spectrum</span>
          </div>
          <span className="text-sm font-semibold font-mono text-stone-900 block">
            0.45G–0.78G RMS
          </span>
          <span className="text-[11px] text-stone-500">Continuous highway road resonance</span>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl">
          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <Compass className="w-4 h-4 text-teal-700" />
            <span className="text-[10px] uppercase font-mono font-semibold">Dynamic Maneuvers</span>
          </div>
          <span className="text-sm font-semibold text-stone-900 block">Inertial Shift & Turn</span>
          <span className="text-[11px] text-stone-500">Braking, acceleration & centrifugal drift</span>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl">
          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] uppercase font-mono font-semibold">Road Shock Profile</span>
          </div>
          <span className="text-sm font-semibold font-mono text-stone-900 block">
            Peak 5.8G Deceleration
          </span>
          <span className="text-[11px] text-stone-500">Severe pothole & speed bump impacts</span>
        </div>
      </div>
    </div>
  );
};
