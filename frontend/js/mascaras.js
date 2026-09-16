function somenteNumeros(valor) {
    return valor.replace(/\D/g, "");
}

function formatarCPF(valor) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    return numeros
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatarTelefone(valor) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length === 0) {
        return "";
    }

    if (numeros.length <= 2) {
        return `(${numeros}`;
    }

    const ddd = numeros.slice(0, 2);
    const numero = numeros.slice(2);
    const tamanhoPrefixo = numeros.length === 11 ? 5 : 4;

    if (numero.length <= tamanhoPrefixo) {
        return `(${ddd}) ${numero}`;
    }

    return `(${ddd}) ${numero.slice(0, tamanhoPrefixo)}-${numero.slice(tamanhoPrefixo)}`;
}

function aplicarMascara(campo, formatar) {
    if (!campo) {
        return;
    }

    campo.value = formatar(campo.value);

    campo.addEventListener("input", () => {
        const posicao = campo.selectionStart ?? campo.value.length;
        const digitosAntes = somenteNumeros(
            campo.value.slice(0, posicao)
        ).length;

        campo.value = formatar(campo.value);

        let novaPosicao = 0;
        let encontrados = 0;

        while (
            novaPosicao < campo.value.length &&
            encontrados < digitosAntes
        ) {
            if (/\d/.test(campo.value[novaPosicao])) {
                encontrados++;
            }

            novaPosicao++;
        }

        campo.setSelectionRange(novaPosicao, novaPosicao);
    });
}

aplicarMascara(document.getElementById("cpf"), formatarCPF);
aplicarMascara(document.getElementById("telefone"), formatarTelefone);