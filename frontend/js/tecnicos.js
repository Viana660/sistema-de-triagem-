const formulario = document.getElementById("form-tecnico");
const campos = document.getElementById("campos-tecnico");
const mensagem = document.getElementById("mensagem");

let enviando = false;

function montarDados() {
    return {
        nome: document.getElementById("nome").value.trim(),
        telefone: somenteNumeros(document.getElementById("telefone").value),
        especialidade:
            document.getElementById("especialidade").value.trim() || null
    };
}

function explicarErro(detalhe) {
    if (Array.isArray(detalhe)) {
        return detalhe.map(erro => {
            const campo = erro.loc.slice(1).join(".");
            return `${campo}: ${erro.msg}`;
        }).join(" | ");
    }

    return typeof detalhe === "string"
        ? detalhe
        : "Não foi possível cadastrar. Confira os dados preenchidos.";
}

async function cadastrarTecnico(evento) {
    evento.preventDefault();

    if (enviando || campos.disabled || !formulario.reportValidity()) {
        return;
    }

    const dados = montarDados();

    enviando = true;
    campos.disabled = true;
    mensagem.textContent = "Cadastrando técnico...";

    let resultadoIncerto = false;

    try {
        const resposta = await fetch("/tecnicos/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        if (resposta.status >= 500) {
            throw new Error("O servidor não confirmou o cadastro.");
        }

        const resultado = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = explicarErro(resultado.detail);
            return;
        }

        if (
            resposta.status !== 201 ||
            !Number.isInteger(resultado.id)
        ) {
            throw new Error("Resposta de cadastro inesperada.");
        }

        formulario.reset();
        mensagem.textContent =
            `Técnico ${resultado.nome} (#${resultado.id}) cadastrado. ` +
            "Ele já pode ser selecionado na bancada técnica.";
    } catch (erro) {
        resultadoIncerto = true;
        mensagem.textContent =
            "Não foi possível confirmar o cadastro. Abra a bancada " +
            "e confira a lista de técnicos antes de tentar novamente. " +
            "Depois recarregue esta página.";
        console.error(erro);
    } finally {
        enviando = false;
        campos.disabled = resultadoIncerto;
    }
}

formulario.addEventListener("submit", cadastrarTecnico);