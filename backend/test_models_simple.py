
import os
from google import genai
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent / '.env', override=True)
api_key = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=api_key)

models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]

for m in models:
    print(f"Testing {m}...")
    try:
        res = client.models.generate_content(model=m, contents="hi")
        print(f"SUCCESS {m}: {res.text}")
        break
    except Exception as e:
        print(f"FAILED {m}: {e}")
