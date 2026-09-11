from pydantic import BaseModel, ConfigDict, EmailStr, Field


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