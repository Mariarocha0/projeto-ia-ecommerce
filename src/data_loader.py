from datasets import load_dataset
import pandas as pd

def load_uss_dialogues():
    """Carrega o subconjunto de diálogos do USS para análise de satisfação."""
    print("Carregando dataset de diálogos USS...")
    # Exemplo de carregamento via HF datasets
    dataset = load_dataset("McAuley-Lab/Amazon-Reviews-2023", "raw_meta_All_Beauty", split="full[:1000]") 
    return pd.DataFrame(dataset)

def load_amazon_reviews(category="raw_meta_All_Beauty"):
    """Carrega subconjunto do Amazon Reviews para recomendação por aspectos."""
    print(f"Carregando categoria {category} do Amazon Reviews...")
    dataset = load_dataset("McAuley-Lab/Amazon-Reviews-2023", category, split="full[:500]")
    return pd.DataFrame(dataset)

if __name__ == "__main__":
    df_dialogs = load_uss_dialogues()
    print(f"Amostra carregada com sucesso. Linhas: {len(df_dialogs)}")