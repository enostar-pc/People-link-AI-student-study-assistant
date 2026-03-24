import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'people_link_db')

class MongoDB:
    _client = None
    _db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            try:
                # Try PRIMARY (Atlas/Env)
                print(f"Connecting to: {MONGO_URI[:30]}...")
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
                client.admin.command('ping')
                cls._client = client
                cls._db = client[MONGO_DB_NAME]
                print("Database: PRIMARY CONNECTED")
            except Exception as e:
                print(f"Primary DB Failed ({e}), trying LOCALHOST Fallback...")
                try:
                    # Try LOCALHOST Fallback
                    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=1500)
                    client.admin.command('ping')
                    cls._client = client
                    cls._db = client[MONGO_DB_NAME]
                    print("Database: LOCALHOST CONNECTED")
                except Exception:
                    print("Database: ALL CONNECTIONS FAILED. Operating without persistence.")
                    return None
        return cls._db

# Database instance for easy import
db = MongoDB.get_db()
