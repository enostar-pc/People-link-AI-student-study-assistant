
import os
from google import genai
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent / '.env')
api_key = os.getenv('GEMINI_API_KEY')
print(f"Key: {api_key[:10]}...")

client = genai.Client(api_key=api_key)

models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

for model_name in models_to_try:
    print(f"\nTrying {model_name}...")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents="Hello, respond with ONE word."
        )
        print(f"SUCCESS: {response.text}")
        break
    except Exception as e:
        print(f"FAILED {model_name}: {e}")
