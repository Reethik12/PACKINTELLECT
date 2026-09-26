import pandas as pd
import joblib
from pathlib import Path


class GlobalFoodPackagingPredictor:

    def __init__(self):
        current_dir = Path(__file__).resolve().parent

        self.model_path = (
            current_dir / "packintellect_global_food_classifier.joblib"
        )

        self.dataset_path = (
            current_dir.parent / "datasets" /
            "global_food_packaging_training.csv"
        )

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {self.model_path}"
            )

        if not self.dataset_path.exists():
            raise FileNotFoundError(
                f"Dataset not found: {self.dataset_path}"
            )

        print("Loading PACKINTELLECT Global Food model...")

        self.model = joblib.load(self.model_path)

        # Reconstruct the exact feature schema used during training.
        df = pd.read_csv(self.dataset_path)

        X = df.drop(columns=["predicted_failure"])

        self.feature_columns = pd.get_dummies(
            X,
            dtype=float
        ).columns.tolist()

        print("✅ Global Food model loaded")
        print(f"✅ Feature schema: {len(self.feature_columns)} features")

    def predict(self, scenario):

        input_df = pd.DataFrame([scenario])

        input_df = pd.get_dummies(
            input_df,
            dtype=float
        )

        input_df = input_df.reindex(
            columns=self.feature_columns,
            fill_value=0
        )

        prediction = self.model.predict(input_df)[0]

        probabilities = {}

        if hasattr(self.model, "predict_proba"):
            raw = self.model.predict_proba(input_df)[0]

            probabilities = {
                class_name: round(float(probability) * 100, 2)
                for class_name, probability in zip(
                    self.model.classes_,
                    raw
                )
            }

        return {
            "predicted_failure": prediction,
            "probabilities": probabilities
        }


if __name__ == "__main__":

    predictor = GlobalFoodPackagingPredictor()

    test_scenario = {
        "food_archetype": "Bakery",
        "product_weight_g": 500,
        "fragility_score": 0.85,
        "moisture_sensitivity": 0.60,
        "temperature_sensitivity": 0.50,
        "perishability_score": 0.70,
        "oxygen_sensitivity": 0.50,
        "crush_sensitivity": 0.80,
        "deformation_sensitivity": 0.75,
        "leakage_risk": 0.10,
        "package_material": "Corrugated_Cardboard",
        "package_thickness_mm": 5.0,
        "cushioning_type": "Foam",
        "cushioning_thickness_mm": 15.0,
        "stacking_load_kg": 10.0,
        "transport_distance_km": 100,
        "transport_mode": "Two_Wheeler",
        "vibration_level": 0.70,
        "impact_count": 6,
        "temperature_c": 30,
        "humidity_percent": 70,
        "drop_height_cm": 40,
        "compression_load_kg": 20
    }

    result = predictor.predict(test_scenario)

    print("\n================================")
    print("PACKINTELLECT PREDICTION")
    print("================================")

    print("Predicted failure:", result["predicted_failure"])

    print("\nProbabilities:")
    for label, probability in result["probabilities"].items():
        print(f"{label}: {probability}%")
