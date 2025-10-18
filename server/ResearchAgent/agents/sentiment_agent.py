from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
from typing import List, Dict
import numpy as np

class SentimentAnalysisAgent:
    """"Sentiment analysis agent using pretrained models."""

    def __init__(self):

        #Load FinBERT model for financial sentiment analysis
        self.finbert_tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
        self.finbert_model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")

        #Load Twitter RoBERTa model for social media sentiment analysis
        self.twitter_sentiment = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
        )

        #zero shot classifcation for creating custom sentiment labels
        self.classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli"
        )
    
    def analyze_financial_sentiment(self, texts: str) -> Dict:
        """Analyze sentiment using FinBERT model."""
        inputs = self.finbert_tokenizer(
                texts, 
                return_tensors="pt", 
                truncation=True, 
                padding=True).to(self.device)
        
        with torch.no_grad():
            outputs = self.finbert_model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        scores = predictions.cpu().numpy()[0]
        labels = ['negative', 'neutral', 'positive']


        return {
            'sentiment': labels[np.argmax(scores)],
            'scores': {label : float(score) for label, score in zip(labels, scores)},
            'confidence': float(np.max(scores))

        }
    
    def analyze_social_sentiment(self, texts: str) -> Dict:
        result = self.twitter_sentiment(texts[:512])[0]
        return {
            'sentiment': result['label'].lower(),
            'confidence': float(result['score'])
        }

    def extract_topics(self, text: str, candidate_labels: List[str]) -> Dict:
        result = self.classifier(text, candidate_labels, multi_label=True)
        return {
            'topics' : [
                {'label': label, 'score': float(score)} 
                for label, score in zip(result['labels'], result['scores'])
                if score > 0.3
            ]
        }
    
    def aggregate_sentiment(self, texts: List[str], source: str = 'financial') -> Dict:
        """Aggregate sentiment scores from multiple texts."""
        if source == 'financial':
            sentiments = [self.analyze_financial_sentiment(text) for text in texts]
        else:   
            sentiments = [self.analyze_social_sentiment(text) for text in texts]

        positive_score = np.mean([s['scores'].get('positive', s.get('confidence', 0)) 
                                  for s in sentiments if s['sentiment'] in ['positive', 'LABEL_2']])
        negative_score = np.mean([s['scores'].get('negative', s.get('confidence', 0)) 
                                  for s in sentiments if s['sentiment'] in ['negative', 'LABEL_0']])
        neutral_score = np.mean([s['scores'].get('neutral', s.get('confidence', 0)) 
                                 for s in sentiments if s['sentiment'] in ['neutral', 'LABEL_1']])
        

        if positive_score > negative_score and positive_score > neutral_score:
            overall_sentiment = 'positive'
            overall_confidence = positive_score
        elif negative_score > positive_score and negative_score > neutral_score:
            overall_sentiment = 'negative'
            overall_confidence = negative_score
        else:
            overall_sentiment = 'neutral'
            overall_confidence = neutral_score

        return {
            'overall_sentiment': overall_sentiment,
            'overall_confidence': float(overall_confidence),
            'detailed_scores': {
                'positive': float(positive_score) if not np.isnan(positive_score) else 0.0,
                'negative': float(negative_score) if not np.isnan(negative_score) else 0.0,
                'neutral': float(neutral_score) if not np.isnan(neutral_score) else 0.0,
            },
            'individual_sentiments': sentiments
        }
    

    
          