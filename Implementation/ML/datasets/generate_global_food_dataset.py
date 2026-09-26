import random
import pandas as pd


random.seed(42)

ARCHETYPES = {
    "Fresh_Produce": {
        "fragility": (0.45, 0.80),
        "moisture": (0.70, 0.95),
        "temperature": (0.60, 0.90),
        "perishability": (0.70, 0.95),
        "oxygen": (0.40, 0.70),
        "crush": (0.40, 0.75),
        "deformation": (0.45, 0.80),
        "leakage": (0.20, 0.60),
    },
    "Bakery": {
        "fragility": (0.65, 0.95),
        "moisture": (0.40, 0.75),
        "temperature": (0.30, 0.65),
        "perishability": (0.45, 0.80),
        "oxygen": (0.30, 0.60),
        "crush": (0.60, 0.90),
        "deformation": (0.60, 0.90),
        "leakage": (0.05, 0.25),
    },
    "Dairy": {
        "fragility": (0.45, 0.75),
        "moisture": (0.60, 0.90),
        "temperature": (0.75, 0.98),
        "perishability": (0.75, 0.98),
        "oxygen": (0.35, 0.65),
        "crush": (0.35, 0.70),
        "deformation": (0.40, 0.75),
        "leakage": (0.40, 0.80),
    },
    "Meat_Seafood": {
        "fragility": (0.45, 0.75),
        "moisture": (0.75, 0.98),
        "temperature": (0.85, 0.99),
        "perishability": (0.85, 0.99),
        "oxygen": (0.45, 0.80),
        "crush": (0.40, 0.75),
        "deformation": (0.35, 0.70),
        "leakage": (0.55, 0.90),
    },
    "Grains_Pulses": {
        "fragility": (0.30, 0.60),
        "moisture": (0.55, 0.85),
        "temperature": (0.20, 0.50),
        "perishability": (0.15, 0.40),
        "oxygen": (0.35, 0.65),
        "crush": (0.45, 0.75),
        "deformation": (0.30, 0.60),
        "leakage": (0.20, 0.50),
    },
    "Spices_Dry_Foods": {
        "fragility": (0.30, 0.60),
        "moisture": (0.75, 0.98),
        "temperature": (0.25, 0.55),
        "perishability": (0.15, 0.45),
        "oxygen": (0.55, 0.85),
        "crush": (0.35, 0.65),
        "deformation": (0.25, 0.55),
        "leakage": (0.30, 0.70),
    },
    "Beverages_Liquids": {
        "fragility": (0.55, 0.90),
        "moisture": (0.20, 0.40),
        "temperature": (0.30, 0.70),
        "perishability": (0.20, 0.65),
        "oxygen": (0.30, 0.65),
        "crush": (0.45, 0.80),
        "deformation": (0.35, 0.70),
        "leakage": (0.75, 0.98),
    },
    "Frozen_Foods": {
        "fragility": (0.40, 0.75),
        "moisture": (0.65, 0.95),
        "temperature": (0.90, 0.99),
        "perishability": (0.70, 0.95),
        "oxygen": (0.30, 0.60),
        "crush": (0.40, 0.75),
        "deformation": (0.35, 0.70),
        "leakage": (0.35, 0.75),
    },
    "Confectionery": {
        "fragility": (0.60, 0.95),
        "moisture": (0.45, 0.80),
        "temperature": (0.65, 0.95),
        "perishability": (0.25, 0.60),
        "oxygen": (0.35, 0.65),
        "crush": (0.55, 0.90),
        "deformation": (0.55, 0.90),
        "leakage": (0.10, 0.35),
    },
    "Processed_Packaged_Foods": {
        "fragility": (0.35, 0.70),
        "moisture": (0.45, 0.80),
        "temperature": (0.25, 0.65),
        "perishability": (0.20, 0.65),
        "oxygen": (0.40, 0.75),
        "crush": (0.40, 0.75),
        "deformation": (0.30, 0.65),
        "leakage": (0.15, 0.50),
    },
}


PACKAGE_MATERIALS = [
    "Corrugated_Cardboard",
    "Molded_Pulp",
    "Foam_Box",
    "Plastic_Container",
]

CUSHIONING_TYPES = [
    "None",
    "Foam",
    "Bubble_Wrap",
    "Paper",
]

TRANSPORT_MODES = [
    "Two_Wheeler",
    "Truck",
    "Air",
    "Rail",
]


