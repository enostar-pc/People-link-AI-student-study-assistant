
import os
from google import genai
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / '.env'
print(f"Loading env from: {env_path}")
load_dotenv(env_path, override=True)

api_key = os.getenv('GEMINI_API_KEY')
print(f"Key in use: {api_key[:15]}...")

client = genai.Client(api_key=api_key)

models_to_try = [
    "gemini-2.0-flash", 
    "gemini-1.5-flash", 
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
]

for model_name in models_to_try:
    print(f"\nTrying {model_name}...")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents="Say 'OK'"
        )
        print(f"SUCCESS {model_name}: {response.text}")
        # If success, we found our model
        break
    except Exception as e:
        print(f"FAILED {model_name}: {e}")
