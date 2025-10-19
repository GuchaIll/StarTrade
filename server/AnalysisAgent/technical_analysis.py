from typing import Dict
import pandas as pd
import numpy as np

class TechnicalAnalyzer:
    """
    Technical analysis agent to evaluate stock price movements and patterns.
    """

    def __init__(self):
        self.model = self.load_model()

    async def analyze(self, symbol: str) -> Dict:
        """
        Analyze technical indicators for a given stock symbol.
        """
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="60d", interval="1d")

        indicators = self._calculate_indicators(hist)

        ml_signal = self._get_ml_prediction(indicators)

        composite_score = self._calculate_technical_score(indicators, ml_signal)

        return {
            "indicators": indicators,
            "ml_signal": ml_signal,
            "composite_score": composite_score,
        }
    
    def _calculate_indicators(self, hist: pd.DataFrame) -> Dict:
        """
        Calculate technical indicators such as moving averages, RSI, MACD.
        """
        #RSI 
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        #Moving Averages
        ma_20 = hist['Close'].rolling(window=20).mean()
        ma_50 = hist['Close'].rolling(window=50).mean()

        #MACD
        exp1 = hist['Close'].ewm(span=12, adjust=False).mean()
        exp2 = hist['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()

        return {
            'rsi': float(rsi.iloc[-1]),
            'ma_20': float(ma_20.iloc[-1]),
            'ma_50': float(ma_50.iloc[-1]),
            'current_price': float(hist['Close'].iloc[-1]),
            'macd': float(macd.iloc[-1]),
            'macd_signal': float(signal.iloc[-1]),
            'volume_trend': float(hist['Volume'].rolling(window=20).mean().iloc[-1])
        }


    def _get_ml_prediction(self, indicators: Dict) -> str:
        """
        Use pre-trained ML model to predict buy/sell/hold based on indicators.
        """
        features = np.array([
            indicators['rsi'],
            indicators['ma_20'],
            indicators['ma_50'],
            indicators['macd'],
            indicators['macd_signal'],
            indicators['volume_trend']
        ]).reshape(1, -1)

        prediction = self.model.predict(features)[0]
        confidence = self.model.predict_proba(features)[0].max()

        return {
            'signal': 'BUY' if prediction > 0.5 else 'SELL',
            'confidence': float(confidence)
        }
    
    def _calculate_technical_score(self, indicators: Dict, ml_signal: Dict) -> float:
        """
        Calculate a composite technical score based on indicators and ML signal.
        """
        score = 0

        #RSI contribution
        if indicators['rsi'] < 30:
            score += 15  #oversold
        elif indicators['rsi'] > 70:
            score -= 15  #overbought
        elif 40 <= indicators['rsi'] <= 60:
            score += 5
         # Moving average trend   
        current_price = indicators['current_price']
        ma_20 = indicators['ma_20']
        ma_50 = indicators['ma_50']

        if current_price > ma_20 > ma_50:
            score += 20  # Strong uptrend
        elif current_price > ma_20:
            score += 10  # Mild uptrend
        elif current_price < ma_20 < ma_50:
            score -= 20  # Strong downtrend
        elif current_price < ma_20:
            score -= 10  # Mild downtrend

        #MACD contribution
        if indicators['macd'] > indicators['macd_signal']:
            score += 10  #bullish
        else:
            score -= 10  #bearish

        if ml_signal['signal'] == 'BUY':
            score += 15 * ml_signal['confidence']
        else:
            score -= 15 * ml_signal['confidence']
        
        # Clamp to 0-100
        return max(0, min(100, score))
    
    def load_model(self):
        import torch
        ...
        return model