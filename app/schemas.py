from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.validators import cpf_valido
from typing import Literal


class ClienteBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    cpf: str = Field(pattern=r"^[0-9]{11}$")
    nome: str = Field(min_length=2, max_length=255)
    telefone: str = Field(pattern=r"^[0-9]{10,11}$")
    email: EmailStr | None = Field(default=None, max_length=255)
    endereco: str | None = Field(default=None, max_length=500)


class ClienteCreate(ClienteBase):
    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor):
        if not cpf_valido(valor):
            raise ValueError("CPF inválido: confira os dígitos informados.")
        return valor


class ClienteOut(ClienteBase):
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
    )

class ClienteUpdate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    nome: str | None = Field(default=None, min_length=2, max_length=255)
    telefone: str | None = Field(default=None, pattern=r"^[0-9]{10,11}$")
    email: EmailStr | None = Field(default=None, max_length=255)
    endereco: str | None = Field(default=None, max_length=500)

    @field_validator("nome", "telefone")
    @classmethod
    def impedir_valor_nulo(cls, valor):
        if valor is None:
            raise ValueError("Este campo não pode ser nulo.")
        return valor

class EquipamentoCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    imei: str = Field(pattern=r"^[0-9]{15}$")
    marca: str = Field(min_length=1, max_length=100)
    modelo: str = Field(min_length=1, max_length=100)
    cor: str = Field(min_length=1, max_length=50)
    descricao: str | None = Field(default=None, max_length=500)

class EquipamentoOut(EquipamentoCreate):
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
        extra="forbid",
    )

ResultadoVistoria = Literal[
    "sem_avaria_aparente",
    "com_avaria",
    "nao_testado",
]


class ChecklistEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    liga: ResultadoVistoria
    tela_touch: ResultadoVistoria
    traseira: ResultadoVistoria
    carga: ResultadoVistoria
    cameras: ResultadoVistoria
    botoes: ResultadoVistoria
    oxidacao: ResultadoVistoria
    rede: ResultadoVistoria


class TriagemCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    cliente_cpf: str = Field(pattern=r"^[0-9]{11}$")
    equipamento_imei: str = Field(pattern=r"^[0-9]{15}$")
    defeito_descricao: str = Field(min_length=5, max_length=2000)
    prioridade: Literal["normal", "alta"] = "normal"
    checklist: ChecklistEntrada
    observacoes: str | None = Field(default=None, max_length=2000)
    tecnico_id: int | None = Field(default=None, gt=0)

class TriagemOut(TriagemCreate):
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
        extra="forbid",
    )

    id: int
    status: Literal["pendente", "em_andamento", "concluido"]

class TecnicoCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    nome: str = Field(min_length=2, max_length=255)
    telefone: str = Field(pattern=r"^[0-9]{10,11}$")
    especialidade: str | None = Field(default=None, max_length=100)


class TecnicoOut(TecnicoCreate):
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
        extra="forbid",
    )

    id: int

class AtribuicaoTecnico(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tecnico_id: int | None = Field(gt=0)