import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine

from app.database import Base
from app import models
from app.backup import (
    criar_backup,
    criar_backup_diario,
    validar_backup,
)


class TestBackup(unittest.TestCase):
    def setUp(self):
        self.temporario = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporario.cleanup)

        self.pasta = Path(self.temporario.name)
        self.banco = self.pasta / "teste.db"

        self.engine = create_engine(
            f"sqlite:///{self.banco.as_posix()}"
        )
        self.addCleanup(self.engine.dispose)

        Base.metadata.create_all(self.engine)

        with self.engine.begin() as conexao:
            conexao.execute(
                models.Cliente.__table__.insert(),
                {
                    "cpf": "52998224725",
                    "nome": "Cliente de teste",
                    "telefone": "11999999999",
                },
            )

        substituicao = patch("app.backup.engine", self.engine)
        substituicao.start()
        self.addCleanup(substituicao.stop)

    def test_backup_preserva_registros(self):
        arquivo = criar_backup()

        quantidades = validar_backup(arquivo)

        self.assertEqual(quantidades["clientes"], 1)
        self.assertEqual(quantidades["triagens"], 0)

        with closing(sqlite3.connect(arquivo)) as conexao:
            nome = conexao.execute(
                "SELECT nome FROM clientes"
            ).fetchone()[0]

        self.assertEqual(nome, "Cliente de teste")
        self.assertEqual(validar_backup(self.banco)["clientes"], 1)

    def test_backups_manuais_possuem_nomes_diferentes(self):
        primeiro = criar_backup()
        segundo = criar_backup()

        self.assertNotEqual(primeiro, segundo)
        self.assertTrue(primeiro.is_file())
        self.assertTrue(segundo.is_file())

    def test_backup_diario_nao_repete_no_mesmo_dia(self):
        primeiro = criar_backup_diario()
        segundo = criar_backup_diario()

        self.assertIsNotNone(primeiro)
        self.assertIsNone(segundo)

        arquivos = list(
            (self.pasta / "backups").glob("automatico_*.db")
        )

        self.assertEqual(len(arquivos), 1)
        self.assertEqual(validar_backup(primeiro)["clientes"], 1)

    def test_rejeita_arquivo_inexistente(self):
        with self.assertRaises(ValueError):
            validar_backup(self.pasta / "inexistente.db")

    def test_rejeita_arquivo_que_nao_e_sqlite(self):
        arquivo = self.pasta / "invalido.db"
        arquivo.write_text("Isto não é um banco SQLite.", encoding="utf-8")

        with self.assertRaises(sqlite3.DatabaseError):
            validar_backup(arquivo)

    def test_rejeita_banco_sem_tabelas_do_sistema(self):
        arquivo = self.pasta / "outro.db"

        with closing(sqlite3.connect(arquivo)) as conexao:
            conexao.execute("CREATE TABLE exemplo (id INTEGER)")
            conexao.commit()

        with self.assertRaises(ValueError):
            validar_backup(arquivo)