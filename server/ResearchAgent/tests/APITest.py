##Alpha Vantage API 
import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

alpha_vantage_api_key = os.getenv("ALPHA_VANTAGE_API_KEY")

# replace the "demo" apikey below with your own key from https://www.alphavantage.co/support/#api-key
url = f'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey={alpha_vantage_api_key}'
r = requests.get(url)
data = r.json()

print(json.dumps(data, indent=2))