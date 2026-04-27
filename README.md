# Fake News Detector — MERN + Python ML

## Architecture
React → Express/Node → FastAPI (Python ML) → MongoDB

## Setup

### 1. Save your trained model (run in your Colab/notebook)
```python
import joblib, os
os.makedirs("model", exist_ok=True)
joblib.dump(tfidf, "model/tfidf.pkl")
joblib.dump(selector, "model/selector.pkl")
joblib.dump(svd, "model/svd.pkl")
joblib.dump(scaler, "model/scaler.pkl")
joblib.dump(stacking_clf, "model/model.pkl")
```
Copy the `model/` folder into `ml_service/`.

### 2. Python ML Service
```bash
cd ml_service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 3. Node/Express Server
```bash
cd server
npm install
npm run dev
```

### 4. React Client
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173
