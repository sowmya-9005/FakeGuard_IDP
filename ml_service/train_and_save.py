# ============================================================
# RUN THIS ENTIRE FILE IN GOOGLE COLAB
# It will train the model and download all .pkl files
# ============================================================

# Step 1: Import libraries
import pandas as pd
import re
import nltk
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from google.colab import files
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC, SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

try:
    from xgboost import XGBClassifier
    xgb_available = True
except ImportError:
    xgb_available = False

nltk.download("stopwords")
nltk.download("wordnet")
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Step 2: Upload files
print("Upload True.csv")
uploaded_true = files.upload()
print("Upload Fake.csv")
uploaded_fake = files.upload()

# Step 3: Read and combine
true_df = pd.read_csv("True.csv")
fake_df = pd.read_csv("Fake.csv")

true_clean = true_df[["title", "text", "subject", "date"]].copy()
fake_clean = fake_df[["title", "text", "subject", "date"]].copy()
true_clean["label"] = "True"
fake_clean["label"] = "Fake"

df = pd.concat([true_clean, fake_clean], ignore_index=True)
df["label"] = df["label"].map({"Fake": 0, "True": 1})

# Step 4: Preprocessing
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z\s]", "", text)
    words = text.split()
    words = [lemmatizer.lemmatize(w) for w in words if w not in stop_words]
    return " ".join(words)

df["content"] = (df["title"].fillna("") + " " + df["text"].fillna("")).apply(clean_text)

X = df["content"]
y = df["label"]

# Step 5: Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Step 6: TF-IDF
tfidf = TfidfVectorizer(max_features=100000, ngram_range=(1, 2))
X_train_tfidf = tfidf.fit_transform(X_train)
X_test_tfidf = tfidf.transform(X_test)

# Step 7: Feature Selection
selector = SelectKBest(chi2, k=50000)
X_train_selected = selector.fit_transform(X_train_tfidf, y_train)
X_test_selected = selector.transform(X_test_tfidf)

# Step 8: SVD
svd = TruncatedSVD(n_components=300)
X_train_reduced = svd.fit_transform(X_train_selected)
X_test_reduced = svd.transform(X_test_selected)

# Step 9: Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_reduced)
X_test_scaled = scaler.transform(X_test_reduced)

# Step 10: Build Stacking Ensemble
# NOTE: LinearSVC wrapped in CalibratedClassifierCV so we get predict_proba (confidence scores)
calibrated_svm = CalibratedClassifierCV(LinearSVC())

estimators = [
    ('lr', LogisticRegression(max_iter=2000)),
    ('svm', calibrated_svm),
    ('rf', RandomForestClassifier(n_estimators=300, random_state=42)),
]

if xgb_available:
    estimators.append(('xgb', XGBClassifier(eval_metric="logloss")))

stacking_clf = StackingClassifier(
    estimators=estimators,
    final_estimator=LogisticRegression(max_iter=2000),
    n_jobs=-1
)

print("\nTraining Stacking Ensemble... (this takes a few minutes)")
stacking_clf.fit(X_train_scaled, y_train)
y_pred = stacking_clf.predict(X_test_scaled)

print("Accuracy:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Greens",
            xticklabels=["Fake", "True"], yticklabels=["Fake", "True"])
plt.title("Confusion Matrix - Stacking Ensemble")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.show()

# Step 11: Save all pipeline artifacts
os.makedirs("model", exist_ok=True)
joblib.dump(tfidf,        "model/tfidf.pkl")
joblib.dump(selector,     "model/selector.pkl")
joblib.dump(svd,          "model/svd.pkl")
joblib.dump(scaler,       "model/scaler.pkl")
joblib.dump(stacking_clf, "model/model.pkl")
print("✅ All model files saved!")

# Step 12: Zip and download
import shutil
shutil.make_archive("model", "zip", "model")
files.download("model.zip")
print("✅ model.zip downloaded — extract it and put the model/ folder inside ml_service/")
