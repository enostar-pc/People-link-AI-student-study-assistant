import os
import sys
from pathlib import Path

# Add the project directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

try:
    from educator.mongo import db
    # Try to ping the server
    from pymongo import MongoClient
    client = MongoClient(os.getenv('MONGO_URI'))
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
    
    # Show database name
    print(f"Using database: {db.name}")
    
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    print("\nTip: Make sure MongoDB is running locally or update MONGO_URI in .env")
