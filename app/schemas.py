from pydantic import BaseModel, Field


class ClienteCreate(BaseModel):
    cpf: str = Field(min_length=11, max_length=11)
    nome: str = Field(min_length=2, max_length=255)
    telefone: str = Field(min_length=10, max_length=11)