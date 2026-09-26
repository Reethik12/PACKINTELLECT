from food_commodity import FoodCommodityProfile


def food_profile_to_scenario(
    food: FoodCommodityProfile,
    package_material="Corrugated_Cardboard",
    package_thickness_mm=4.0,
    cushioning_type="Molded_Pulp",
    cushioning_thickness_mm=10.0,
    stacking_load_kg=10.0,
    transport_distance_km=100.0,
    transport_mode="Truck",
    vibration_level=0.5,
    impact_count=3,
    temperature_c=25.0,
    humidity_percent=60.0,
    drop_height_cm=30.0,
    compression_load_kg=20.0,
):
    """
    Convert a generic FoodCommodityProfile into the
    24-feature engineering representation used by
    the PACKINTELLECT global food-packaging model.
    """

    food.validate()

    # Generic engineering representation.
    # This avoids depending on a fixed list of food names.
    return {
        "food_archetype": food.category or "Processed_Packaged_Foods",

        "product_weight_g": food.weight_g,

        "fragility_score": round(
            food.fragility_score,
            4
        ),

        "moisture_sensitivity": round(
            food.moisture_sensitivity,
            4
        ),

        "temperature_sensitivity": round(
            food.temperature_sensitivity,
            4
        ),

        "perishability_score": round(
            food.perishability_score,
            4
        ),

        "oxygen_sensitivity": round(
            food.oxygen_sensitivity,
            4
        ),

        "crush_sensitivity": round(
            food.crush_sensitivity,
            4
        ),

        "deformation_sensitivity": round(
            food.deformation_sensitivity,
            4
        ),

        "leakage_risk": round(
            food.leakage_risk,
            4
        ),

        "package_material": package_material,
        "package_thickness_mm": package_thickness_mm,

        "cushioning_type": cushioning_type,
        "cushioning_thickness_mm": cushioning_thickness_mm,

        "stacking_load_kg": stacking_load_kg,

        "transport_distance_km": transport_distance_km,
        "transport_mode": transport_mode,

        "vibration_level": vibration_level,
        "impact_count": impact_count,

        "temperature_c": temperature_c,
        "humidity_percent": humidity_percent,

        "drop_height_cm": drop_height_cm,
        "compression_load_kg": compression_load_kg,
    }


if __name__ == "__main__":

    example_food = FoodCommodityProfile(
        name="Example_Food",
        category="Bakery",
        weight_g=500,
        fragility_score=0.85,
        crush_sensitivity=0.80,
        deformation_sensitivity=0.75,
        moisture_sensitivity=0.60,
        temperature_sensitivity=0.50,
        perishability_score=0.70,
        oxygen_sensitivity=0.50,
        leakage_risk=0.10,
    )

    scenario = food_profile_to_scenario(
        example_food,
        package_material="Corrugated_Cardboard",
        package_thickness_mm=5.0,
        cushioning_type="Foam",
        cushioning_thickness_mm=15.0,
        transport_distance_km=100,
        transport_mode="Two_Wheeler",
        vibration_level=0.70,
        impact_count=6,
        temperature_c=30,
        humidity_percent=70,
        drop_height_cm=40,
        compression_load_kg=20,
    )

    print("🚀 PACKINTELLECT Food → Global Engineering Translator")
    print("✅ Food profile converted successfully")
    print("\nGenerated scenario:")

    for key, value in scenario.items():
        print(f"{key}: {value}")
