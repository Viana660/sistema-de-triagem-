from pathlib import Path
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.models import Cliente, Equipamento, Tecnico, Triagem
from app.schemas import (
    ClienteCreate,
    ClienteOut,
    ClienteUpdate,
    EquipamentoCreate,
    EquipamentoOut,
    TriagemCreate,
    TriagemOut,
    TecnicoCreate,
    TecnicoOut,
    AtribuicaoTecnico,
    MudancaStatus
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sistema de Triagem",
    lifespan=lifespan,
)
FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"

app.mount(
    "/interface",
    StaticFiles(directory=str(FRONTEND_DIR), html=True),
    name="interface",
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

@app.post("/triagens/", response_model=TriagemOut, status_code=201)
def cadastrar_triagem(
    dados: TriagemCreate,
    db: Session = Depends(get_db),
):
    cliente = db.get(Cliente, dados.cliente_cpf)

    if cliente is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado.",
        )

    equipamento = db.get(Equipamento, dados.equipamento_imei)

    if equipamento is None:
        raise HTTPException(
            status_code=404,
            detail="Aparelho não encontrado.",
        )

    if dados.tecnico_id is not None:
        tecnico = db.get(Tecnico, dados.tecnico_id)

        if tecnico is None:
            raise HTTPException(
                status_code=404,
                detail="Técnico não encontrado.",
            )

    triagem = Triagem(
        cliente_cpf=dados.cliente_cpf,
        equipamento_imei=dados.equipamento_imei,
        tecnico_id=dados.tecnico_id,
        defeito_descricao=dados.defeito_descricao,
        prioridade=dados.prioridade,
        checklist=dados.checklist.model_dump(),
        observacoes=dados.observacoes,
        status="pendente",
    )

    db.add(triagem)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível salvar a OS: conflito nos vínculos.",
        )

    db.refresh(triagem)
    return triagem


@app.get("/triagens/", response_model=list[TriagemOut])
def listar_triagens(db: Session = Depends(get_db)):
    consulta = select(Triagem).order_by(Triagem.id.desc())
    return db.scalars(consulta).all()


@app.get("/triagens/{triagem_id}", response_model=TriagemOut)
def consultar_triagem(
    triagem_id: int,
    db: Session = Depends(get_db),
):
    triagem = db.get(Triagem, triagem_id)

    if triagem is None:
        raise HTTPException(
            status_code=404,
            detail="Ordem de serviço não encontrada.",
        )

    return triagem

@app.post("/tecnicos/", response_model=TecnicoOut, status_code=201)
def cadastrar_tecnico(
    dados: TecnicoCreate,
    db: Session = Depends(get_db),
):
    tecnico = Tecnico(
        nome=dados.nome,
        telefone=dados.telefone,
        especialidade=dados.especialidade,
    )

    db.add(tecnico)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível cadastrar: conflito nos dados.",
        )

    db.refresh(tecnico)
    return tecnico


@app.get("/tecnicos/", response_model=list[TecnicoOut])
def listar_tecnicos(db: Session = Depends(get_db)):
    consulta = select(Tecnico).order_by(Tecnico.nome, Tecnico.id)
    return db.scalars(consulta).all()


@app.get("/tecnicos/{tecnico_id}", response_model=TecnicoOut)
def consultar_tecnico(
    tecnico_id: int,
    db: Session = Depends(get_db),
):
    tecnico = db.get(Tecnico, tecnico_id)

    if tecnico is None:
        raise HTTPException(
            status_code=404,
            detail="Técnico não encontrado.",
        )

    return tecnico

@app.patch(
    "/triagens/{triagem_id}/tecnico",
    response_model=TriagemOut,
)
def atribuir_tecnico(
    triagem_id: int,
    dados: AtribuicaoTecnico,
    db: Session = Depends(get_db),
):
    triagem = db.get(Triagem, triagem_id)

    if triagem is None:
        raise HTTPException(
            status_code=404,
            detail="Ordem de serviço não encontrada.",
        )

    if dados.tecnico_id is not None:
        tecnico = db.get(Tecnico, dados.tecnico_id)

        if tecnico is None:
            raise HTTPException(
                status_code=404,
                detail="Técnico não encontrado.",
            )

    triagem.tecnico_id = dados.tecnico_id

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível atribuir o técnico: conflito nos vínculos.",
        )

    db.refresh(triagem)
    return triagem

@app.patch(
    "/triagens/{triagem_id}/status",
    response_model=TriagemOut,
)
def atualizar_status_triagem(
    triagem_id: int,
    dados: MudancaStatus,
    db: Session = Depends(get_db),
):
    proximos_status = {
        "pendente": "em_andamento",
        "em_andamento": "concluido",
    }

    proximo_permitido = proximos_status.get(dados.status_atual)

    if dados.novo_status != proximo_permitido:
        raise HTTPException(
            status_code=409,
            detail="Transição não permitida. Siga a sequência do reparo.",
        )

    comando = (
        update(Triagem)
        .where(
            Triagem.id == triagem_id,
            Triagem.status == dados.status_atual,
        )
        .values(status=dados.novo_status)
        .execution_options(synchronize_session=False)
    )

    try:
        resultado = db.execute(comando)

        if resultado.rowcount != 1:
            db.rollback()

            triagem = db.get(Triagem, triagem_id)

            if triagem is None:
                raise HTTPException(
                    status_code=404,
                    detail="Ordem de serviço não encontrada.",
                )

            raise HTTPException(
                status_code=409,
                detail="A OS mudou de status. Atualize a tela e tente novamente.",
            )

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não foi possível atualizar o status: conflito nos dados.",
        )

    triagem = db.get(Triagem, triagem_id)
    db.refresh(triagem)
    return triagem