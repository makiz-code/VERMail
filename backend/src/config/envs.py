import os
from dotenv import load_dotenv
load_dotenv()

MONGO_DB = os.getenv("MONGO_DB")
MONGO_URI = os.getenv("MONGO_URI")

CORS_ORIGIN = os.getenv('CORS_ORIGIN')
SECRET_KEY = os.getenv('SECRET_KEY')

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

EMBED_MODEL = os.getenv("EMBED_MODEL")
LLM_MODEL = os.getenv("LLM_MODEL")
NER_MODEL = os.getenv("NER_MODEL")
