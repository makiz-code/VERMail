import os
from dotenv import load_dotenv

if not os.environ.get("MONGO_DB"):
    load_dotenv()

MONGO_DB = os.environ.get("MONGO_DB")
MONGO_URI = os.environ.get("MONGO_URI")

FLASK_CORS_ORIGIN = os.environ.get('FLASK_CORS_ORIGIN')
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

VEC_MODEL = os.environ.get("VEC_MODEL")
LLM_MODEL = os.environ.get("LLM_MODEL")
NER_MODEL = os.environ.get("NER_MODEL")
