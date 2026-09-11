from fastapi import FastAPI

app = FastAPI(title = "Sistema de Triagem")

@app.get("/")
def inicio():
    return {"mensagem": "Sistema de Triagem em desenvolvimento"}