from food_commodity import FoodCommodityProfile
from food_to_packaging import food_profile_to_scenario
from global_food_predictor import GlobalFoodPackagingPredictor


class PackIntellectEngine:

    def __init__(self):
        print("🚀 Initializing PACKINTELLECT Engine...")

        self.predictor = GlobalFoodPackagingPredictor()

        print("✅ PACKINTELLECT Engine ready")

    def analyze(
        self,
        food: FoodCommodityProfile,
        **packaging_and_journey
    ):
        """
        Complete PACKINTELLECT intelligence pipeline:

        Food profile
            ↓
        Engineering translation
            ↓
        Global food-packaging ML model
            ↓
        Failure prediction
        """

        scenario = food_profile_to_scenario(
            food,
            **packaging_and_journey
        )

        prediction = self.predictor.predict(
            scenario
        )

        return {
            "food": food.to_dict(),
            "engineering_scenario": scenario,
            "prediction": prediction,
        }


if __name__ == "__main__":

    # Example: fragile bakery product
    food = FoodCommodityProfile(
        name="Example_Cake",
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

    engine = PackIntellectEngine()

    result = engine.analyze(
        food,
        package_material="Corrugated_Cardboard",
        package_thickness_mm=5.0,
        cushioning_type="Foam",
        cushioning_thickness_mm=15.0,
        stacking_load_kg=10.0,
        transport_distance_km=100,
        transport_mode="Two_Wheeler",
        vibration_level=0.70,
        impact_count=6,
        temperature_c=30,
        humidity_percent=70,
        drop_height_cm=40,
        compression_load_kg=20,
    )

    print("\n========================================")
    print("PACKINTELLECT ENGINE RESULT")
    print("========================================")

    print("\nFood:")
    print(result["food"])

    print("\nPredicted Failure:")
    print(
        result["prediction"]["predicted_failure"]
    )

    print("\nFailure Probabilities:")

    for label, probability in result[
        "prediction"
    ]["probabilities"].items():

        print(f"{label}: {probability}%")
