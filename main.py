from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Cliente
from app.schemas import ClienteCreate, ClienteOut


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sistema de Triagem",
    lifespan=lifespan,
)


@app.get("/")
def inicio():
    return {"mensagem": "Sistema de Triagem em desenvolvimento"}


@app.post("/clientes/", response_model=ClienteOut, status_code=201)
def cadastrar_cliente(
    dados: ClienteCreate,
    db: Session = Depends(get_db),
):
    cliente_existente = db.get(Cliente, dados.cpf)

    if cliente_existente is not None:
        raise HTTPException(
            status_code=409,
            detail="Já existe um cliente com esse CPF.",
        )

    cliente = Cliente(
        cpf=dados.cpf,
        nome=dados.nome,
        telefone=dados.telefone,
        email=dados.email,
        endereco=dados.endereco,
    )

    db.add(cliente)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível cadastrar: conflito nos dados.",
        )

    db.refresh(cliente)
    return cliente


@app.get("/clientes/", response_model=list[ClienteOut])
def listar_clientes(db: Session = Depends(get_db)):
    consulta = select(Cliente).order_by(Cliente.nome, Cliente.cpf)
    return db.scalars(consulta).all()


@app.get("/clientes/{cpf}", response_model=ClienteOut)
def consultar_cliente(cpf: str, db: Session = Depends(get_db)):
    cliente = db.get(Cliente, cpf)

    if cliente is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado.",
        )

    return cliente