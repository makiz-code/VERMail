// set up environment

open cmd and type: cd "C:\Users\medk5\OneDrive\Desktop\Code\Jupyter\VERApp"
activate cuda env: conda activate cuda

// run both servers

run backend server: python backend/app.py
run frontend server: npm --prefix ./frontend start