from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.validators import cpf_valido

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