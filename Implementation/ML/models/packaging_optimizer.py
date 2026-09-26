from copy import deepcopy

from food_commodity import FoodCommodityProfile
from food_to_packaging import food_profile_to_scenario
from global_food_predictor import GlobalFoodPackagingPredictor


class PackagingOptimizer:

    FAILURE_SCORE = {
        "No_Failure": 0.0,
        "Minor_Damage": 1.0,
        "Major_Damage": 2.0,
        "Critical_Failure": 3.0,
    }

    def __init__(self):
        print("🚀 Initializing PACKINTELLECT Fast ML Optimizer...")

        self.predictor = GlobalFoodPackagingPredictor()

        print("✅ Fast ML optimizer ready")

    def expected_damage(self, prediction):

        p = prediction["probabilities"]

        return (
            3.0 * p.get("Critical_Failure", 0)
            + 2.0 * p.get("Major_Damage", 0)
            + 1.0 * p.get("Minor_Damage", 0)
        ) / 100.0

    def serious_damage(self, prediction):

        p = prediction["probabilities"]

        return (
            p.get("Critical_Failure", 0)
            + p.get("Major_Damage", 0)
        )

    def needs_redesign(self, prediction):

        p = prediction["probabilities"]

        no_failure = p.get(
            "No_Failure",
            0
        )

        serious = self.serious_damage(
            prediction
        )

        return (
            no_failure < 70
            or serious > 25
        )

    def generate_candidates(self, scenario):

        candidates = []

        # --------------------------------------------------
        # Candidate 1
        # Balanced structural protection
        # --------------------------------------------------

        c1 = deepcopy(scenario)

        c1["package_thickness_mm"] = min(
            scenario["package_thickness_mm"] + 2.0,
            10.0
        )

        c1["cushioning_thickness_mm"] = min(
            scenario["cushioning_thickness_mm"] + 5.0,
            30.0
        )

        candidates.append({
            "name":
                "Balanced Protective Package",

            "reason":
                "Balanced structural and cushioning reinforcement",

            "scenario":
                c1
        })

        # --------------------------------------------------
        # Candidate 2
        # High-impact protection
        # --------------------------------------------------

        c2 = deepcopy(scenario)

        c2["package_material"] = (
            "Molded_Pulp"
        )

        c2["package_thickness_mm"] = min(
            scenario["package_thickness_mm"] + 1.5,
            10.0
        )

        c2["cushioning_type"] = "Foam"

        c2["cushioning_thickness_mm"] = min(
            max(
                scenario["cushioning_thickness_mm"],
                15.0
            ),
            30.0
        )

        candidates.append({
            "name":
                "Impact-Resistant Package",

            "reason":
                "Material and cushioning selected for mechanical protection",

            "scenario":
                c2
        })

        # --------------------------------------------------
        # Candidate 3
        # Maximum practical protection
        # --------------------------------------------------

        c3 = deepcopy(scenario)

        c3["package_material"] = (
            "Corrugated_Cardboard"
        )

        c3["package_thickness_mm"] = 8.0

        c3["cushioning_type"] = "Foam"

        c3["cushioning_thickness_mm"] = 25.0

        candidates.append({
            "name":
                "High-Protection Package",

            "reason":
                "Higher protection configuration for severe predicted risk",

            "scenario":
                c3
        })

        return candidates

    def optimize(
        self,
        food: FoodCommodityProfile,
        **packaging_and_journey
    ):

        # ==================================================
        # V1
        # ==================================================

        scenario_v1 = food_profile_to_scenario(
            food,
            **packaging_and_journey
        )

        print("\n🧪 Running V1 virtual test...")

        prediction_v1 = self.predictor.predict(
            scenario_v1
        )

        print(
            "V1:",
            prediction_v1["predicted_failure"]
        )

        # ==================================================
        # Check whether redesign is necessary
        # ==================================================

        redesign_required = self.needs_redesign(
            prediction_v1
        )

        if not redesign_required:

            return {
                "redesign_required": False,

                "version_1": {
                    "scenario":
                        scenario_v1,

                    "prediction":
                        prediction_v1,

                    "expected_damage":
                        self.expected_damage(
                            prediction_v1
                        ),
                },

                "version_2": None,

                "candidates": [],

                "status":
                    "V1 accepted for virtual pre-validation"
            }

        # ==================================================
        # Generate ONLY 3 candidates
        # ==================================================

        candidates = self.generate_candidates(
            scenario_v1
        )

        evaluated = []

        # ==================================================
        # ML RE-TEST
        # ==================================================

        for index, candidate in enumerate(
            candidates,
            start=1
        ):

            print(
                f"\n🧠 ML re-test {index}/3:"
            )

            print(
                candidate["name"]
            )

            prediction = self.predictor.predict(
                candidate["scenario"]
            )

            damage = self.expected_damage(
                prediction
            )

            print(
                "Result:",
                prediction["predicted_failure"]
            )

            print(
                "Expected damage:",
                round(
                    damage,
                    4
                )
            )

            evaluated.append({

                "name":
                    candidate["name"],

                "reason":
                    candidate["reason"],

                "scenario":
                    candidate["scenario"],

                "prediction":
                    prediction,

                "expected_damage":
                    damage,
            })

        # ==================================================
        # ML-SELECTED V2
        # ==================================================

        best = min(
            evaluated,
            key=lambda x:
                x["expected_damage"]
        )

        v1_damage = self.expected_damage(
            prediction_v1
        )

        improvement = 0.0

        if v1_damage > 0:

            improvement = (
                (
                    v1_damage
                    - best["expected_damage"]
                )
                / v1_damage
            ) * 100.0

        return {

            "redesign_required":
                True,

            "version_1": {

                "scenario":
                    scenario_v1,

                "prediction":
                    prediction_v1,

                "expected_damage":
                    v1_damage,
            },

            "version_2": {

                "name":
                    best["name"],

                "reason":
                    best["reason"],

                "scenario":
                    best["scenario"],

                "prediction":
                    best["prediction"],

                "expected_damage":
                    best["expected_damage"],

                "improvement_percent":
                    improvement,
            },

            "candidates":
                evaluated,

            "status":
                "ML-guided virtual redesign completed"
        }


