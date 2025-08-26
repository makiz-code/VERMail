import os
from dotenv import load_dotenv
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB = os.getenv("MONGO_DB", "VERMailDB")

SECRET_KEY = os.getenv('SECRET_KEY', "secret-key")

CORS_ORIGIN = os.getenv('CORS_ORIGIN', "http://localhost:3000")
API_PORT = os.getenv('API_PORT', 5000)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
LLM_MODEL = os.getenv("LLM_MODEL", "bert-base-uncased")
NER_MODEL = os.getenv("NER_MODEL", "xx_ent_wiki_sm")
