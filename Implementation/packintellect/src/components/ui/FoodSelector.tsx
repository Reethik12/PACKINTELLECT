import React, { useState, useMemo } from 'react';
import { FoodId, FoodItem } from '../../types/packaging';
import { FoodState, FoodQuantitySpec } from '../../types/foodKnowledge';
import { foodKnowledgeService } from '../../services/foodKnowledgeService';
import { FoodInspector3D } from '../3d/FoodInspector3D';
import { sound } from '../../utils/audioFeedback';
import { FoodProfileProvenanceModal } from './FoodProfileProvenanceModal';
import {
  Apple,
  Cake,
  Wine,
  Sparkles,
  Shield,
  ArrowRight,
  Truck,
  Info,
  Check,
  Layers,
  Search,
  Database,
  ExternalLink,
  Fish,
  Egg,
  Globe,
  Snowflake,
  Sun,
  Flame,
  Scale,
  Boxes,
  Leaf,
  Plus,
  Minus,
  CheckCircle2,
  Droplet,
} from 'lucide-react';

interface FoodSelectorProps {
  selectedFoodId: FoodId;
  quantitySpec?: FoodQuantitySpec;
  onSelectFood: (foodId: FoodId) => void;
  onUpdateQuantitySpec?: (spec: FoodQuantitySpec) => void;
  onProceed: () => void;
}

