from educator.mongo import db
import json

if db is not None:
    users = list(db['users'].find({}, {"_id": 0}))
    print(json.dumps(users, indent=2))
else:
    print("Database not connected")
