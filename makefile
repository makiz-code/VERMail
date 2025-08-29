.PHONY: env backend frontend start stop

# Build Environment
env:
ifeq ($(OS),Windows_NT)
	python -m venv backend/.venv
	backend\.venv\Scripts\python.exe -m pip install --upgrade pip
	backend\.venv\Scripts\python.exe -m pip install --no-cache-dir -r backend/requirements.txt
	backend\.venv\Scripts\python.exe -c "import os, torch; from dotenv import load_dotenv; from transformers import AutoTokenizer; from sentence_transformers import SentenceTransformer; load_dotenv(); llm_model=os.getenv('LLM_MODEL','bert-base-uncased'); embed_model=os.getenv('VEC_MODEL','all-MiniLM-L6-v2'); AutoTokenizer.from_pretrained(llm_model); SentenceTransformer(embed_model)"
	cd frontend && npm install && cd ..
else
	python3 -m venv backend/.venv
	backend/.venv/bin/python -m pip install --upgrade pip
	backend/.venv/bin/python -m pip install --no-cache-dir -r backend/requirements.txt
	backend/.venv/bin/python -c "import os, torch; from dotenv import load_dotenv; from transformers import AutoTokenizer; from sentence_transformers import SentenceTransformer; load_dotenv(); llm_model=os.getenv('LLM_MODEL','bert-base-uncased'); embed_model=os.getenv('VEC_MODEL','all-MiniLM-L6-v2'); AutoTokenizer.from_pretrained(llm_model); SentenceTransformer(embed_model)"
	cd frontend && npm install && cd ..
endif

# Run Backend Server
backend:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" powershell -NoExit -Command "$$host.UI.RawUI.WindowTitle = 'BACKEND'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\\backend\\.venv\\Scripts\\Activate.ps1; python backend/src/app.py"
else
	gnome-terminal -- bash -c "backend/.venv/bin/python backend/src/app.py; exec bash" || \
	osascript -e 'tell app "Terminal" to do script \"backend/.venv/bin/python backend/src/app.py\"'
endif

# Run Frontend Server
frontend:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" powershell -NoExit -Command "$$host.UI.RawUI.WindowTitle = 'FRONTEND'; npm --prefix ./frontend start"
else
	gnome-terminal -- bash -c "npm --prefix ./frontend start; exec bash" || \
	osascript -e 'tell app "Terminal" to do script \"npm --prefix ./frontend start\"'
endif

# Run Both Servers
start: 
	$(MAKE) backend 
	$(MAKE) frontend

# Stop Both Servers
stop:
ifeq ($(OS),Windows_NT)
	-@taskkill /F /IM python.exe >nul 2>&1
	-@taskkill /F /IM node.exe >nul 2>&1
	-@taskkill /FI "WINDOWTITLE eq BACKEND*"
	-@taskkill /FI "WINDOWTITLE eq FRONTEND*"
else
	-pkill -f "python backend/src/app.py"
	-pkill -f "npm --prefix ./frontend start"
endif
