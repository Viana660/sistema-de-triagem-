from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    cpf: Mapped[str] = mapped_column(String(11), primary_key=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    telefone: Mapped[str] = mapped_column(String(11), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(500), nullable=True)

class Equipamento(Base):
    __tablename__ = "equipamentos"

    imei: Mapped[str] = mapped_column(String(15), primary_key=True)
    marca: Mapped[str] = mapped_column(String(100), nullable=False)
    modelo: Mapped[str] = mapped_column(String(100), nullable=False)
    cor: Mapped[str] = mapped_column(String(50), nullable=False)
    descricao: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

class Triagem(Base):
    __tablename__ = "triagens"
    __table_args__ = {"sqlite_autoincrement": True}

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    cliente_cpf: Mapped[str] = mapped_column(
        String(11),
        ForeignKey("clientes.cpf", ondelete="RESTRICT"),
        nullable=False,
    )

    equipamento_imei: Mapped[str] = mapped_column(
        String(15),
        ForeignKey("equipamentos.imei", ondelete="RESTRICT"),
        nullable=False,
    )

    tecnico_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("tecnicos.id", ondelete="RESTRICT"),
        nullable=True,
    )

    defeito_descricao: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    prioridade: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="normal",
    )

    checklist: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    observacoes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pendente",
    )

class Tecnico(Base):
    __tablename__ = "tecnicos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    nome: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    telefone: Mapped[str] = mapped_column(
        String(11),
        nullable=False,
    )

    especialidade: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )