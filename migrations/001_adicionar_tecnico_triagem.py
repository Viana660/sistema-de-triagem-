import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path


def migrar():
    raiz = Path(__file__).resolve().parent.parent
    banco = raiz / "assistencia.db"

    if not banco.is_file():
        raise RuntimeError("Banco assistencia.db não encontrado.")

    with closing(sqlite3.connect(banco)) as conexao:
        conexao.execute("PRAGMA foreign_keys=ON")

        tabelas = {
            linha[0]
            for linha in conexao.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }

        if not {"triagens", "tecnicos"}.issubset(tabelas):
            raise RuntimeError("As tabelas triagens e tecnicos devem existir.")

        colunas = {
            linha[1]
            for linha in conexao.execute("PRAGMA table_info(triagens)")
        }

        if "tecnico_id" in colunas:
            print("A coluna tecnico_id já existe. Nenhuma alteração feita.")
            return

        pasta_backup = raiz / "backups"
        pasta_backup.mkdir(exist_ok=True)

        momento = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        backup = pasta_backup / f"assistencia_antes_001_{momento}.db"

        with closing(sqlite3.connect(backup)) as destino:
            conexao.backup(destino)

        print(f"Backup criado: {backup}")

        conexao.execute("BEGIN IMMEDIATE")

        try:
            conexao.execute(
                """
                ALTER TABLE triagens
                ADD COLUMN tecnico_id INTEGER
                REFERENCES tecnicos(id) ON DELETE RESTRICT
                """
            )

            erros = conexao.execute("PRAGMA foreign_key_check").fetchall()

            if erros:
                raise RuntimeError("Foram encontrados vínculos inválidos.")

            conexao.commit()
        except Exception:
            conexao.rollback()
            raise

        print("Migração concluída. Registros existentes preservados.")


if __name__ == "__main__":
    migrar()