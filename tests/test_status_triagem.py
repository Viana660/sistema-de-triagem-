from unittest.mock import patch
from main import listar_triagens
import unittest
from datetime import timedelta
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Cliente, Equipamento, Triagem
from app.schemas import MudancaStatus
from main import atualizar_status_triagem


class TestStatusTriagem(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)

        self.db = Session(self.engine)

        self.db.add(
            Cliente(
                cpf="52998224725",
                nome="Cliente Teste",
                telefone="11999999999",
            )
        )

        self.db.add(
            Equipamento(
                imei="123456789012345",
                marca="Teste",
                modelo="Teste",
                cor="Preto",
            )
        )

        self.db.commit()

        itens = (
            "liga",
            "tela_touch",
            "traseira",
            "carga",
            "cameras",
            "botoes",
            "oxidacao",
            "rede",
        )

        triagem = Triagem(
            cliente_cpf="52998224725",
            equipamento_imei="123456789012345",
            defeito_descricao="Tela não responde",
            checklist={item: "nao_testado" for item in itens},
            status="pendente",
        )

        self.db.add(triagem)
        self.db.commit()
        self.triagem_id = triagem.id

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def mudar_status(self, atual, novo):
        dados = MudancaStatus(
            status_atual=atual,
            novo_status=novo,
        )

        return atualizar_status_triagem(
            self.triagem_id,
            dados,
            self.db,
        )

    def test_permite_fluxo_completo(self):
        resultado = self.mudar_status("pendente", "em_andamento")
        self.assertEqual(resultado.status, "em_andamento")

        resultado = self.mudar_status("em_andamento", "concluido")
        self.assertEqual(resultado.status, "concluido")

    def test_bloqueia_salto(self):
        with self.assertRaises(HTTPException) as contexto:
            self.mudar_status("pendente", "concluido")

        self.assertEqual(contexto.exception.status_code, 409)

        triagem = self.db.get(Triagem, self.triagem_id)
        self.assertEqual(triagem.status, "pendente")

    def test_bloqueia_pedido_desatualizado(self):
        self.mudar_status("pendente", "em_andamento")

        with self.assertRaises(HTTPException) as contexto:
            self.mudar_status("pendente", "em_andamento")

        self.assertEqual(contexto.exception.status_code, 409)

        triagem = self.db.get(Triagem, self.triagem_id)
        self.assertEqual(triagem.status, "em_andamento")

    def test_bloqueia_retorno(self):
        self.mudar_status("pendente", "em_andamento")
        self.mudar_status("em_andamento", "concluido")

        with self.assertRaises(HTTPException) as contexto:
            self.mudar_status("concluido", "em_andamento")

        self.assertEqual(contexto.exception.status_code, 409)

    def test_rejeita_os_inexistente(self):
        self.triagem_id = 999

        with self.assertRaises(HTTPException) as contexto:
            self.mudar_status("pendente", "em_andamento")

        self.assertEqual(contexto.exception.status_code, 404)

    def test_registra_datas_e_prazo_do_historico(self):
        resultado = self.mudar_status("pendente", "em_andamento")

        self.assertIsNotNone(resultado.iniciada_em)
        self.assertIsNone(resultado.concluida_em)
        self.assertIsNone(resultado.arquivar_em)

        inicio = resultado.iniciada_em

        resultado = self.mudar_status("em_andamento", "concluido")

        self.assertEqual(resultado.iniciada_em, inicio)
        self.assertIsNotNone(resultado.concluida_em)
        self.assertGreaterEqual(resultado.concluida_em, inicio)
        self.assertEqual(
            resultado.arquivar_em - resultado.concluida_em,
            timedelta(hours=15),
        )

    def test_separar_historico_dentro_de_15_horas(self):
        self.mudar_status("pendente", "em_andamento")
        resultado = self.mudar_status("em_andamento", "concluido")
        prazo = resultado.arquivar_em

        with patch(
            "main.agora_utc",
            return_value=prazo - timedelta(seconds=1),
        ):
            bancada = listar_triagens(
                db=self.db,
                visao="bancada",
            )
            historico = listar_triagens(
                db=self.db,
                visao="historico",
            )

            self.assertEqual(
                [os.id for os in bancada],
                [self.triagem_id],
            )
            self.assertEqual(historico, [])

        with patch("main.agora_utc", return_value=prazo):
            bancada = listar_triagens(
                db=self.db,
                visao="bancada",
            )
            historico = listar_triagens(
                db=self.db,
                visao="historico",
            )
            todas = listar_triagens(
                db=self.db,
                visao="todas",
            )

            self.assertEqual(bancada, [])
            self.assertEqual(
                [os.id for os in historico],
                [self.triagem_id],
            )
            self.assertEqual(
                [os.id for os in todas],
                [self.triagem_id],
            )
