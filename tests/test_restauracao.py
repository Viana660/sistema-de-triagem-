import io
import sqlite3
import tempfile
import unittest
from contextlib import closing, redirect_stdout
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine

from app.database import Base
from app import models
from restaurar_backup import restaurar


class TestRestauracao(unittest.TestCase):
    def setUp(self):
        temporario = tempfile.TemporaryDirectory()
        self.addCleanup(temporario.cleanup)

        self.pasta = Path(temporario.name)
        self.atual = self.pasta / "atual.db"
        self.origem = self.pasta / "origem.db"

        for arquivo, nome in (
            (self.atual, "Cliente atual"),
            (self.origem, "Cliente do backup"),
        ):
            motor = create_engine(
                f"sqlite:///{arquivo.as_posix()}"
            )

            try:
                Base.metadata.create_all(motor)

                with motor.begin() as conexao:
                    conexao.execute(
                        models.Cliente.__table__.insert(),
                        {
                            "cpf": "52998224725",
                            "nome": nome,
                            "telefone": "11999999999",
                        },
                    )
            finally:
                motor.dispose()

        self.engine = create_engine(
            f"sqlite:///{self.atual.as_posix()}"
        )
        self.addCleanup(self.engine.dispose)

        for alvo in ("app.backup.engine", "restaurar_backup.engine"):
            substituicao = patch(alvo, self.engine)
            substituicao.start()
            self.addCleanup(substituicao.stop)

    def executar(self, arquivo, verificar=False, resposta="CANCELAR"):
        argumentos = ["restaurar_backup.py", str(arquivo)]

        if verificar:
            argumentos.append("--verificar")

        with (
            patch("sys.argv", argumentos),
            patch("builtins.input", return_value=resposta),
            redirect_stdout(io.StringIO()),
        ):
            restaurar()

    def ler_nome(self, arquivo):
        with closing(
            sqlite3.connect(arquivo.as_uri() + "?mode=ro", uri=True)
        ) as conexao:
            return conexao.execute(
                "SELECT nome FROM clientes"
            ).fetchone()[0]

    def test_verificacao_nao_substitui_dados(self):
        self.executar(self.origem, verificar=True)

        self.assertEqual(self.ler_nome(self.atual), "Cliente atual")
        self.assertFalse((self.pasta / "backups").exists())

    def test_cancelamento_preserva_banco(self):
        self.executar(self.origem, resposta="CANCELAR")

        self.assertEqual(self.ler_nome(self.atual), "Cliente atual")
        self.assertFalse((self.pasta / "backups").exists())

    def test_rejeita_proprio_banco_como_origem(self):
        with self.assertRaises(ValueError):
            self.executar(self.atual, verificar=True)

        self.assertEqual(self.ler_nome(self.atual), "Cliente atual")

    def test_restaura_e_permite_recuperar_estado_anterior(self):
        self.executar(self.origem, resposta="RESTAURAR")

        self.assertEqual(
            self.ler_nome(self.atual),
            "Cliente do backup",
        )
        self.assertEqual(
            self.ler_nome(self.origem),
            "Cliente do backup",
        )

        copias = list((self.pasta / "backups").glob("*.db"))

        self.assertEqual(len(copias), 1)
        self.assertEqual(
            self.ler_nome(copias[0]),
            "Cliente atual",
        )

        self.executar(copias[0], resposta="RESTAURAR")

        self.assertEqual(
            self.ler_nome(self.atual),
            "Cliente atual",
        )