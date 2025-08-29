.PHONY: env server client start stop

# Build Env
env:
ifeq ($(OS),Windows_NT)
	python -m venv server/.venv
	server\.venv\Scripts\python.exe -m pip install --upgrade pip
	server\.venv\Scripts\python.exe -m pip install --no-cache-dir -r server/requirements.txt
	server\.venv\Scripts\python.exe -c "import os, torch; from dotenv import load_dotenv; from transformers import AutoTokenizer; from sentence_transformers import SentenceTransformer; load_dotenv(); llm_model=os.getenv('LLM_MODEL','bert-base-uncased'); embed_model=os.getenv('VEC_MODEL','all-MiniLM-L6-v2'); AutoTokenizer.from_pretrained(llm_model); SentenceTransformer(embed_model)"
	cd client && npm install && cd ..
else
	python3 -m venv server/.venv
	server/.venv/bin/python -m pip install --upgrade pip
	server/.venv/bin/python -m pip install --no-cache-dir -r server/requirements.txt
	server/.venv/bin/python -c "import os, torch; from dotenv import load_dotenv; from transformers import AutoTokenizer; from sentence_transformers import SentenceTransformer; load_dotenv(); llm_model=os.getenv('LLM_MODEL','bert-base-uncased'); embed_model=os.getenv('VEC_MODEL','all-MiniLM-L6-v2'); AutoTokenizer.from_pretrained(llm_model); SentenceTransformer(embed_model)"
	cd client && npm install && cd ..
endif

# Run Server
server:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" powershell -NoExit -Command "$$host.UI.RawUI.WindowTitle = 'SERVER'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\\server\\.venv\\Scripts\\Activate.ps1; python server/src/app.py"
else
	gnome-terminal -- bash -c "server/.venv/bin/python server/src/app.py; exec bash" || \
	osascript -e 'tell app "Terminal" to do script \"server/.venv/bin/python server/src/app.py\"'
endif

# Run Client
client:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" powershell -NoExit -Command "$$host.UI.RawUI.WindowTitle = 'CLIENT'; npm --prefix ./client start"
else
	gnome-terminal -- bash -c "npm --prefix ./client start; exec bash" || \
	osascript -e 'tell app "Terminal" to do script \"npm --prefix ./client start\"'
endif

# Run Both
start: 
	$(MAKE) server 
	$(MAKE) client

# Stop Both
stop:
ifeq ($(OS),Windows_NT)
	-@taskkill /F /IM python.exe >nul 2>&1
	-@taskkill /F /IM node.exe >nul 2>&1
	-@taskkill /FI "WINDOWTITLE eq SERVER*"
	-@taskkill /FI "WINDOWTITLE eq CLIENT*"
else
	-pkill -f "python server/src/app.py"
	-pkill -f "npm --prefix ./client start"
endif
