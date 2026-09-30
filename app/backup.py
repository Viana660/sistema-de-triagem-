from contextlib import closing
from datetime import datetime
from pathlib import Path
import sqlite3
from app.database import engine
from app.database import Base
from app import models

def criar_backup() -> Path:
    caminho = engine.url.database

    if not caminho or caminho == ":memory:":
        raise RuntimeError("O sistema não está usando um banco em arquivo.")

    banco = Path(caminho).resolve()

    if not banco.is_file():
        raise RuntimeError("O banco de dados ainda não foi criado.")

    pasta = banco.parent / "backups"
    pasta.mkdir(parents=True, exist_ok=True)

    momento = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    destino = pasta / f"assistencia_{momento}.db"

    try:
        with closing(
            sqlite3.connect(banco.as_uri() + "?mode=ro", uri=True)
        ) as origem:
            with closing(sqlite3.connect(destino)) as copia:
                origem.backup(copia)

                resultado = copia.execute(
                    "PRAGMA integrity_check"
                ).fetchall()

                if resultado != [("ok",)]:
                    raise RuntimeError(
                        "A verificação de integridade do backup falhou."
                    )
    except Exception:
        destino.unlink(missing_ok=True)
        raise

    return destino

def criar_backup_diario() -> Path | None:
    caminho = engine.url.database

    if not caminho or caminho == ":memory:":
        return None

    banco = Path(caminho).resolve()

    if not banco.is_file():
        return None

    pasta = banco.parent / "backups"
    pasta.mkdir(parents=True, exist_ok=True)

    hoje = datetime.now().strftime("%Y%m%d")
    destino = pasta / f"automatico_{hoje}.db"

    if destino.exists():
        with closing(
            sqlite3.connect(destino.as_uri() + "?mode=ro", uri=True)
        ) as conexao:
            resultado = conexao.execute(
                "PRAGMA integrity_check"
            ).fetchall()

        if resultado != [("ok",)]:
            raise RuntimeError(
                f"O backup automático existente está inválido: {destino}"
            )

        return None

    temporario = criar_backup()
    temporario.rename(destino)

    return destino

def validar_backup(caminho: str | Path) -> dict[str, int]:
    arquivo = Path(caminho).resolve()

    if not arquivo.is_file():
        raise ValueError("Arquivo de backup não encontrado.")

    with closing(
        sqlite3.connect(arquivo.as_uri() + "?mode=ro", uri=True)
    ) as conexao:
        integridade = conexao.execute(
            "PRAGMA integrity_check"
        ).fetchall()

        if integridade != [("ok",)]:
            raise ValueError("O arquivo possui problemas de integridade.")

        tabelas = {
            linha[0]
            for linha in conexao.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }

        quantidades = {}

        for tabela in Base.metadata.sorted_tables:
            nome = tabela.name

            if nome not in tabelas:
                raise ValueError(
                    f"O backup não contém a tabela obrigatória: {nome}."
                )

            colunas = {
                linha[1]
                for linha in conexao.execute(
                    f'PRAGMA table_info("{nome}")'
                )
            }

            faltantes = set(tabela.columns.keys()) - colunas

            if faltantes:
                raise ValueError(
                    f"Backup incompatível. Na tabela {nome}, "
                    f"faltam as colunas: {', '.join(sorted(faltantes))}."
                )

            quantidade = conexao.execute(
                f'SELECT COUNT(*) FROM "{nome}"'
            ).fetchone()[0]

            quantidades[nome] = quantidade

        vinculos_invalidos = conexao.execute(
            "PRAGMA foreign_key_check"
        ).fetchall()

        if vinculos_invalidos:
            raise ValueError(
                "O backup contém vínculos inválidos entre registros."
            )

    return quantidades