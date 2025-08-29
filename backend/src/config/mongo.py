from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from config.envs import MONGO_URI, MONGO_DB, ADMIN_USERNAME, ADMIN_PASSWORD

def get_db():
    if not MONGO_URI:
        raise ValueError(f"Database '{MONGO_DB}' is not configured.")
    client = MongoClient(MONGO_URI)
    return client[MONGO_DB]

def conf_db(app):
    app.config[f'MONGO_URI_{MONGO_DB.upper()}'] = MONGO_URI

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