if __name__ == "__main__":

    # ==================================================
    # DEMO FOOD
    # ==================================================

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

    optimizer = PackagingOptimizer()

    result = optimizer.optimize(

        food,

        package_material=
            "Corrugated_Cardboard",

        package_thickness_mm=
            5.0,

        cushioning_type=
            "Foam",

        cushioning_thickness_mm=
            15.0,

        stacking_load_kg=
            10.0,

        transport_distance_km=
            100,

        transport_mode=
            "Two_Wheeler",

        vibration_level=
            0.70,

        impact_count=
            6,

        temperature_c=
            30,

        humidity_percent=
            70,

        drop_height_cm=
            40,

        compression_load_kg=
            20,
    )

    print("\n")
    print("=" * 55)
    print("       PACKINTELLECT VIRTUAL ENGINEERING LAB")
    print("=" * 55)

    v1 = result["version_1"]

    print("\n📦 V1 PACKAGING")
    print("-" * 55)

    print(
        "Predicted failure:",
        v1["prediction"]["predicted_failure"]
    )

    print(
        "Expected damage:",
        round(
            v1["expected_damage"],
            4
        )
    )

    print(
        "Probabilities:",
        v1["prediction"]["probabilities"]
    )

    if not result["redesign_required"]:

        print("\n✅ V1 ACCEPTED")
        print(
            "No redesign required."
        )

    else:

        print(
            "\n⚠️ REDESIGN REQUIRED"
        )

        print(
            "\n🔬 ML CANDIDATE RESULTS"
        )

        print("-" * 55)

        for candidate in result["candidates"]:

            print(
                "\n",
                candidate["name"]
            )

            print(
                "  Failure:",
                candidate[
                    "prediction"
                ]["predicted_failure"]
            )

            print(
                "  Expected damage:",
                round(
                    candidate[
                        "expected_damage"
                    ],
                    4
                )
            )

        v2 = result["version_2"]

        print("\n")
        print("=" * 55)
        print("          ML-SELECTED V2 DESIGN")
        print("=" * 55)

        print(
            "\nDesign:",
            v2["name"]
        )

        print(
            "Reason:",
            v2["reason"]
        )

        print(
            "\nMaterial:",
            v2["scenario"][
                "package_material"
            ]
        )

        print(
            "Wall thickness:",
            v2["scenario"][
                "package_thickness_mm"
            ],
            "mm"
        )

        print(
            "Cushioning:",
            v2["scenario"][
                "cushioning_type"
            ]
        )

        print(
            "Cushion thickness:",
            v2["scenario"][
                "cushioning_thickness_mm"
            ],
            "mm"
        )

        print(
            "\nV2 predicted failure:",
            v2["prediction"][
                "predicted_failure"
            ]
        )

        print(
            "V2 expected damage:",
            round(
                v2["expected_damage"],
                4
            )
        )

        print(
            "Improvement:",
            round(
                v2["improvement_percent"],
                2
            ),
            "%"
        )

        print(
            "\nV2 probabilities:"
        )

        for label, probability in (
            v2["prediction"][
                "probabilities"
            ].items()
        ):

            print(
                f"  {label}: {probability}%"
            )

        print(
            "\n✅ ML-guided redesign completed"
        )

        print(
            "⚠️ Physical validation required"
        )