export const FoodSelector: React.FC<FoodSelectorProps> = ({
  selectedFoodId,
  quantitySpec,
  onSelectFood,
  onUpdateQuantitySpec,
  onProceed,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);

  // Available categories
  const categories = useMemo(() => {
    return foodKnowledgeService.getAvailableCategories();
  }, []);

  // Available preservation states
  const states = useMemo(() => {
    return [
      { id: 'All', label: 'All States' },
      ...foodKnowledgeService.getFoodStates().map((s) => ({ id: s.id, label: s.label })),
    ];
  }, []);

  // Filtered food profiles & items
  const filteredFoods = useMemo(() => {
    const profiles = foodKnowledgeService.searchFoods({
      query: searchQuery,
      category: selectedCategory,
      foodState: selectedState === 'All' ? undefined : (selectedState as FoodState),
    });
    return profiles.map((p) => foodKnowledgeService.toFoodItem(p));
  }, [searchQuery, selectedCategory, selectedState]);

  const selectedFood = foodKnowledgeService.getFoodItemById(selectedFoodId);

  // Current Quantity Spec with fallback
  const currentQuantitySpec: FoodQuantitySpec = useMemo(() => {
    if (quantitySpec) return quantitySpec;
    const isLiquid =
      selectedFood.foodProfile?.ontology.physicalState === 'liquid' ||
      selectedFood.foodProfile?.ontology.foodCategory === 'Beverages';
    return {
      weightPerUnit: selectedFood.weightGrams,
      unitType: (isLiquid ? 'ml' : 'g') as any,
      quantity: selectedFood.defaultQuantity || 1,
      totalWeightGrams: selectedFood.weightGrams * (selectedFood.defaultQuantity || 1),
    };
  }, [quantitySpec, selectedFood, selectedFoodId]);

  // Real-time calculated shipment weight metrics
  const shipmentWeight = useMemo(() => {
    return foodKnowledgeService.calculateShipmentWeight(selectedFoodId, currentQuantitySpec);
  }, [selectedFoodId, currentQuantitySpec]);

  // Real-time packaging system recommendation
  const packagingSystem = useMemo(() => {
    return foodKnowledgeService.getPackagingSystem(selectedFoodId, currentQuantitySpec);
  }, [selectedFoodId, currentQuantitySpec]);

  const handleWeightChange = (newVal: number) => {
    if (isNaN(newVal) || newVal <= 0) return;
    const updated: FoodQuantitySpec = {
      ...currentQuantitySpec,
      weightPerUnit: newVal,
      totalWeightGrams: Math.round(newVal * currentQuantitySpec.quantity),
    };
    if (onUpdateQuantitySpec) onUpdateQuantitySpec(updated);
  };

  const handleUnitChange = (unit: 'mg' | 'g' | 'kg' | 'ml' | 'L') => {
    sound.click();
    const updated: FoodQuantitySpec = {
      ...currentQuantitySpec,
      unitType: unit,
    };
    if (onUpdateQuantitySpec) onUpdateQuantitySpec(updated);
  };

  const handleQuantityChange = (newQty: number) => {
    sound.click();
    const cleanQty = Math.max(1, Math.min(1000, newQty));
    const updated: FoodQuantitySpec = {
      ...currentQuantitySpec,
      quantity: cleanQty,
      totalWeightGrams: Math.round(currentQuantitySpec.weightPerUnit * cleanQty),
    };
    if (onUpdateQuantitySpec) onUpdateQuantitySpec(updated);
  };

  const foodIcons: Record<string, React.ReactNode> = {
    mango: <span className="text-2xl">🥭</span>,
    cake: <Cake className="w-5 h-5 text-rose-600" />,
    bottle: <Wine className="w-5 h-5 text-emerald-700" />,
    tomato: <span className="text-2xl">🍅</span>,
    apple: <Apple className="w-5 h-5 text-red-600" />,
    biscuits: <span className="text-2xl">🍪</span>,
    strawberry: <span className="text-2xl">🍓</span>,
    'strawberry-frozen': <span className="text-2xl">🧊🍓</span>,
    banana: <span className="text-2xl">🍌</span>,
    mushroom: <span className="text-2xl">🍄</span>,
    eggs: <span className="text-2xl">🥚</span>,
    salmon: <span className="text-2xl">🐟</span>,
    'salmon-frozen': <span className="text-2xl">🧊🐟</span>,
    'dates-dried': <span className="text-2xl">🌴</span>,
    avocado: <span className="text-2xl">🥑</span>,
    orange: <span className="text-2xl">🍊</span>,
    rice: <span className="text-2xl">🌾</span>,
    almonds: <span className="text-2xl">🌰</span>,
    bread: <span className="text-2xl">🍞</span>,
    dragonfruit: <span className="text-2xl">🐉</span>,
    milk: <span className="text-2xl">🥛</span>,
    tuna: <span className="text-2xl">🐟</span>,
    'peas-frozen': <span className="text-2xl">🧊🫛</span>,
    quinoa: <span className="text-2xl">🥣</span>,
    // Indian & Global Extended Catalog Foods
    'atta-wheat-flour': <span className="text-2xl">🌾</span>,
    'toor-dal': <span className="text-2xl">🍲</span>,
    'poha-flattened-rice': <span className="text-2xl">🥣</span>,
    'fresh-milk-pouch': <span className="text-2xl">🥛</span>,
    'paneer-fresh': <span className="text-2xl">🧀</span>,
    'desi-ghee-jar': <span className="text-2xl">🍯</span>,
    'potato-alu': <span className="text-2xl">🥔</span>,
    'bhindi-okra': <span className="text-2xl">🥗</span>,
    'samosa-hot': <span className="text-2xl">🥟</span>,
    'potato-chips-bag': <span className="text-2xl">🥔</span>,
    'haldi-turmeric-powder': <span className="text-2xl">✨</span>,
    'mango-pickle-jar': <span className="text-2xl">🫙</span>,
    'gulab-jamun': <span className="text-2xl">🟤</span>,
    'kaju-katli': <span className="text-2xl">💎</span>,
    'tender-coconut-water': <span className="text-2xl">🥥</span>,
    'moong-dal-yellow': <span className="text-2xl">🟡</span>,
    'rajma-chitra': <span className="text-2xl">🫘</span>,
    'ragi-finger-millet': <span className="text-2xl">🌾</span>,
    'onion-nasik-red': <span className="text-2xl">🧅</span>,
    'spinach-palak-fresh': <span className="text-2xl">🥬</span>,
    'grapes-nashik-green': <span className="text-2xl">🍇</span>,
    'pomegranate-bhagwa': <span className="text-2xl">🔴</span>,
    'curd-dahi-pot': <span className="text-2xl">🍶</span>,
    'butter-makkhan-block': <span className="text-2xl">🧈</span>,
    'motichoor-laddu-box': <span className="text-2xl">🟠</span>,
    'rasgulla-syrup-can': <span className="text-2xl">⚪</span>,
    'red-chilli-powder-kashmiri': <span className="text-2xl">🌶️</span>,
    'chicken-curry-cut-fresh': <span className="text-2xl">🍗</span>,
    'ready-to-eat-paneer-makhani': <span className="text-2xl">🍲</span>,
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 font-mono block mb-1.5">
          Phase 01 · Global Food Knowledge Catalog & Smart Packaging Engine
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-2">
          What's inside?
        </h2>
        <p className="text-stone-600 text-sm leading-relaxed text-balance">
          Every food morphology presents distinct biological, physical, and transport vulnerabilities. Select a product, specify unit mass and batch quantity, and observe the AI engine derive a certified packaging system.
        </p>
      </div>

      {/* Main Two-Column Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column: Visual Catalog with Search & Category Filters (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-mono uppercase text-stone-500 font-medium">
              Select Payload ({filteredFoods.length} of {foodKnowledgeService.getAllProfiles().length} Available)
            </span>
            <span className="text-xs font-mono text-emerald-700 font-semibold flex items-center gap-1">
              <Database className="w-3 h-3" />
              Multi-Source Provenance
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian & global foods, scientific term, or regional name..."
              className="w-full pl-9 pr-4 py-2 bg-white/90 border border-stone-200/90 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    sound.click();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Food State Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono no-scrollbar">
            <span className="text-stone-400 shrink-0 uppercase tracking-wider pl-1">State:</span>
            {states.map((st) => {
              const isSelected = selectedState === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    sound.click();
                    setSelectedState(st.id);
                  }}
                  className={`px-2.5 py-0.5 rounded-md whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Food Items Vertical Scrolling List */}
          <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredFoods.map((food) => {
              const isSelected = food.id === selectedFoodId;
              const profile = food.foodProfile;
              const primarySrc = profile?.sourceCitations.primaryDatabase || 'USDA FoodData Central';

              return (
                <div
                  key={food.id}
                  onClick={() => {
                    sound.click();
                    onSelectFood(food.id);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-stone-900 shadow-md ring-1 ring-stone-900'
                      : 'bg-white/80 border-stone-200/80 hover:bg-white hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                        {foodIcons[food.id] || <span className="text-xl">📦</span>}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-sm text-stone-900 leading-tight">
                          {food.name}
                        </h3>
                        <span className="text-[11px] text-stone-400 italic">
                          {food.scientificName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                        food.fragilityScore > 80
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : food.fragilityScore > 65
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {food.fragility} ({food.fragilityScore})
                      </span>
                    </div>
                  </div>

                  {/* State and Origin Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      profile?.ontology.foodState === 'frozen'
                        ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                        : profile?.ontology.foodState === 'dried'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : profile?.ontology.foodState === 'chilled'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : profile?.ontology.foodState === 'baked'
                        ? 'bg-orange-50 text-orange-800 border border-orange-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {profile?.ontology?.foodState ? profile.ontology.foodState.toUpperCase() : 'FRESH'}
                    </span>
                    {profile?.ontology.originRegion && (
                      <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200/60">
                        📍 {profile.ontology.originRegion.split('(')[0].trim()}
                      </span>
                    )}
                    {profile?.ontology.physicalState && (
                      <span className="text-[10px] font-mono text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200/50">
                        {profile.ontology.physicalState}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-2 mb-2 leading-relaxed">
                    {food.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono pt-2 border-t border-stone-100">
                    <span>Base Unit: {food.weightGrams}g</span>
                    <span>Shelf: {food.shelfLifeDays}d</span>
                    <span className="text-stone-700 font-medium">{food.optimalTempRange}</span>
                  </div>
                </div>
              );
            })}

            {filteredFoods.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
                No matching foods found in catalog. Try clearing your search query.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3D Model, Weight + Quantity Input, and AI Packaging System (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-mono uppercase text-stone-500 font-medium">
              3D Inspection & Morphology Analysis
            </span>
            <button
              onClick={() => {
                sound.click();
                setShowProvenanceModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <Database className="w-3 h-3 text-emerald-700" />
              <span>View Full Food Profile & Provenance</span>
            </button>
          </div>

          {/* Prominent 3D Viewer */}
          <div className="h-[380px] w-full relative">
            <FoodInspector3D
              food={selectedFood}
              className="h-full"
            />
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4 REQUIREMENT: WEIGHT + QUANTITY + AUTO TOTAL WEIGHT CALCULATOR */}
          {/* ========================================================================= */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-mono uppercase font-semibold text-stone-900 tracking-wider">
                  Payload Mass & Batch Quantity Configuration
                </span>
              </div>
              <span className="text-[11px] font-mono text-stone-400">
                Auto-calculated engineering inputs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Weight per Unit Input with Unit Selector */}
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1.5">
                  Weight per Unit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={currentQuantitySpec.weightPerUnit}
                    onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
                    className="w-32 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  {/* Units Toggle Buttons: mg, g, kg, ml, L */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                    {(['mg', 'g', 'kg', 'ml', 'L'] as const).map((u) => {
                      const isActive = currentQuantitySpec.unitType === u;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => handleUnitChange(u)}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-stone-900 text-white shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Select ml/L for liquid volume mass derivation.
                </span>
              </div>

              {/* Quantity Stepper & Quick Presets */}
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1.5">
                  Batch Shipment Quantity
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(currentQuantitySpec.quantity - 1)}
                      className="px-3 py-2 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={currentQuantitySpec.quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 text-center py-2 bg-transparent text-sm font-mono font-bold text-stone-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(currentQuantitySpec.quantity + 1)}
                      className="px-3 py-2 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1">
                    {[1, 6, 12, 24].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleQuantityChange(preset)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                          currentQuantitySpec.quantity === preset
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {preset}x
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Unit count flows into structural sizing & stacking force.
                </span>
              </div>
            </div>

            {/* AUTOMATICALLY CALCULATED TOTAL WEIGHT BANNER */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-stone-50 rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-semibold block">
                  Calculated Total Shipment Mass
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-emerald-950 font-display">
                    {shipmentWeight.totalWeightGrams >= 1000
                      ? `${(shipmentWeight.totalWeightGrams / 1000).toFixed(2)} kg`
                      : `${shipmentWeight.totalWeightGrams} g`}
                  </span>
                  <span className="text-xs text-stone-500">
                    ({currentQuantitySpec.weightPerUnit} {currentQuantitySpec.unitType} × {currentQuantitySpec.quantity} units)
                  </span>
                </div>
              </div>

              {shipmentWeight.isLiquid && (
                <div className="text-right text-xs space-y-0.5 border-t sm:border-t-0 sm:border-l border-emerald-200/80 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-emerald-800 font-semibold flex items-center gap-1 sm:justify-end">
                    <Droplet className="w-3 h-3 text-emerald-600" />
                    Liquid Rheology
                  </span>
                  <span className="text-stone-600 block text-[11px]">
                    Volume: {shipmentWeight.totalVolumeMl} ml · ρ: {shipmentWeight.densityGPerCm3} g/cm³
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1, 2, 3: SMART FOOD-AWARE PACKAGING RECOMMENDATION ENGINE PREVIEW */}
          {/* ========================================================================= */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-mono uppercase font-semibold text-stone-900 tracking-wider">
                  Food-Aware Recommended Packaging System
                </span>
              </div>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                packagingSystem.environmentalRating.includes('A+')
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : packagingSystem.environmentalRating.includes('A')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                Eco Rating: {packagingSystem.environmentalRating}
              </span>
            </div>

            {/* Architecture Multi-Layer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Primary Packaging */}
              <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 space-y-1">
                <span className="text-[10px] font-mono text-emerald-800 uppercase font-semibold block">
                  Primary Packaging
                </span>
                <span className="font-semibold text-stone-900 block leading-snug">
                  {packagingSystem.primaryPackaging.type}
                </span>
                <span className="text-[11px] text-stone-600 block">
                  Material: {packagingSystem.primaryPackaging.material}
                </span>
                {packagingSystem.primaryPackaging.closureType && (
                  <span className="text-[10px] text-stone-500 font-mono block">
                    Closure: {packagingSystem.primaryPackaging.closureType}
                  </span>
                )}
              </div>

              {/* Secondary / Protective Packaging */}
              <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 space-y-1">
                <span className="text-[10px] font-mono text-emerald-800 uppercase font-semibold block">
                  Secondary Packaging
                </span>
                {packagingSystem.secondaryPackaging ? (
                  <>
                    <span className="font-semibold text-stone-900 block leading-snug">
                      {packagingSystem.secondaryPackaging.type}
                    </span>
                    <span className="text-[11px] text-stone-600 block">
                      Grade: {packagingSystem.secondaryPackaging.wallGrade || packagingSystem.secondaryPackaging.material}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-stone-700 block leading-snug">
                      Primary Packaging Only
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      No secondary shipper required for single consumer unit.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Cushioning & Geometry */}
            <div className="p-3 bg-stone-50/60 rounded-xl border border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block">Cushioning & Protective Inlay</span>
                <span className="font-semibold text-stone-900">
                  {packagingSystem.cushioning.type} ({packagingSystem.cushioning.thicknessMm}mm {packagingSystem.cushioning.material})
                </span>
              </div>
              <div className="sm:text-right font-mono text-[11px] text-stone-600">
                <span className="text-stone-400 block text-[10px] uppercase">Engineered Dimensions</span>
                <span className="font-semibold text-stone-800">
                  {packagingSystem.packageDimensions.lengthMm} × {packagingSystem.packageDimensions.widthMm} × {packagingSystem.packageDimensions.heightMm} mm
                </span>
              </div>
            </div>

            {/* Environmental Preference Rationale */}
            <div className="text-xs text-stone-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 leading-relaxed">
              <span className="font-semibold text-emerald-950 block mb-0.5">
                Environmental-First Engineering Rationale:
              </span>
              <p>{packagingSystem.environmentalPreferenceRationale}</p>
            </div>

            {/* Selection Reasoning */}
            <div className="space-y-1 text-xs">
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Functional Derivations:</span>
              <ul className="space-y-1">
                {packagingSystem.selectionReasoning.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  sound.click();
                  onProceed();
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Proceed to 3D Structural Inspection & Testing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Food Profile & Provenance Modal */}
      {showProvenanceModal && selectedFood.foodProfile && (
        <FoodProfileProvenanceModal
          profile={selectedFood.foodProfile}
          onClose={() => setShowProvenanceModal(false)}
        />
      )}
    </div>
  );
};
