import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from app.backup import criar_backup
from app.database import engine


def migrar():
    caminho = engine.url.database

    if not caminho or not Path(caminho).is_file():
        raise RuntimeError("Banco de dados não encontrado.")

    campos = (
        "criada_em",
        "iniciada_em",
        "concluida_em",
        "arquivar_em",
    )

    with engine.connect() as conexao:
        colunas = {
            linha[1]
            for linha in conexao.exec_driver_sql(
                "PRAGMA table_info(triagens)"
            )
        }

    if not colunas:
        raise RuntimeError("A tabela triagens não foi encontrada.")

    faltantes = [campo for campo in campos if campo not in colunas]

    if not faltantes:
        print("As colunas já existem. Nenhuma alteração feita.")
        return

    backup = criar_backup()
    print(f"Backup de segurança criado: {backup}")

    # As datas serão armazenadas em UTC.
    prazo = (
        datetime.now(timezone.utc) + timedelta(hours=15)
    ).replace(tzinfo=None)

    with engine.connect() as conexao:
        conexao.exec_driver_sql("BEGIN IMMEDIATE")

        try:
            for campo in faltantes:
                conexao.exec_driver_sql(
                    f"ALTER TABLE triagens ADD COLUMN {campo} DATETIME"
                )

            conexao.exec_driver_sql(
                """
                UPDATE triagens
                SET arquivar_em = ?
                WHERE status = 'concluido'
                  AND arquivar_em IS NULL
                """,
                (prazo.strftime("%Y-%m-%d %H:%M:%S.%f"),),
            )

            resultado = conexao.exec_driver_sql(
                "PRAGMA integrity_check"
            ).fetchall()

            if [linha[0] for linha in resultado] != ["ok"]:
                raise RuntimeError(
                    "A verificação de integridade do banco falhou."
                )

            conexao.commit()
        except Exception:
            conexao.rollback()
            raise

    print("Migração concluída. Registros existentes preservados.")


if __name__ == "__main__":
    migrar()