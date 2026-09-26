/**
 * PACKINTELLECT Global Food Knowledge & Engineering Types
 * Supports hierarchical ontology, food states (fresh, frozen, dried, etc.),
 * multi-source provenance (FoodOn, USDA FoodData Central, FooDB, Open Food Facts, FAO),
 * comprehensive compositional data, mechanical/physical properties, and engineering derivations.
 */

export type DataSourceId =
  | 'FoodOn'
  | 'USDA FoodData Central'
  | 'Open Food Facts'
  | 'FooDB'
  | 'FAO INFOODS'
  | 'Engineering Deduction'
  | 'ASTM/ISTA Standards';

export type ConfidenceTier =
  | 'High (Laboratory Standard)'
  | 'Medium (Peer-Reviewed / Database)'
  | 'Estimated (Engineering Deduction)';

export interface ProvenanceRecord<T> {
  value: T;
  unit?: string;
  source: DataSourceId;
  sourceId?: string; // e.g., FDC ID: 170438, FoodOn ID: FOODON:00001290, FooDB ID: FOOD00012
  confidence: number; // 0.0 to 1.0 (e.g. 0.95 = 95%)
  confidenceTier: ConfidenceTier;
  dateSourced?: string;
  preparationState?: string; // e.g. "Raw, fresh intact", "Individually Quick Frozen (IQF)", "Sun-dried whole"
  notes?: string;
}

/**
 * Preservation and physical state of the food product.
 * Determines thermal, moisture, mechanical, and shelf-life behavior.
 */
export type FoodState =
  | 'fresh'            // Raw, freshly harvested living plant/animal tissue
  | 'chilled'          // Maintained in strict chilled cold chain (0°C to 4°C)
  | 'frozen'           // Flash frozen / IQF deep freeze (-18°C to -25°C)
  | 'dried'            // Dehydrated, sun-dried, oven-dried whole food (<12% moisture)
  | 'freeze-dried'     // Lyophilized ultra-low moisture (<2% moisture)
  | 'canned'           // Thermally retorted, hermetic seal
  | 'fermented'        // Microbially cultured, lacto-fermented, aged
  | 'cured'            // Salted, smoked, cured charcuterie
  | 'pasteurized'      // Thermally pasteurized liquid
  | 'baked'            // Oven baked crumb / pastry
  | 'ambient-raw';     // Raw shelf-stable whole foods (grains, pulses, tubers, nuts)

export type FoodPhysicalState =
  | 'solid'
  | 'liquid'
  | 'semi-solid'
  | 'powder'
  | 'granular'
  | 'frozen'
  | 'fresh_produce'
  | 'fragile_baked'
  | 'fragile_egg'
  | 'paste'
  | 'gel'
  | 'mixed'
  | 'ready_to_eat';

export interface FunctionalProtectionNeeds {
  leakageRisk: 'None' | 'Low' | 'Moderate' | 'High' | 'Severe';
  contaminationRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  crushSensitivity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  deformationSensitivity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  individualSeparationRequired?: boolean; // For eggs, delicate fruits, glass jars
  internalClearanceRequired?: boolean;    // For decorated cakes, pastries
  ventilationRequired?: boolean;          // For respiring fresh produce
  nitrogenFlushRecommended?: boolean;     // For chips, roasted nuts, milk powder
  moistureBarrierRequired?: boolean;      // For crisp snacks, powders, dry grains
  oxygenBarrierRequired?: boolean;        // For meats, seafood, chips, fatty foods
  lightBarrierRequired?: boolean;         // For milk, oils, spices
  greaseBarrierRequired?: boolean;        // For snacks, butter, baked goods
  aromaContainmentRequired?: boolean;     // For spices, pickles, fish
}

export interface FoodQuantitySpec {
  weightPerUnit: number;
  unitType: 'g' | 'kg' | 'ml' | 'L' | 'mg';
  quantity: number;
  totalWeightGrams: number;
  estimatedVolumeMl?: number;
}

export interface PackagingSystemRecommendation {
  primaryPackaging: {
    type: string;
    material: string;
    reason: string;
    closureType?: string;
  };
  secondaryPackaging?: {
    type: string;
    material: string;
    reason: string;
    wallGrade?: string;
  };
  cushioning: {
    type: string;
    thicknessMm: number;
    material: string;
    arrangement: string;
  };
  packageDimensions: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
  };
  totalProductWeightGrams: number;
  totalPackageWeightGrams: number;
  environmentalRating: 'A+ (100% Circular/Bio)' | 'A (Molded Pulp / Paper)' | 'B (Recyclable Polymer)' | 'C (Multi-Material Barrier)';
  environmentalPreferenceRationale: string;
  protectionRequirements: string[];
  selectionReasoning: string[];
  foodStateRequirements: string[];
}

