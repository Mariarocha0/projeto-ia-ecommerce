import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score

class DialogueSatisfactionClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        # class_weight='balanced' ajuda a tratar o desbalanceamento da classe neutra
        self.model = LogisticRegression(class_weight='balanced', max_iter=1000)

    def fit(self, texts, labels):
        X = self.vectorizer.fit_transform(texts)
        X_train, X_val, y_train, y_val = train_test_split(X, labels, random_state=42, test_size=0.2)
        
        self.model.fit(X_train, y_train)
        preds = self.model.predict(X_val)
        
        print("=== Avaliação do Módulo de Diálogos ===")
        print(classification_report(y_val, preds))
        macro_f1 = f1_score(y_val, preds, average='macro')
        print(f"Macro-F1 Score: {macro_f1:.4f}")
        return macro_f1

    def predict(self, texts):
        X = self.vectorizer.transform(texts)
        return self.model.predict(X)