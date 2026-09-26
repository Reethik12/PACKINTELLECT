import joblib
import pandas as pd
from pathlib import Path


class PackIntellectPredictor:
    """
    PACKINTELLECT inference layer.

    Uses the trained TabPFN classifier with the exact feature
    encoding used during training.
    """

    def __init__(self):
        model_path = (
            Path(__file__).resolve().parent
            / "packintellect_classifier.joblib"
        )

        dataset_path = (
            Path(__file__).resolve().parent.parent
            / "datasets"
            / "packaging_training.csv"
        )

        if not model_path.exists():
            raise FileNotFoundError(
                f"PACKINTELLECT model not found:\n{model_path}"
            )

        if not dataset_path.exists():
            raise FileNotFoundError(
                f"Training dataset not found:\n{dataset_path}"
            )

        self.model = joblib.load(model_path)

        # Recreate the exact feature schema used during training.
        reference_df = pd.read_csv(dataset_path)

        reference_X = reference_df.drop(
            columns=["predicted_failure"]
        )

        self.feature_columns = pd.get_dummies(
            reference_X,
            dtype=float
        ).columns.tolist()

        print("✅ PACKINTELLECT TabPFN model loaded")
        print(
            f"✅ Feature schema loaded: "
            f"{len(self.feature_columns)} features"
        )

    def predict(self, scenario):
        """
        Predict packaging failure for one scenario.

        scenario should contain the same raw input fields
        used by the training dataset.
        """

        input_df = pd.DataFrame([scenario])

        input_df = pd.get_dummies(
            input_df,
            dtype=float
        )

        # Match the exact training feature space.
        input_df = input_df.reindex(
            columns=self.feature_columns,
            fill_value=0.0
        )

        prediction = self.model.predict(input_df)[0]

        probabilities = {}

        if hasattr(self.model, "predict_proba"):
            raw_probabilities = self.model.predict_proba(
                input_df
            )[0]

            probabilities = {
                class_name: round(float(probability) * 100, 2)
                for class_name, probability in zip(
                    self.model.classes_,
                    raw_probabilities
                )
            }

        return {
            "predicted_failure": prediction,
            "probabilities": probabilities
        }


if __name__ == "__main__":

    print("🚀 PACKINTELLECT Packaging Predictor")

    predictor = PackIntellectPredictor()

    # Temporary test scenario.
    # This matches the structure of the current MVP dataset.
    test_scenario = {
        "product_type": "Glass_Bottle",
        "product_weight_g": 685,
        "fragility_score": 0.95,
        "package_material": "Molded_Pulp",
        "package_thickness_mm": 2.41,
        "cushioning_type": "None",
        "cushioning_thickness_mm": 1.35,
        "stacking_load_kg": 31.23,
        "transport_distance_km": 44.4,
        "transport_mode": "Air",
        "vibration_level": 0.129,
        "impact_count": 1,
        "temperature_c": 21.6,
        "humidity_percent": 62.8,
        "drop_height_cm": 3.2,
        "compression_load_kg": 19.9
    }

    result = predictor.predict(test_scenario)

    print("\nPrediction:")
    print(result)