export interface FoodOntologyHierarchy {
  kingdom: 'Plantae' | 'Animalia' | 'Fungi' | 'Mineralia' | 'Composite / Processed' | 'Processed Bakery' | 'Processed Liquids' | (string & {});
  foodFamily: string;          // Taxonomic/Botanical family (e.g. "Anacardiaceae", "Rosaceae", "Solanaceae", "Salmonidae")
  foodCategory: string;        // High-level category (e.g. "Fresh Fruits", "Vegetables & Fungi", "Grains & Cereals")
  foodSubCategory: string;     // Specific category (e.g. "Tropical Stone Fruit", "Pome Fruit", "Oily Marine Fish")
  foodType: string;            // Common type (e.g. "Mango", "Strawberry", "Salmon", "Tomato", "Rice")
  specificVariety: string;     // Exact cultivar or breed (e.g. "Ratnagiri Alphonso (Grade A Export)")
  foodState?: FoodState;       // Preservation state (fresh, frozen, dried, etc.)
  physicalState?: FoodPhysicalState; // Rheological state (liquid, powder, granular, etc.)
  preparationState: string;    // Human-readable preparation & handling description
  originRegion?: string;       // Geographic and cultural origin (e.g. "South Asia (India)", "Nordic Waters (Norway)")
  globalClimateZone?: 'Tropical' | 'Subtropical' | 'Temperate' | 'Boreal / Maritime' | 'Arid / Mediterranean' | (string & {});
  regionalNames?: { [key: string]: string }; // Regional Indian/Global names (e.g. { hindi: 'अंडा', tamil: 'முட்டை' })
  aliases?: string[];          // Search aliases
  foodOnTermId?: string;       // e.g. "FOODON:03301389"
  usdaFdcId?: string;          // e.g. "169910"
  fooDbId?: string;            // e.g. "FOOD00293"
  openFoodFactsCode?: string;  // e.g. "3017620422003"
  agrovocUri?: string;         // FAO AGROVOC vocabulary URI
}

export type ShapeArchetype =
  | 'ellipsoid'       // Mango, peach, avocado
  | 'spherical'       // Apple, orange, tomato, cherry
  | 'cylindrical'     // Bottle, jar, can, cucumber
  | 'cuboid'          // Boxed butter, tofu, block cheese
  | 'tiered'          // Layer cake, stepped pastry
  | 'cluster'         // Grapes, berries, cherry tomatoes
  | 'conical'         // Strawberries, carrots, peppers
  | 'slab'            // Salmon fillet, steak, brownie
  | 'cap'             // Mushroom, tart
  | 'ovoid'           // Chicken egg
  | 'granular'        // Rice, quinoa, chia seeds
  | 'irregular';      // Bread loaf, root ginger

export interface PhysicalProperties {
  typicalWeightGrams: ProvenanceRecord<number>;
  dimensionsMm: ProvenanceRecord<{ length: number; width: number; height: number }>;
  densityGPerCm3: ProvenanceRecord<number>;
  shapeArchetype: ShapeArchetype;
  aspectRatio: number; // Length / Width
  centerOfGravity: 'Centered' | 'Top-Heavy' | 'Low-Base' | 'Asymmetric';
  skinType: 'Thin Epidermis' | 'Waxy Cuticle' | 'Hard Shell / Rind' | 'Delicate Crumb' | 'Rigid Flint Glass' | 'Parenchyma Flesh' | 'Fish Skin / Scales' | 'Husk / Pericarp';
  peelThicknessMm?: ProvenanceRecord<number>;
  naturalTurgorPressureKPa?: ProvenanceRecord<number>;
}

export interface MechanicalProperties {
  fragilityGrade: 'Delicate' | 'High' | 'Extreme' | 'Moderate' | 'Low';
  fragilityScore: number; // 1 - 100 index
  criticalDecelerationG: ProvenanceRecord<number>; // Max peak G before bruising, rupture, or shattering
  dropShockToleranceMm: ProvenanceRecord<number>;  // Drop height threshold onto flat steel/concrete
  resonantFrequencyHz: ProvenanceRecord<{ min: number; max: number }>; // Critical vehicle vibration band
  compressionStrengthN: ProvenanceRecord<number>; // Max static compressive load before deformation
  crushDeflectionLimitMm: ProvenanceRecord<number>; // Max deflection before tissue rupture
  punctureResistanceN: ProvenanceRecord<number>;  // Puncture threshold
  abrasionSensitivity: 'Low' | 'Moderate' | 'High' | 'Severe (Surface Scuffing)';
  internalDampingRatio: number; // Biological damping ratio (0.05 to 0.40)
}

export interface EnvironmentalProperties {
  optimalStorageTempC: ProvenanceRecord<{ min: number; max: number }>;
  freezingPointC: ProvenanceRecord<number>;
  chillingInjuryThresholdC?: ProvenanceRecord<number>;
  heatDamageThresholdC: ProvenanceRecord<number>;
  optimalRelativeHumidityPct: ProvenanceRecord<{ min: number; max: number }>;
  moistureSensitivity: 'Hygroscopic' | 'Condensation Sensitive' | 'Desiccation Sensitive' | 'Impervious';
  respirationRateMgCO2PerKgHr?: ProvenanceRecord<number>; // For produce (at 10-15°C)
  ethyleneProduction: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' | 'Non-Applicable';
  ethyleneSensitivity: 'Low' | 'Moderate' | 'High' | 'Extremely Sensitive' | 'Non-Applicable';
  lightSensitivity: 'Low' | 'Moderate' | 'High (Photodegradation of Vit/Color)' | 'Severe';
  oxygenSensitivity: 'Low' | 'Moderate' | 'High (Oxidative Rancidity / Browning)' | 'Critical';
}

