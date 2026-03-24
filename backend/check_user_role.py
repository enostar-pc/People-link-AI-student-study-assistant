import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
users_col = db['users']

user = users_col.find_one({"email": "elitepc89@gmail.com"})
if user:
    print(f"User Found: {user.get('username')}")
    print(f"Role: {user.get('role')}")
    print(f"UID: {user.get('uid')}")
else:
    print("User not found in database.")
