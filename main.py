from src.data_loader import load_amazon_reviews
from src.dialogue_module import DialogueSatisfactionClassifier
from src.recommender import PERFIS_USUARIO, calculate_recommendations
import numpy as np

def main():
    print("=== Iniciando Plataforma Inteligente de E-Commerce ===")
    
    # 1. Módulo de Diálogos (Exemplo Simulado)
    texts_exemplo = [
        "The agent was very helpful and solved my issue fast.",
        "I hate this service, completely useless chatbot.",
        "Okay, I received the information requested."
    ]
    labels_exemplo = [2, 0, 1] # 0: Insatisfeito, 1: Neutro, 2: Satisfeito
    
    classifier = DialogueSatisfactionClassifier()
    classifier.fit(texts_exemplo, labels_exemplo)
    
    # 2. Módulo Recomendador por Aspectos (Exemplo Simulado)
    # 3 Produtos x 4 Aspectos (Preço, Desempenho, Bateria, Design)
    matriz_produtos = np.array([
        [0.9, 0.4, 0.5, 0.3], # Produto A (Foco em Preço)
        [0.3, 0.9, 0.8, 0.5], # Produto B (Foco em Performance)
        [0.4, 0.5, 0.3, 0.9]  # Produto C (Foco em Design)
    ])
    
    perfil_escolhido = PERFIS_USUARIO['Performance']
    ranking = calculate_recommendations(matriz_produtos, perfil_escolhido)
    
    print("\n=== Ranking de Produtos Recomendados ===")
    print(ranking)

if __name__ == "__main__":
    main()