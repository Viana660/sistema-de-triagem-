def cpf_valido(cpf: str) -> bool:
    if len(cpf) != 11:
        return False

    if any(caractere not in "0123456789" for caractere in cpf):
        return False

    if cpf == cpf[0] * 11:
        return False

    for quantidade in (9, 10):
        soma = 0

        for indice in range(quantidade):
            peso = quantidade + 1 - indice
            soma += int(cpf[indice]) * peso

        resto = soma % 11
        digito = 0 if resto < 2 else 11 - resto

        if digito != int(cpf[quantidade]):
            return False

    return True