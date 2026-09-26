import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from tabpfn import TabPFNClassifier


DATASET = "../datasets/global_food_packaging_training.csv"
MODEL_OUTPUT = "../models/packintellect_global_food_classifier.joblib"


print("🚀 PACKINTELLECT Global Food Packaging Classifier")

# Load dataset
df = pd.read_csv(DATASET)

print("Dataset loaded:", df.shape)

# Target
X = df.drop(columns=["predicted_failure"])
y = df["predicted_failure"]

# Convert categorical variables to numerical features
X = pd.get_dummies(X, dtype=float)

print("Feature count:", X.shape[1])

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))

# Create specialized PACKINTELLECT model
model = TabPFNClassifier(
    device="cpu"
)

print("\n🧠 Training global food-packaging classifier...")

model.fit(X_train, y_train)

# Save model
joblib.dump(model, MODEL_OUTPUT)

print("\n✅ Model saved:")
print(MODEL_OUTPUT)

# Evaluate
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\n================================")
print("PACKINTELLECT GLOBAL FOOD MODEL")
print("================================")

print(f"Accuracy: {accuracy:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, predictions))
