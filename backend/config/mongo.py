from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from config.envs import MONGO_URI, MONGO_DB, ADMIN_USERNAME, ADMIN_PASSWORD

full_mongo_uri = f"{MONGO_URI}{MONGO_DB}"

def get_db():
    if not full_mongo_uri:
        raise ValueError(f"Database '{MONGO_DB}' is not configured.")
    client = MongoClient(full_mongo_uri)
    return client[MONGO_DB]

def conf_db(app):
    app.config[f'MONGO_URI_{MONGO_DB.upper()}'] = full_mongo_uri

def init_superadmin():
    db = get_db()
    existing_admin = db.accounts.find_one({"username": ADMIN_USERNAME})

    if not existing_admin:
        hashed_password = generate_password_hash(ADMIN_PASSWORD)
        superadmin = {
            "username": ADMIN_USERNAME,
            "password": hashed_password,
            "role": "SuperAdmin",
            "state": True
        }
        db.accounts.insert_one(superadmin)
        print(f" * SuperAdmin '{ADMIN_USERNAME}' has been created.")
