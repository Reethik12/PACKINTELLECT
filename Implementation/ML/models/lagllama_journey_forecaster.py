import sys
from pathlib import Path

import torch
from gluonts.dataset.common import ListDataset
from gluonts.evaluation import make_evaluation_predictions
from gluonts.torch.distributions.studentT import StudentTOutput
from gluonts.torch.modules.loss import NegativeLogLikelihood

# Allow trusted Lag-Llama checkpoint classes with modern PyTorch
torch.serialization.add_safe_globals([
    StudentTOutput,
    NegativeLogLikelihood
])

# Locate the cloned Lag-Llama repository
CURRENT_DIR = Path(__file__).resolve().parent
LAG_LLAMA_DIR = CURRENT_DIR.parent / "training" / "lag-llama"

if str(LAG_LLAMA_DIR) not in sys.path:
    sys.path.insert(0, str(LAG_LLAMA_DIR))

from lag_llama.gluon.estimator import LagLlamaEstimator


class PackIntellectJourneyForecaster:
    """
    PACKINTELLECT journey-signal forecasting using pretrained Lag-Llama.

    This component forecasts a single time-series signal such as:
        - vibration
        - temperature
        - humidity
        - impact/load

    It is a predictive engineering component, not a physical validation
    replacement.
    """

    def __init__(self, prediction_length=5, context_length=32):
        self.prediction_length = prediction_length
        self.context_length = context_length

        self.device = torch.device("cpu")

        self.checkpoint_path = (
            Path.home()
            / ".cache/huggingface/hub/models--time-series-foundation-models--Lag-Llama"
            / "snapshots/72dcfc29da106acfe38250a60f4ae29d1e56a3d9"
            / "lag-llama.ckpt"
        )

        if not self.checkpoint_path.exists():
            raise FileNotFoundError(
                f"Lag-Llama checkpoint not found:\n{self.checkpoint_path}"
            )

        checkpoint = torch.load(
            self.checkpoint_path,
            map_location="cpu",
            weights_only=False
        )

        model_args = checkpoint["hyper_parameters"]["model_kwargs"]

        self.estimator = LagLlamaEstimator(
            ckpt_path=str(self.checkpoint_path),
            prediction_length=self.prediction_length,
            context_length=self.context_length,
            input_size=model_args["input_size"],
            n_layer=model_args["n_layer"],
            n_embd_per_head=model_args["n_embd_per_head"],
            n_head=model_args["n_head"],
            scaling=model_args["scaling"],
            time_feat=model_args["time_feat"],
            batch_size=1,
            num_parallel_samples=100,
            device=self.device,
        )

        self.lightning_module = self.estimator.create_lightning_module()
        self.transformation = self.estimator.create_transformation()

        self.predictor = self.estimator.create_predictor(
            self.transformation,
            self.lightning_module
        )

    def forecast(self, values, start_date="2026-01-01", freq="D"):
        """
        Forecast future values from historical observations.

        Parameters
        ----------
        values : list
            Historical numerical observations.

        start_date : str
            Start date/time of the historical series.

        freq : str
            GluonTS frequency, e.g.:
            D = daily
            H = hourly
            10min = every 10 minutes

        Returns
        -------
        list
            Mean forecast values.
        """

        if len(values) < self.context_length:
            raise ValueError(
                f"Need at least {self.context_length} historical values. "
                f"Received {len(values)}."
            )

        dataset = ListDataset(
            [
                {
                    "start": start_date,
                    "target": values,
                }
            ],
            freq=freq,
        )

        forecast_iterator, _ = make_evaluation_predictions(
            dataset=dataset,
            predictor=self.predictor,
            num_samples=100,
        )

        forecast = list(forecast_iterator)[0]

        return forecast.mean.tolist()


if __name__ == "__main__":

    print("🚀 PACKINTELLECT Lag-Llama Journey Forecaster")

    # Temporary engineering test signal.
    # This will later be replaced with actual journey sensor data.
    test_values = [
        10, 12, 11, 14, 15, 16, 18, 17,
        20, 21, 22, 24, 23, 25, 27, 26,
        29, 30, 31, 33, 32, 35, 36, 38,
        37, 40, 41, 43, 42, 45, 46, 48,
        47, 50
    ]

    forecaster = PackIntellectJourneyForecaster(
        prediction_length=5,
        context_length=32
    )

    forecast = forecaster.forecast(
        test_values,
        start_date="2026-01-01",
        freq="D"
    )

    print("✅ Forecast generated successfully")
    print("Forecast:", forecast)

