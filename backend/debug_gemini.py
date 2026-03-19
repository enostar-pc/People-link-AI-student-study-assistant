import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load .env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

print(f"Testing with API Key: {api_key[:10]}...")

try:
    print("\nListing ALL accessible models:")
    models = list(genai.list_models())
    if not models:
        print("No models found!")
    for m in models:
        print(f"Name: {m.name}, Methods: {m.supported_generation_methods}")
except Exception as e:
    print(f"\nError occurred: {e}")
