import os
import joblib
import json
import pandas as pd


class PlayerValueModel:

    def __init__(self):
        base_path = os.path.dirname(__file__)  # absolute path inside wheel

        self.model = joblib.load(os.path.join(base_path, "svm_model.pkl"))
        self.scaler = joblib.load(os.path.join(base_path, "scaler.pkl"))
        self.encoder = joblib.load(os.path.join(base_path, "target_encoder.pkl"))

        with open(os.path.join(base_path, "selected_features.json"), "r") as f:
            self.selected_features = json.load(f)

    def preprocess(self, df: pd.DataFrame):
        df = df.copy()

        if "Pos" in df.columns:
            df["Pos"] = df["Pos"].str.split(",").str[0]

        df[["Nation", "Squad"]] = self.encoder.transform(df[["Nation", "Squad"]])

        X = df[self.selected_features]

        return self.scaler.transform(X)

    def predict(self, df: pd.DataFrame):
        X = self.preprocess(df)
        return self.model.predict(X).tolist()