def random_value(value_range):
    return round(random.uniform(*value_range), 3)


def generate_row():
    archetype = random.choice(list(ARCHETYPES.keys()))
    profile = ARCHETYPES[archetype]

    fragility = random_value(profile["fragility"])
    moisture = random_value(profile["moisture"])
    temperature_sensitivity = random_value(profile["temperature"])
    perishability = random_value(profile["perishability"])
    oxygen = random_value(profile["oxygen"])
    crush = random_value(profile["crush"])
    deformation = random_value(profile["deformation"])
    leakage = random_value(profile["leakage"])

    weight = round(random.uniform(50, 2500), 1)

    package_material = random.choice(PACKAGE_MATERIALS)
    cushioning = random.choice(CUSHIONING_TYPES)

    package_thickness = round(random.uniform(1, 10), 2)
    cushioning_thickness = (
        0 if cushioning == "None"
        else round(random.uniform(3, 30), 2)
    )

    stacking_load = round(random.uniform(0.1, 50), 2)
    distance = round(random.uniform(1, 1500), 1)

    transport_mode = random.choice(TRANSPORT_MODES)

    vibration = random.uniform(0.05, 1.0)
    impacts = random.randint(0, 20)
    temperature = random.uniform(0, 45)
    humidity = random.uniform(20, 98)
    drop_height = random.uniform(0, 150)
    compression = random.uniform(1, 120)

    mechanical_risk = (
        0.28 * fragility
        + 0.18 * crush
        + 0.14 * deformation
        + 0.12 * vibration
        + 0.10 * (impacts / 20)
        + 0.10 * (drop_height / 150)
        + 0.08 * (compression / 120)
    )

    environmental_risk = (
        0.28 * moisture * (humidity / 100)
        + 0.20 * temperature_sensitivity * (temperature / 45)
        + 0.17 * oxygen
        + 0.20 * perishability * (temperature / 45)
        + 0.15 * leakage
    )

    protection = (
        0.30 * min(package_thickness / 10, 1)
        + 0.25 * min(cushioning_thickness / 30, 1)
        + 0.20 * max(0, 1 - vibration)
        + 0.15 * max(0, 1 - impacts / 20)
        + 0.10 * max(0, 1 - drop_height / 150)
    )

    total_risk = (
        0.55 * mechanical_risk
        + 0.30 * environmental_risk
        + 0.15 * (1 - protection)
    )

    total_risk += random.uniform(-0.035, 0.035)

    # Engineering risk bands calibrated for the synthetic MVP dataset.
    if total_risk >= 0.60:
        failure = "Critical_Failure"
    elif total_risk >= 0.52:
        failure = "Major_Damage"
    elif total_risk >= 0.48:
        failure = "Minor_Damage"
    else:
        failure = "No_Failure"

    return {
        "food_archetype": archetype,
        "product_weight_g": weight,
        "fragility_score": round(fragility, 3),
        "moisture_sensitivity": round(moisture, 3),
        "temperature_sensitivity": round(temperature_sensitivity, 3),
        "perishability_score": round(perishability, 3),
        "oxygen_sensitivity": round(oxygen, 3),
        "crush_sensitivity": round(crush, 3),
        "deformation_sensitivity": round(deformation, 3),
        "leakage_risk": round(leakage, 3),
        "package_material": package_material,
        "package_thickness_mm": package_thickness,
        "cushioning_type": cushioning,
        "cushioning_thickness_mm": cushioning_thickness,
        "stacking_load_kg": round(stacking_load, 2),
        "transport_distance_km": distance,
        "transport_mode": transport_mode,
        "vibration_level": round(vibration, 3),
        "impact_count": impacts,
        "temperature_c": round(temperature, 2),
        "humidity_percent": round(humidity, 2),
        "drop_height_cm": round(drop_height, 2),
        "compression_load_kg": round(compression, 2),
        "predicted_failure": failure,
    }


ROWS = 5000

data = [generate_row() for _ in range(ROWS)]

df = pd.DataFrame(data)

OUTPUT = "../datasets/global_food_packaging_training.csv"

df.to_csv(OUTPUT, index=False)

print("✅ Global food engineering dataset generated")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

print("\nFood engineering archetypes:")
print(df["food_archetype"].value_counts().to_string())

print("\nFailure distribution:")
print(df["predicted_failure"].value_counts().to_string())

print(f"\nSaved: {OUTPUT}")
