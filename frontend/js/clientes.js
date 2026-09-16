const formulario = document.getElementById("form-cliente");
const campos = document.getElementById("campos-cliente");
const mensagem = document.getElementById("mensagem");

let enviando = false;

function montarDados() {
    return {
        nome: document.getElementById("nome").value.trim(),
        cpf: somenteNumeros(document.getElementById("cpf").value),
        telefone: somenteNumeros(document.getElementById("telefone").value),
        email: document.getElementById("email").value.trim() || null,
        endereco: document.getElementById("endereco").value.trim() || null
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

async function cadastrarCliente(evento) {
    evento.preventDefault();

    if (enviando || !formulario.reportValidity()) {
        return;
    }

    const dados = montarDados();

    enviando = true;
    campos.disabled = true;
    mensagem.textContent = "Cadastrando cliente...";

    try {
        const resposta = await fetch("/clientes/", {
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

        if (resposta.status !== 201 || resultado.cpf !== dados.cpf) {
            throw new Error("Resposta de cadastro inesperada.");
        }

        formulario.reset();
        mensagem.textContent =
            `Cliente ${resultado.nome} cadastrado com sucesso. ` +
            "Você já pode selecioná-lo na página Nova triagem.";
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível confirmar o cadastro. Abra Nova triagem " +
            "e confira se o cliente aparece antes de tentar novamente.";
        console.error(erro);
    } finally {
        enviando = false;
        campos.disabled = false;
    }
}

formulario.addEventListener("submit", cadastrarCliente);