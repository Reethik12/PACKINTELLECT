import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from tabpfn import TabPFNClassifier


# -----------------------------
# 1. Load PACKINTELLECT dataset
# -----------------------------
DATASET = "../datasets/packaging_training.csv"

df = pd.read_csv(DATASET)

print("Dataset loaded:", df.shape)


# -----------------------------
# 2. Separate features / target
# -----------------------------
X = df.drop(columns=["predicted_failure"])
y = df["predicted_failure"]


# -----------------------------
# 3. Convert categorical data
# -----------------------------
X = pd.get_dummies(X, dtype=float)


# -----------------------------
# 4. Train / test split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# -----------------------------
# 5. PACKINTELLECT ML model
# -----------------------------
model = TabPFNClassifier(
    device="cpu"
)

print("\nTraining PACKINTELLECT classifier...")

model.fit(X_train, y_train)

import joblib
joblib.dump(model, "../models/packintellect_classifier.joblib")
print("Saved: ../models/packintellect_classifier.joblib")


# -----------------------------
# 6. Evaluate
# -----------------------------
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\n================================")
print("PACKINTELLECT MODEL RESULTS")
print("================================")

print(f"Accuracy: {accuracy:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, predictions))