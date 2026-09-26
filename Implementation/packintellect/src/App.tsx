/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppStep, FoodId, FoodItem, PackagingSpec, RedesignCandidate } from './types/packaging';
import { FoodQuantitySpec } from './types/foodKnowledge';
import { FOOD_DATABASE, V1_DEFAULT_SPEC, V2_ENGINEERED_SPEC, REDESIGN_CANDIDATES } from './data/mockData';
import { foodKnowledgeService } from './services/foodKnowledgeService';
import { sound } from './utils/audioFeedback';

// Components
import { TopNav } from './components/ui/TopNav';
import { HeroIntro } from './components/ui/HeroIntro';
import { FoodSelector } from './components/ui/FoodSelector';
import { PackagingStudio } from './components/3d/PackagingStudio';
import { JourneyScene } from './components/3d/JourneyScene';
import { HeroDeliveryScene } from './components/3d/HeroDeliveryScene';
import { VirtualTestLab3D } from './components/3d/VirtualTestLab3D';
import { FailureModal } from './components/ui/FailureModal';
import { RedesignCandidates } from './components/ui/RedesignCandidates';
import { PackagingTransformation3D } from './components/3d/PackagingTransformation3D';
import { ResultComparison } from './components/ui/ResultComparison';

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('intro');
  const [selectedFoodId, setSelectedFoodId] = useState<FoodId>('apple');

  const initialFood = foodKnowledgeService.getFoodItemById('apple');
  const [quantitySpec, setQuantitySpec] = useState<FoodQuantitySpec>({
    weightPerUnit: initialFood.weightGrams,
    unitType: initialFood.unitType || 'g',
    quantity: initialFood.defaultQuantity || 1,
    totalWeightGrams: initialFood.weightGrams * (initialFood.defaultQuantity || 1),
  });

  const [currentSpec, setCurrentSpec] = useState<PackagingSpec>(() =>
    foodKnowledgeService.getPackagingSpecs('apple', {
      weightPerUnit: initialFood.weightGrams,
      unitType: initialFood.unitType || 'g',
      quantity: initialFood.defaultQuantity || 1,
    }).v1
  );

  const [selectedCandidate, setSelectedCandidate] = useState<RedesignCandidate>(() => {
    const candidates = foodKnowledgeService.getRedesignCandidates('apple');
    return candidates.find((c) => c.isRecommended) || candidates[2];
  });

  const [showFailureModal, setShowFailureModal] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const selectedFood = foodKnowledgeService.getFoodItemById(selectedFoodId, quantitySpec);

  const handleToggleAudio = () => {
    sound.isMuted = !sound.isMuted;
    setIsAudioMuted(sound.isMuted);
  };

  const handleSelectFood = (id: FoodId, newSpec?: Partial<FoodQuantitySpec>) => {
    setSelectedFoodId(id);
    const food = foodKnowledgeService.getFoodItemById(id);
    const updatedQtySpec: FoodQuantitySpec = {
      weightPerUnit: newSpec?.weightPerUnit ?? food.weightGrams,
      unitType: newSpec?.unitType ?? food.unitType ?? 'g',
      quantity: newSpec?.quantity ?? food.defaultQuantity ?? 1,
      totalWeightGrams: 0,
    };
    const calculated = foodKnowledgeService.calculateShipmentWeight(id, updatedQtySpec);
    updatedQtySpec.totalWeightGrams = calculated.totalWeightGrams;
    setQuantitySpec(updatedQtySpec);

    const specs = foodKnowledgeService.getPackagingSpecs(id, updatedQtySpec);
    setCurrentSpec(specs.v1);
    const candidates = foodKnowledgeService.getRedesignCandidates(id, updatedQtySpec);
    setSelectedCandidate(candidates.find((c) => c.isRecommended) || candidates[2]);
  };

  const handleUpdateQuantitySpec = (newSpec: FoodQuantitySpec) => {
    const calculated = foodKnowledgeService.calculateShipmentWeight(selectedFoodId, newSpec);
    const updated: FoodQuantitySpec = {
      ...newSpec,
      totalWeightGrams: calculated.totalWeightGrams,
    };
    setQuantitySpec(updated);

    const specs = foodKnowledgeService.getPackagingSpecs(selectedFoodId, updated);
    setCurrentSpec(specs.v1);
    const candidates = foodKnowledgeService.getRedesignCandidates(selectedFoodId, updated);
    setSelectedCandidate(candidates.find((c) => c.isRecommended) || candidates[2]);
  };

  const handleFailDetected = () => {
    setShowFailureModal(true);
  };

  const handleInitiateRedesign = () => {
    setShowFailureModal(false);
    setCurrentStep('redesign');
  };

  const handleRestart = () => {
    const specs = foodKnowledgeService.getPackagingSpecs(selectedFoodId, quantitySpec);
    setCurrentSpec(specs.v1);
    setCurrentStep('select');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col justify-between selection:bg-amber-200">
      {/* 3-Zone Top Navigation Bar */}
      <TopNav
        currentStep={currentStep}
        onNavigate={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
      />

      {/* Main Experience Viewport */}
      <main className="flex-1 w-full">
        {currentStep === 'intro' && (
          <HeroIntro
            selectedFood={selectedFood}
            onSelectFoodId={handleSelectFood}
            onStartEngineering={() => {
              setCurrentStep('select');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLaunchJourney={() => {
              setCurrentStep('journey');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEnterLab={() => {
              setCurrentStep('testlab');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentStep === 'select' && (
          <FoodSelector
            selectedFoodId={selectedFoodId}
            quantitySpec={quantitySpec}
            onSelectFood={handleSelectFood}
            onUpdateQuantitySpec={handleUpdateQuantitySpec}
            onProceed={() => {
              setCurrentStep('inspect');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentStep === 'inspect' && (
          <PackagingStudio
            food={selectedFood}
            spec={currentSpec}
            isV2={currentSpec === V2_ENGINEERED_SPEC}
            onUpdateSpec={(newSpec) => setCurrentSpec(newSpec)}
            onLaunchJourney={() => {
              setCurrentStep('journey');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentStep === 'journey' && (
          <JourneyScene
            food={selectedFood}
            spec={currentSpec}
            isV2={currentSpec === V2_ENGINEERED_SPEC || currentSpec.dampingCoeff > 0.35}
            onProceedToTestLab={() => {
              setCurrentStep('testlab');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
        {currentStep === 'testlab' && (
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-1">
                  Virtual Testing Facility · Dynamic Transit Stress Simulation
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
                  Virtual Test Lab
                </h2>
              </div>
            </div>

            <div className="h-[640px] sm:h-[680px] w-full relative">
              <VirtualTestLab3D
                foodId={selectedFood.id}
                spec={selectedCandidate?.spec || foodKnowledgeService.getPackagingSpecs(selectedFoodId, quantitySpec).v2}
                isV2={true}
                onFailDetected={handleFailDetected}
                onProceedToRedesign={handleInitiateRedesign}
                onProceedToResults={() => {
                  setCurrentStep('results');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-full"
              />
            </div>
          </div>
        )}

        {currentStep === 'redesign' && (
          <RedesignCandidates
            foodId={selectedFood.id}
            quantitySpec={quantitySpec}
            selectedCandidateId={selectedCandidate.id}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
            onProceedToTransform={() => {
              setCurrentStep('transform');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentStep === 'transform' && (
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-1">
                Phase 04 · Critical Metamorphosis
              </span>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight">
                V1 → V2 Physical Transformation
              </h2>
            </div>

            <div className="h-[640px] w-full relative">
              <PackagingTransformation3D
                foodId={selectedFood.id}
                initialCandidate={selectedCandidate}
                onTransformationComplete={(cand) => {
                  setSelectedCandidate(cand);
                  setCurrentSpec(cand.spec);
                  setCurrentStep('retest');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-full"
              />
            </div>
          </div>
        )}

        {currentStep === 'retest' && (
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-1">
                  Phase 05 · V2 Verification Transit
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
                  Re-Testing {selectedCandidate.name} Package
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Testing the upgraded packaging against the identical transit profile with tuned damping.
                </p>
              </div>

              <button
                onClick={() => {
                  sound.click();
                  setCurrentStep('results');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>View Full Engineering Results</span>
                <span>→</span>
              </button>
            </div>

            <div className="h-[520px] w-full relative">
              <HeroDeliveryScene
                foodId={selectedFood.id}
                spec={selectedCandidate.spec}
                isV2={true}
                className="h-full"
              />
            </div>
          </div>
        )}

        {currentStep === 'results' && (
          <ResultComparison
            food={selectedFood}
            v1Spec={foodKnowledgeService.getPackagingSpecs(selectedFood.id, quantitySpec).v1}
            v2Spec={selectedCandidate.spec}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Failure Detection Story Modal */}
      {showFailureModal && (
        <FailureModal
          food={selectedFood}
          onInitiateRedesign={handleInitiateRedesign}
          onDismiss={() => setShowFailureModal(false)}
        />
      )}

      {/* Clean Quiet Footer */}
      <footer className="mt-12 py-8 border-t border-stone-200/80 bg-white/50 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">PACKINTELLECT</span>
            <span aria-hidden="true">·</span>
            <span>Don't just recommend packaging. Engineer it.</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>Dynamic Transit Simulation Matrix</span>
            <span aria-hidden="true">·</span>
            <span>Bio-Circular Packaging Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
