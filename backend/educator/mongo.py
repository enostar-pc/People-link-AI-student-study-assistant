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
    def get_client(cls):
        if cls._client is None:
            try:
                # Use a short timeout for the initial connection check
                cls._client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
                if cls._client:
                    # Test connection
                    cls._client.admin.command('ping')
            except Exception as e:
                print(f"Warning: Could not connect to MongoDB: {e}")
                cls._client = None
        return cls._client

    @classmethod
    def get_db(cls):
        if cls._db is None:
            try:
                client = cls.get_client()
                if client:
                    cls._db = client[MONGO_DB_NAME]
                else:
                    # Return a dummy object that doesn't crash on subscripting but fails on operations
                    return None
            except Exception:
                return None
        return cls._db

# Database instance for easy import
db = MongoDB.get_db()
