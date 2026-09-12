import unittest

from app.validators import cpf_valido


class TestCPF(unittest.TestCase):
    def test_aceita_numero_com_digitos_consistentes(self):
        self.assertTrue(cpf_valido("52998224725"))

    def test_rejeita_primeiro_verificador_alterado(self):
        self.assertFalse(cpf_valido("52998224715"))

    def test_rejeita_segundo_verificador_alterado(self):
        self.assertFalse(cpf_valido("52998224724"))

    def test_rejeita_numeros_repetidos(self):
        for numero in "0123456789":
            with self.subTest(numero=numero):
                self.assertFalse(cpf_valido(numero * 11))

    def test_rejeita_formatos_invalidos(self):
        for valor in ("", "123", "529982247250", "529.982.247-25", "abcdefghijk"):
            with self.subTest(valor=valor):
                self.assertFalse(cpf_valido(valor))