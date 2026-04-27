# Run this script after training to save all pipeline artifacts
# Copy your training code here and add these lines at the end:

import joblib
import os

os.makedirs("model", exist_ok=True)

joblib.dump(tfidf, "model/tfidf.pkl")
joblib.dump(selector, "model/selector.pkl")
joblib.dump(svd, "model/svd.pkl")
joblib.dump(scaler, "model/scaler.pkl")
joblib.dump(stacking_clf, "model/model.pkl")

print("All artifacts saved to model/")