export interface StorageShelfLife {
  perishabilityTier: 'Ultra-Perishable (<4 days)' | 'Perishable (5-14 days)' | 'Semi-Perishable (15-60 days)' | 'Shelf-Stable (>60 days)';
  ambientShelfLifeDays: ProvenanceRecord<number>;
  coldChainShelfLifeDays: ProvenanceRecord<number>;
  coldChainClass: 'Strict Cryo-Frozen (-25°C to -18°C)' | 'Strict Ultra-Chill (0°C to 2°C)' | 'Refrigerated Chilled (2°C to 8°C)' | 'Cool Ambient (12°C to 18°C)' | 'Ambient Dry (18°C to 25°C)';
  criticalFailureMode: string;
  secondaryFailureModes: string[];
}

export interface CompositionalData {
  waterContentPct: ProvenanceRecord<number>;
  energyKcalPer100g?: ProvenanceRecord<number>;
  proteinPct: ProvenanceRecord<number>;
  fatPct: ProvenanceRecord<number>;
  carbohydratePct: ProvenanceRecord<number>;
  dietaryFiberPct?: ProvenanceRecord<number>;
  sugarsPct?: ProvenanceRecord<number>;
  ashPct?: ProvenanceRecord<number>;
  sodiumMgPer100g?: ProvenanceRecord<number>;
  vitaminCMgPer100g?: ProvenanceRecord<number>;
  waterActivityAw?: ProvenanceRecord<number>; // aw (0.0 to 1.0)
  pH?: ProvenanceRecord<number>;
  titratableAcidityPct?: ProvenanceRecord<number>;
  lipidOxidationRisk?: 'Low' | 'Moderate' | 'High' | 'Critical (Rancidity Risk)';
}

export interface FoodProfile {
  id: string;
  commonName: string;
  scientificName: string;
  synonyms: string[];
  description: string;
  accentColor: string;
  badge: string;
  ontology: FoodOntologyHierarchy;
  physical: PhysicalProperties;
  mechanical: MechanicalProperties;
  environmental: EnvironmentalProperties;
  shelfLife: StorageShelfLife;
  composition: CompositionalData;
  functionalNeeds?: FunctionalProtectionNeeds;
  defaultQuantity?: number;
  sourceCitations: {
    primaryDatabase: DataSourceId;
    databaseIdentifier: string;
    curatorNotes: string;
    lastUpdated: string;
  };
}

export interface EngineeringPackagingRecommendation {
  foodId: string;
  derivedBoxDimensionsMm: {
    length: number;
    width: number;
    height: number;
  };
  recommendedCushionThicknessMm: number;
  cushionMaterialRecommended: 'Standard Open-Cell Foam' | 'Molded Bio-Pulp' | 'Honeycomb Hex-Cushion' | 'Aerogel Barrier';
  dampingCoeffRecommended: number;
  outerCorrugateGradeRecommended: 'Single-Wall Kraft Corrugated' | 'Double-Wall Micro-Flute' | 'Reinforced Quad-Kraft';
  insertTypeRecommended: 'cradle' | 'collar' | 'bottle-bracket' | 'tomato-nest' | 'cell' | 'partition' | 'tray-cavity';
  barrierLayerRequired: boolean;
  barrierType: 'None' | 'Hydrophobic Bio-Wax Liner' | 'Vacuum Metalized Thermal Shield' | 'Desiccant Moisture Trap';
  rationale: string[];
}

/**
 * Hierarchical taxonomy tree node for nested catalog navigation.
 */
export interface TaxonomyTreeNode {
  id: string;
  name: string;
  level: 'kingdom' | 'category' | 'subcategory' | 'foodType' | 'variety' | 'state';
  count: number;
  states: FoodState[];
  foodIds: string[];
  children?: TaxonomyTreeNode[];
}

export interface TaxonomySummary {
  totalFoods: number;
  kingdomsCount: number;
  categoriesCount: number;
  familiesCount: number;
  distinctStates: FoodState[];
  provenanceBreakdown: Record<DataSourceId, number>;
}

export interface ProvenanceAuditReport {
  foodId: string;
  commonName: string;
  scientificName: string;
  taxonomyPath: string;
  primarySource: DataSourceId;
  sourceIdentifier: string;
  confidenceAverage: number;
  propertiesAudit: {
    propertyName: string;
    category: 'Taxonomy' | 'Physical' | 'Mechanical' | 'Environmental' | 'Compositional';
    value: string;
    source: DataSourceId;
    sourceId?: string;
    confidence: number;
    isRawSourceData: boolean;
  }[];
}

