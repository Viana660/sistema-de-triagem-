const formulario = document.getElementById("form-equipamento");
const campos = document.getElementById("campos-equipamento");
const mensagem = document.getElementById("mensagem");

let enviando = false;

function montarDados() {
    return {
        imei: document.getElementById("imei").value.trim(),
        marca: document.getElementById("marca").value.trim(),
        modelo: document.getElementById("modelo").value.trim(),
        cor: document.getElementById("cor").value.trim(),
        descricao: document.getElementById("descricao").value.trim() || null
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

async function cadastrarEquipamento(evento) {
    evento.preventDefault();

    if (enviando || !formulario.reportValidity()) {
        return;
    }

    const dados = montarDados();

    enviando = true;
    campos.disabled = true;
    mensagem.textContent = "Cadastrando aparelho...";

    try {
        const resposta = await fetch("/equipamentos/", {
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

        if (resposta.status !== 201 || resultado.imei !== dados.imei) {
            throw new Error("Resposta de cadastro inesperada.");
        }

        formulario.reset();
        mensagem.textContent =
            `Aparelho ${resultado.marca} ${resultado.modelo} ` +
            "cadastrado com sucesso. Você já pode selecioná-lo " +
            "na página Nova triagem.";
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível confirmar o cadastro. Abra Nova triagem " +
            "e confira se o aparelho aparece antes de tentar novamente.";
        console.error(erro);
    } finally {
        enviando = false;
        campos.disabled = false;
    }
}

formulario.addEventListener("submit", cadastrarEquipamento);