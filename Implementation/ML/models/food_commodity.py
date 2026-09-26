from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any


@dataclass
class FoodCommodityProfile:
    """
    Generic engineering profile for a food commodity.

    PACKINTELLECT uses these properties to translate a food product
    into packaging requirements and potential failure mechanisms.

    The profile is intentionally commodity-agnostic.
    """

    name: str

    # Physical characteristics
    weight_g: float
    density_g_cm3: Optional[float] = None
    shape_factor: float = 0.5

    # Mechanical sensitivity
    fragility_score: float = 0.5
    crush_sensitivity: float = 0.5
    deformation_sensitivity: float = 0.5

    # Environmental sensitivity
    moisture_sensitivity: float = 0.5
    humidity_sensitivity: float = 0.5
    oxygen_sensitivity: float = 0.5
    light_sensitivity: float = 0.5

    # Thermal characteristics
    temperature_sensitivity: float = 0.5
    freezing_sensitivity: float = 0.5

    # Food-condition characteristics
    perishability_score: float = 0.5
    leakage_risk: float = 0.0
    contamination_risk: float = 0.5

    # Shelf-life requirement
    target_shelf_life_days: Optional[float] = None

    # Optional commodity metadata
    category: Optional[str] = None
    state: Optional[str] = None

    def validate(self) -> None:
        """
        Validate engineering scores.
        """

        score_fields = [
            "shape_factor",
            "fragility_score",
            "crush_sensitivity",
            "deformation_sensitivity",
            "moisture_sensitivity",
            "humidity_sensitivity",
            "oxygen_sensitivity",
            "light_sensitivity",
            "temperature_sensitivity",
            "freezing_sensitivity",
            "perishability_score",
            "leakage_risk",
            "contamination_risk",
        ]

        for field in score_fields:
            value = getattr(self, field)

            if not 0.0 <= value <= 1.0:
                raise ValueError(
                    f"{field} must be between 0 and 1. "
                    f"Received: {value}"
                )

        if self.weight_g <= 0:
            raise ValueError("weight_g must be greater than 0.")

        if self.target_shelf_life_days is not None:
            if self.target_shelf_life_days <= 0:
                raise ValueError(
                    "target_shelf_life_days must be greater than 0."
                )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the profile into a dictionary for ML pipelines.
        """

        self.validate()
        return asdict(self)

    def mechanical_risk(self) -> float:
        """
        Aggregate mechanical sensitivity.
        """

        return (
            0.45 * self.fragility_score
            + 0.30 * self.crush_sensitivity
            + 0.25 * self.deformation_sensitivity
        )

    def environmental_risk(self) -> float:
        """
        Aggregate environmental sensitivity.
        """

        return (
            0.25 * self.moisture_sensitivity
            + 0.20 * self.humidity_sensitivity
            + 0.25 * self.oxygen_sensitivity
            + 0.15 * self.light_sensitivity
            + 0.15 * self.temperature_sensitivity
        )

    def overall_product_risk(self) -> float:
        """
        Estimate the intrinsic product-side packaging risk.

        This is NOT a final packaging failure prediction.
        It represents the product's inherent sensitivity before
        considering packaging and journey conditions.
        """

        risk = (
            0.30 * self.mechanical_risk()
            + 0.25 * self.environmental_risk()
            + 0.20 * self.perishability_score
            + 0.10 * self.contamination_risk
            + 0.10 * self.leakage_risk
            + 0.05 * self.freezing_sensitivity
        )

        return round(min(max(risk, 0.0), 1.0), 4)


def create_food_profile(
    name: str,
    weight_g: float,
    **properties
) -> FoodCommodityProfile:
    """
    Create and validate a food commodity profile.

    This allows PACKINTELLECT to accept new food commodities
    without changing the underlying ML architecture.
    """

    profile = FoodCommodityProfile(
        name=name,
        weight_g=weight_g,
        **properties
    )

    profile.validate()

    return profile


if __name__ == "__main__":

    # Example only — not a restricted product list.
    example = create_food_profile(
        name="Example_Food",
        weight_g=250,
        category="General",
        state="Solid",
        fragility_score=0.7,
        crush_sensitivity=0.6,
        deformation_sensitivity=0.7,
        moisture_sensitivity=0.5,
        humidity_sensitivity=0.6,
        oxygen_sensitivity=0.4,
        temperature_sensitivity=0.5,
        perishability_score=0.7,
        contamination_risk=0.6,
        target_shelf_life_days=7,
    )

    print("✅ Food Commodity Intelligence layer ready")
    print("Commodity:", example.name)
    print("Product risk:", example.overall_product_risk())
