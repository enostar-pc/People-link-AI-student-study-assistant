import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

gemini_key = os.getenv('GEMINI_API_KEY')

print(f"Testing with Key: {gemini_key[:10]}...")

try:
    genai.configure(api_key=gemini_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Hello")
    print("AI Response:", response.text)
except Exception as e:
    print("Error:", e)
