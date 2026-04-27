from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import re
import os
import gdown
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Google Drive file IDs ──
MODEL_FILES = {
    "model/tfidf.pkl":    "1Df8mOlcGfojR8Hj85Ec4tqieXqF_S0KA",
    "model/selector.pkl": "1Jlh_Mmy2dZHheEZPNN0RX6QmS3HI7tJP",
    "model/svd.pkl":      "10b-kEsVsE2XhQ9sfZdGfOHYXLSoZ4ygg",
    "model/scaler.pkl":   "1NjZW5hEUUw9b5wWOIM7CdTjZfYpA-4xw",
    "model/model.pkl":    "19OnYa2nE3COGaUgMrR2SZ2UHNArfrp4a",
}

os.makedirs("model", exist_ok=True)

for path, file_id in MODEL_FILES.items():
    if not os.path.exists(path):
        print(f"Downloading {path}...")
        gdown.download(f"https://drive.google.com/uc?id={file_id}", path, quiet=False)

# Load pipeline
tfidf    = joblib.load("model/tfidf.pkl")
selector = joblib.load("model/selector.pkl")
svd      = joblib.load("model/svd.pkl")
scaler   = joblib.load("model/scaler.pkl")
model    = joblib.load("model/model.pkl")

stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

all_feature_names = np.array(tfidf.get_feature_names_out())
selected_mask     = selector.get_support()
selected_features = all_feature_names[selected_mask]

def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-z\s]", "", text)
    words = text.split()
    words = [lemmatizer.lemmatize(w) for w in words if w not in stop_words]
    return " ".join(words)

def get_top_keywords(text: str, top_n: int = 10):
    vec      = tfidf.transform([text])
    selected = selector.transform(vec)
    scores   = selected.toarray()[0]
    top_idx  = scores.argsort()[::-1][:top_n]
    return [
        {"word": selected_features[i], "score": round(float(scores[i]), 4)}
        for i in top_idx if scores[i] > 0
    ]

class NewsInput(BaseModel):
    text: str

@app.get("/")
def root():
    return {"status": "ok", "service": "FakeGuard ML"}

@app.post("/predict")
def predict(news: NewsInput):
    cleaned  = clean_text(news.text)
    vec      = tfidf.transform([cleaned])
    selected = selector.transform(vec)
    reduced  = svd.transform(selected)
    scaled   = scaler.transform(reduced)

    prediction = model.predict(scaled)[0]
    try:
        proba      = model.predict_proba(scaled)[0]
        confidence = round(float(max(proba)) * 100, 2)
    except AttributeError:
        confidence = None

    keywords = get_top_keywords(cleaned)
    return {
        "prediction": "True" if prediction == 1 else "Fake",
        "confidence": confidence,
        "keywords":   keywords,
    }
