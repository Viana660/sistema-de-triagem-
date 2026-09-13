from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.models import Cliente, Equipamento
from app.schemas import ClienteCreate, ClienteOut, ClienteUpdate
from app.schemas import EquipamentoCreate, EquipamentoOut


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

@app.patch("/clientes/{cpf}", response_model=ClienteOut)
def atualizar_cliente(
    cpf: str,
    dados: ClienteUpdate,
    db: Session = Depends(get_db),
):
    cliente = db.get(Cliente, cpf)

    if cliente is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado.",
        )

    alteracoes = dados.model_dump(exclude_unset=True)

    if not alteracoes:
        raise HTTPException(
            status_code=400,
            detail="Envie pelo menos um campo para atualizar.",
        )

    for campo, valor in alteracoes.items():
        setattr(cliente, campo, valor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível atualizar: conflito nos dados.",
        )

    db.refresh(cliente)
    return cliente

@app.post(
    "/equipamentos/",
    response_model=EquipamentoOut,
    status_code=201,
)
def cadastrar_equipamento(
    dados: EquipamentoCreate,
    db: Session = Depends(get_db),
):
    equipamento_existente = db.get(Equipamento, dados.imei)

    if equipamento_existente is not None:
        raise HTTPException(
            status_code=409,
            detail="Já existe um aparelho com esse IMEI.",
        )

    equipamento = Equipamento(
        imei=dados.imei,
        marca=dados.marca,
        modelo=dados.modelo,
        cor=dados.cor,
        descricao=dados.descricao,
    )

    db.add(equipamento)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível cadastrar: conflito nos dados.",
        )

    db.refresh(equipamento)
    return equipamento


@app.get("/equipamentos/", response_model=list[EquipamentoOut])
def listar_equipamentos(db: Session = Depends(get_db)):
    consulta = select(Equipamento).order_by(
        Equipamento.marca,
        Equipamento.modelo,
        Equipamento.imei,
    )

    return db.scalars(consulta).all()


@app.get("/equipamentos/{imei}", response_model=EquipamentoOut)
def consultar_equipamento(
    imei: str,
    db: Session = Depends(get_db),
):
    equipamento = db.get(Equipamento, imei)

    if equipamento is None:
        raise HTTPException(
            status_code=404,
            detail="Aparelho não encontrado.",
        )

    return equipamento