import os
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

full_mongo_uri = f"{MONGO_URI}{DB_NAME}"

def get_db():
    if not full_mongo_uri:
        raise ValueError(f"Database '{DB_NAME}' is not configured.")
    client = MongoClient(full_mongo_uri)
    return client[DB_NAME]

def conf_db(app):
    app.config[f'MONGO_URI_{DB_NAME.upper()}'] = full_mongo_uri
