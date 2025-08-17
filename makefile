.PHONY: backend frontend all stop

ANACONDA_PROMPT := C:\Users\medk5\anaconda3\Scripts\activate.bat

# Backend
backend:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" cmd /C "call $(ANACONDA_PROMPT) cuda && python backend/app.py"
else
	conda run -n cuda python backend/app.py
endif

# Frontend
frontend:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" cmd /C "call $(ANACONDA_PROMPT) cuda && npm --prefix ./frontend start"
else
	conda run -n cuda npm --prefix ./frontend start
endif

# Run both servers
all:
ifeq ($(OS),Windows_NT)
	cmd.exe /C start "" cmd /C "call $(ANACONDA_PROMPT) cuda && python backend/app.py"
	cmd.exe /C start "" cmd /C "call $(ANACONDA_PROMPT) cuda && npm --prefix ./frontend start"
else
	( conda run -n cuda python backend/app.py & conda run -n cuda npm --prefix ./frontend start )
endif

# Stop both servers
stop:
ifeq ($(OS),Windows_NT)
	taskkill /F /IM python.exe || true
	taskkill /F /IM node.exe || true
else
	-pkill -f "python backend/app.py" || true
	-pkill -f "npm --prefix ./frontend start" || true
endif
