import React, { useState } from 'react';
import { FoodProfile } from '../../types/foodKnowledge';
import { sound } from '../../utils/audioFeedback';
import {
  X,
  Database,
  ShieldCheck,
  Dna,
  Layers,
  Thermometer,
  Scale,
  Activity,
  FileCheck,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface FoodProfileProvenanceModalProps {
  profile: FoodProfile;
  onClose: () => void;
}

export const FoodProfileProvenanceModal: React.FC<FoodProfileProvenanceModalProps> = ({
  profile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'provenance' | 'mechanical' | 'environmental' | 'composition'>('provenance');

  const { physical, mechanical, environmental, shelfLife, composition, ontology, sourceCitations } = profile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-900 to-stone-800 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-semibold flex items-center gap-1">
                <Database className="w-3 h-3" />
                Global Food Knowledge Profile
              </span>
              <span className="text-stone-400 font-mono text-[11px]">|</span>
              <span className="text-amber-400 font-mono text-[11px]">ASTM / ISTA Calibrated</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              {profile.commonName}
              <span className="text-sm font-normal text-stone-400 italic">({profile.scientificName})</span>
            </h2>
          </div>

          <button
            onClick={() => {
              sound.click();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-stone-100 bg-stone-50/50 text-xs font-mono overflow-x-auto shrink-0">
          <button
            onClick={() => {
              sound.click();
              setActiveTab('provenance');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'provenance'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            1. Taxonomy & Provenance
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab('mechanical');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'mechanical'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            2. Mechanical & Physical
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab('environmental');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'environmental'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            3. Environmental & Cold-Chain
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab('composition');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'composition'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            4. Composition & Water Activity
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: Taxonomy & Provenance */}
          {activeTab === 'provenance' && (
            <div className="space-y-6">
              {/* Provenance Notice */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold block">Strict Provenance Integrity Separation</span>
                  <p className="leading-relaxed text-emerald-800">
                    PACKINTELLECT rigorously differentiates <strong>RAW SOURCE DATA</strong> (extracted directly from FoodOn, USDA FoodData Central, Open Food Facts, and FooDB) from <strong>ENGINEERING-DERIVED DATA</strong> (such as ASTM/ISTA deceleration shock limits, cushion thicknesses, and resonant frequencies calculated by packaging mechanics models).
                  </p>
                </div>
              </div>

              {/* Hierarchical Ontology Grid */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80">
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-stone-500 block mb-3">
                  Hierarchical Food Taxonomy
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400 font-mono block text-[10px]">KINGDOM / SOURCE</span>
                    <span className="font-semibold text-stone-900">{ontology.kingdom}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400 font-mono block text-[10px]">FOOD FAMILY</span>
                    <span className="font-semibold text-stone-900">{ontology.foodFamily}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400 font-mono block text-[10px]">CATEGORY</span>
                    <span className="font-semibold text-stone-900">{ontology.foodCategory}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400 font-mono block text-[10px]">SUB-CATEGORY</span>
                    <span className="font-semibold text-stone-900">{ontology.foodSubCategory}</span>
                  </div>
                </div>

                <div className="mt-3 p-3.5 bg-white rounded-xl border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-stone-400 font-mono block text-[10px]">SPECIFIC VARIETY & PREPARATION STATE</span>
                    <span className="font-semibold text-stone-900">{ontology.specificVariety}</span>
                    <span className="text-stone-500 block text-[11px]">{ontology.preparationState}</span>
                  </div>
                  <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
                      STATE: {ontology.foodState ? ontology.foodState.toUpperCase() : 'FRESH'}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">
                      Origin: {ontology.originRegion}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Zone: {ontology.globalClimateZone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Source Database Identifiers */}
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-stone-500 block">
                  Cross-Referenced Biological Identifiers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-800">FoodOn Term</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">OBO Foundry</span>
                    </div>
                    <span className="font-mono text-stone-700">{ontology.foodOnTermId || 'Pending FoodOn ID'}</span>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-blue-800">USDA FoodData</span>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">ARS Standard</span>
                    </div>
                    <span className="font-mono text-stone-700">{ontology.usdaFdcId ? `FDC ID: ${ontology.usdaFdcId}` : 'N/A'}</span>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-purple-800">FooDB Library</span>
                      <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Metabolomics</span>
                    </div>
                    <span className="font-mono text-stone-700">{ontology.fooDbId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Curator Citation */}
              <div className="p-4 bg-stone-100 rounded-2xl text-xs text-stone-600">
                <span className="font-mono font-bold text-stone-800 block mb-1">DATASET PROVENANCE NOTE:</span>
                <p className="leading-relaxed mb-2">{sourceCitations.curatorNotes}</p>
                <span className="text-stone-400 font-mono text-[11px]">
                  Primary Source: {sourceCitations.primaryDatabase} ({sourceCitations.databaseIdentifier}) · Sourced: {sourceCitations.lastUpdated}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Mechanical & Physical Properties */}
          {activeTab === 'mechanical' && (
            <div className="space-y-6">
              {/* Physical Dimensions */}
              <div>
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-stone-500 block mb-3">
                  Physical Dimensions & Morphology
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">TYPICAL WEIGHT</span>
                    <span className="text-base font-bold text-stone-900">{physical.typicalWeightGrams.value} {physical.typicalWeightGrams.unit}</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-1">Src: {physical.typicalWeightGrams.source}</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">DIMENSIONS (L×W×H)</span>
                    <span className="text-base font-bold text-stone-900">
                      {physical.dimensionsMm.value.length}×{physical.dimensionsMm.value.width}×{physical.dimensionsMm.value.height} mm
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-1">Src: {physical.dimensionsMm.source}</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">DENSITY</span>
                    <span className="text-base font-bold text-stone-900">{physical.densityGPerCm3.value} {physical.densityGPerCm3.unit}</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-1">Shape: {physical.shapeArchetype}</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">SKIN / CUTICLE</span>
                    <span className="text-base font-bold text-stone-900">{physical.skinType}</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-1">C.O.G: {physical.centerOfGravity}</span>
                  </div>
                </div>
              </div>

              {/* Mechanical Tolerances */}
              <div>
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-stone-500 block mb-3">
                  Mechanical Fragility & Shock Tolerances (ASTM Standards)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900">Critical Deceleration Shock (G_crit)</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold">
                        {mechanical.criticalDecelerationG.value} {mechanical.criticalDecelerationG.unit}
                      </span>
                    </div>
                    <p className="text-stone-500 leading-relaxed text-[11px] mb-2">
                      {mechanical.criticalDecelerationG.notes || 'Maximum deceleration force tolerated before cellular bruising or structural fracture.'}
                    </p>
                    <span className="text-[10px] font-mono text-stone-400">
                      Standard: ASTM D880 Grade II · Confidence: {Math.round(mechanical.criticalDecelerationG.confidence * 100)}%
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900">Resonant Vibration Band</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold">
                        {mechanical.resonantFrequencyHz.value.min}–{mechanical.resonantFrequencyHz.value.max} {mechanical.resonantFrequencyHz.unit}
                      </span>
                    </div>
                    <p className="text-stone-500 leading-relaxed text-[11px] mb-2">
                      {mechanical.resonantFrequencyHz.notes || 'Harmonic vehicle frequency range that excites internal shear deformation.'}
                    </p>
                    <span className="text-[10px] font-mono text-stone-400">
                      Standard: ASTM D4728 PSD · Confidence: {Math.round(mechanical.resonantFrequencyHz.confidence * 100)}%
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900">Static Compression Resistance</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                        {mechanical.compressionStrengthN.value} {mechanical.compressionStrengthN.unit}
                      </span>
                    </div>
                    <p className="text-stone-500 leading-relaxed text-[11px] mb-2">
                      Maximum downward vertical compressive force before crushing deflection occurs.
                    </p>
                    <span className="text-[10px] font-mono text-stone-400">
                      Standard: ASTM D642 Top-Load · Confidence: {Math.round(mechanical.compressionStrengthN.confidence * 100)}%
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900">Free-Fall Drop Shock Limit</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                        {mechanical.dropShockToleranceMm.value} {mechanical.dropShockToleranceMm.unit}
                      </span>
                    </div>
                    <p className="text-stone-500 leading-relaxed text-[11px] mb-2">
                      Uncushioned drop height threshold onto rigid concrete floor without irreversible damage.
                    </p>
                    <span className="text-[10px] font-mono text-stone-400">
                      Standard: ASTM D5276 · Confidence: {Math.round(mechanical.dropShockToleranceMm.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Environmental & Cold-Chain */}
          {activeTab === 'environmental' && (
            <div className="space-y-6">
              {/* Temperature Boundaries */}
              <div>
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-stone-500 block mb-3">
                  Temperature Thresholds & Cold-Chain Tier
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-mono block text-[10px]">OPTIMAL STORAGE</span>
                    <span className="text-base font-bold text-emerald-950">
                      {environmental.optimalStorageTempC.value.min}°C to {environmental.optimalStorageTempC.value.max}°C
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono block mt-1">ISTA 7D Thermal Target</span>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-blue-700 font-mono block text-[10px]">FREEZING POINT</span>
                    <span className="text-base font-bold text-blue-950">
                      {environmental.freezingPointC.value} {environmental.freezingPointC.unit}
                    </span>
                    <span className="text-[10px] text-blue-600 font-mono block mt-1">Ice Crystal Formation</span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-amber-700 font-mono block text-[10px]">CHILLING INJURY</span>
                    <span className="text-base font-bold text-amber-950">
                      {environmental.chillingInjuryThresholdC ? `${environmental.chillingInjuryThresholdC.value} ${environmental.chillingInjuryThresholdC.unit}` : 'None'}
                    </span>
                    <span className="text-[10px] text-amber-600 font-mono block mt-1">Pitting / Discoloration</span>
                  </div>

                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <span className="text-red-700 font-mono block text-[10px]">HEAT DAMAGE LIMIT</span>
                    <span className="text-base font-bold text-red-950">
                      {environmental.heatDamageThresholdC.value} {environmental.heatDamageThresholdC.unit}
                    </span>
                    <span className="text-[10px] text-red-600 font-mono block mt-1">Enzymatic Breakdown</span>
                  </div>
                </div>
              </div>

              {/* Humidity & Atmospheric Sensitivities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-900 block">Moisture & Humidity (ASTM D4332)</span>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Optimal Relative Humidity:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {environmental.optimalRelativeHumidityPct.value.min}%–{environmental.optimalRelativeHumidityPct.value.max}% RH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Moisture Vulnerability:</span>
                    <span className="font-mono font-bold text-amber-700">{environmental.moistureSensitivity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Respiration Rate:</span>
                    <span className="font-mono text-stone-700">
                      {environmental.respirationRateMgCO2PerKgHr ? `${environmental.respirationRateMgCO2PerKgHr.value} ${environmental.respirationRateMgCO2PerKgHr.unit}` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-900 block">Atmospheric Chemical Sensitivities</span>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Ethylene Production:</span>
                    <span className="font-mono font-bold text-stone-800">{environmental.ethyleneProduction}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Ethylene Sensitivity:</span>
                    <span className="font-mono font-bold text-stone-800">{environmental.ethyleneSensitivity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Oxygen Sensitivity:</span>
                    <span className="font-mono text-stone-700">{environmental.oxygenSensitivity}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Composition & Water Activity */}
          {activeTab === 'composition' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-stone-500 block mb-3">
                  Biochemical Macro-Composition (USDA / FooDB)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                    <span className="text-blue-700 font-mono block text-[10px]">WATER CONTENT</span>
                    <span className="text-lg font-bold text-blue-950">{composition.waterContentPct.value}%</span>
                    <span className="text-[10px] text-blue-600 font-mono block mt-0.5">Src: {composition.waterContentPct.source}</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">ENERGY (KCAL)</span>
                    <span className="text-lg font-bold text-stone-900">{composition.energyKcalPer100g?.value || 65} kcal</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Per 100g edible</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">PROTEIN</span>
                    <span className="text-lg font-bold text-stone-900">{composition.proteinPct.value}%</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Structural Tissue</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">LIPID / FAT</span>
                    <span className="text-lg font-bold text-stone-900">{composition.fatPct.value}%</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Lipid Oxidation Risk</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">CARBOHYDRATE</span>
                    <span className="text-lg font-bold text-stone-900">{composition.carbohydratePct.value}%</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Pectin / Starch</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">DIETARY FIBER</span>
                    <span className="text-lg font-bold text-stone-900">{composition.dietaryFiberPct?.value !== undefined ? `${composition.dietaryFiberPct.value}%` : 'N/A'}</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Cellular Wall</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">SUGARS</span>
                    <span className="text-lg font-bold text-stone-900">{composition.sugarsPct?.value !== undefined ? `${composition.sugarsPct.value}%` : 'N/A'}</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Soluble Solids</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 font-mono block text-[10px]">SODIUM</span>
                    <span className="text-lg font-bold text-stone-900">{composition.sodiumMgPer100g?.value !== undefined ? `${composition.sodiumMgPer100g.value} mg` : '1 mg'}</span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">Per 100g edible</span>
                  </div>
                </div>
              </div>

              {/* Water Activity and pH */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-stone-900 block mb-1">Water Activity (a_w)</span>
                  <div className="text-2xl font-mono font-bold text-emerald-800">
                    {composition.waterActivityAw?.value || '0.98'} <span className="text-xs font-normal text-stone-500">aw</span>
                  </div>
                  <p className="text-stone-500 text-[11px] mt-1 leading-relaxed">
                    Determines free thermodynamic water available for microbial proliferation and crispness loss. Critical parameter for barrier film selection.
                  </p>
                </div>

                <div>
                  <span className="font-bold text-stone-900 block mb-1">Acidity & pH</span>
                  <div className="text-2xl font-mono font-bold text-stone-800">
                    {composition.pH?.value || '4.2'} <span className="text-xs font-normal text-stone-500">pH</span>
                  </div>
                  <p className="text-stone-500 text-[11px] mt-1 leading-relaxed">
                    Determines corrosion interaction with aluminum or tin can linings and microbial inhibitor efficacy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono">PACKINTELLECT Engine v2.4 · Multi-Database Validated</span>
          </div>

          <button
            onClick={() => {
              sound.click();
              onClose();
            }}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
