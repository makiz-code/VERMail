.PHONY: backend frontend all

# Adjust to your actual path
ANACONDA_PROMPT := C:\Users\medk5\anaconda3\Scripts\activate.bat

# Backend
backend:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" cmd /K "call $(ANACONDA_PROMPT) cuda && python backend/app.py"
else
	conda run -n cuda python backend/app.py
endif

# Frontend
frontend:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" cmd /K "call $(ANACONDA_PROMPT) cuda && npm --prefix ./frontend start"
else
	conda run -n cuda npm --prefix ./frontend start
endif

# Run both
all:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" cmd /K "call $(ANACONDA_PROMPT) cuda && python backend/app.py"
	cmd.exe /C start "" cmd /K "call $(ANACONDA_PROMPT) cuda && npm --prefix ./frontend start"
else
	( conda run -n cuda python backend/app.py & conda run -n cuda npm --prefix ./frontend start )
endif