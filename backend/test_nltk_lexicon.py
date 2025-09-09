import os
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

def test_vader_lexicon_load():
    # Add local nltk_data path
    nltk.data.path.append(os.path.join(os.path.dirname(__file__), 'nltk_data'))
    try:
        sia = SentimentIntensityAnalyzer()
        print("Vader lexicon loaded successfully.")
        return True
    except LookupError as e:
        print(f"LookupError: {e}")
        return False

if __name__ == "__main__":
    success = test_vader_lexicon_load()
    if not success:
        exit(1)
