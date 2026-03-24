import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
users_col = db['users']

result = users_col.update_one({"email": "elitepc89@gmail.com"}, {"$set": {"role": "mentor"}})
if result.modified_count > 0:
    print("Successfully updated role to mentor.")
else:
    print("Failed to update role or role already was mentor.")
