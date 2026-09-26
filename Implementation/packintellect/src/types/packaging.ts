import { FoodProfile, PackagingSystemRecommendation, FoodQuantitySpec } from './foodKnowledge';

export type FoodId = 'mango' | 'cake' | 'bottle' | 'tomato' | 'apple' | 'biscuits' | (string & {});

export interface FoodItem {
  id: FoodId;
  name: string;
  scientificName?: string;
  category: string;
  weightGrams: number;
  fragility: 'Delicate' | 'High' | 'Extreme' | 'Moderate' | 'Low';
  fragilityScore: number; // 1 - 100
  shelfLifeDays: number;
  optimalTempRange: string;
  criticalFailureMode: string;
  description: string;
  accentColor: string;
  foodProfile?: FoodProfile;
  defaultQuantity?: number;
  unitType?: 'g' | 'kg' | 'ml' | 'L' | 'mg';
  packagingSystem?: PackagingSystemRecommendation;
}

export type JourneyStageId = 'farm' | 'packing' | 'warehouse' | 'transport' | 'delivery';

export interface JourneyStage {
  id: JourneyStageId;
  name: string;
  subhead: string;
  description: string;
  distanceKm: number;
  vibrationG: number;
  shockPeakG: number;
  temperatureC: number;
  relativeHumidityPct: number;
  roadCondition: string;
}

export type TestType = 'vibration' | 'impact' | 'drop' | 'compression' | 'temperature' | 'humidity';

export interface TestProfile {
  id: TestType;
  name: string;
  standardCode: string;
  description: string;
  unit: string;
  v1Value: number;
  v2Value: number;
  thresholdLimit: number;
  v1Pass: boolean;
  v2Pass: boolean;
  failureDescription: string;
  remedyDescription: string;
}

export interface PackagingSpec {
  wallThicknessMm: number;
  cushionThicknessMm: number;
  cushionMaterial: 'Standard Open-Cell Foam' | 'Molded Bio-Pulp' | 'Honeycomb Hex-Cushion' | 'Aerogel Barrier' | (string & {});
  outerMaterial: 'Single-Wall Kraft Corrugated' | 'Double-Wall Micro-Flute' | 'Reinforced Quad-Kraft' | (string & {});
  supportType: 'None (Loose Fill)' | 'Corner Post Braces' | 'Cross-Rib Suspension' | 'Quad Interlocking Dampers' | (string & {});
  dampingCoeff: number; // 0 - 1
  impactAbsorptionJoules: number;
  thermalInsulationRVal: number;
  boxWidthMm: number;
  boxLengthMm: number;
  boxHeightMm: number;
  // Food-aware Packaging System
  packagingSystem?: PackagingSystemRecommendation;
  primaryPackagingType?: string;
  primaryPackagingMaterial?: string;
  secondaryPackagingType?: string;
  secondaryPackagingMaterial?: string;
  closureType?: string;
  quantity?: number;
  totalWeightGrams?: number;
  gridArrangement?: { cols: number; rows: number; layers: number };
  environmentalRating?: string;
  environmentalRationale?: string;
  selectionReasoning?: string[];
}

export interface RedesignCandidate {
  id: string;
  code: string;
  name: string;
  focus: string;
  description: string;
  spec: PackagingSpec;
  shockAbsorptionPct: number;
  thermalDeltaHours: number;
  ecoScorePct: number;
  weightDeltaGrams: number;
  isRecommended?: boolean;
}

export interface FailurePoint {
  id: string;
  zoneName: string;
  severity: 'Warning' | 'Severe Crushing' | 'Thermal Breach' | 'Puncture';
  description: string;
  peakGForce: number;
  coordinate: [number, number, number]; // 3D coordinates relative to box
}

export type AppStep =
  | 'intro'
  | 'select'
  | 'inspect'
  | 'journey'
  | 'testlab'
  | 'failure'
  | 'redesign'
  | 'transform'
  | 'retest'
  | 'results';
