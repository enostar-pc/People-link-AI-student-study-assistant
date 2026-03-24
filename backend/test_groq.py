import os
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

groq_key = os.getenv('GROQ_API_KEY')
print(f"Key exists: {bool(groq_key)}")
if groq_key:
    try:
        client = Groq(api_key=groq_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello"}],
            model="llama-3.3-70b-versatile",
        )
        print(f"Success: {chat_completion.choices[0].message.content}")
    except Exception as e:
        print(f"Error: {e}")
