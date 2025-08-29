FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

RUN python -c "import os, torch; from dotenv import load_dotenv; from transformers import AutoTokenizer; from sentence_transformers import SentenceTransformer; load_dotenv(); llm_model=os.getenv('LLM_MODEL','bert-base-uncased'); embed_model=os.getenv('VEC_MODEL','all-MiniLM-L6-v2'); AutoTokenizer.from_pretrained(llm_model); SentenceTransformer(embed_model)"

COPY . .

EXPOSE 5000

CMD ["python", "src/app.py"]
