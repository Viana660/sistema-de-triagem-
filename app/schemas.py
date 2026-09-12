from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class ClienteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    cpf: str = Field(pattern=r"^[0-9]{11}$")
    nome: str = Field(min_length=2, max_length=255)
    telefone: str = Field(pattern=r"^[0-9]{10,11}$")
    email: EmailStr | None = Field(default=None, max_length=255)
    endereco: str | None = Field(default=None, max_length=500)


class ClienteOut(ClienteCreate):
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