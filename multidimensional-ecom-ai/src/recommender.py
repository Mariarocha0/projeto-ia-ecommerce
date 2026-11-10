import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

def calculate_recommendations(product_aspect_matrix, user_profile_vector):
    """
    Calcula o ranking de recomendação baseado na similaridade de cosseno
    entre a matriz de aspectos dos produtos e o vetor de preferências do usuário.
    """
    # Matriz de aspectos ex: [Produtos x 4 Aspectos]
    # Vetor do usuário ex: [1 x 4 Aspectos]
    scores = cosine_similarity(product_aspect_matrix, user_profile_vector.reshape(1, -1))
    
    recommendation_df = pd.DataFrame({
        'Score': scores.flatten()
    }).sort_values(by='Score', ascending=False)
    
    return recommendation_df

# Exemplo de Perfis Hipotéticos Predefinidos
PERFIS_USUARIO = {
    'Custo-Beneficio': np.array([1.0, 0.3, 0.4, 0.2]), # [Preço, Desempenho, Bateria, Design]
    'Performance': np.array([0.2, 1.0, 0.9, 0.3]),
    'Design': np.array([0.3, 0.4, 0.2, 1.0])
}