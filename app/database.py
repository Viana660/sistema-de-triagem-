from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

DATABASE_URL = os.environ.get(
   "TRIAGEM_DATABASE_URL",
   "sqlite:///./assistencia.db",
)



engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

@event.listens_for(engine, "connect")
def ativar_chaves_estrangeiras(conexao, registro):
    autocommit_anterior = conexao.autocommit
    conexao.autocommit = True

    try:
        cursor = conexao.cursor()

        try:
            cursor.execute("PRAGMA foreign_keys=ON")
        finally:
            cursor.close()
    finally:
        conexao.autocommit = autocommit_anterior

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass

def get_db():
    with SessionLocal() as db:
        yield db