from fastapi import FastAPI
from app.schemas import ClienteCreate

app = FastAPI(title = "Sistema de Triagem")

@app.get("/")
def inicio():
    return {"mensagem": "Sistema de Triagem em desenvolvimento"}

@app.post("/clientes/")
def cadastrar_cliente(cliente: ClienteCreate):
    return cliente