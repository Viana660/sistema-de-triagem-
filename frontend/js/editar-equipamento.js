const formulario = document.getElementById("form-edicao");
const campos = document.getElementById("campos-edicao");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const imei = parametros.get("imei");

let original = null;
let salvando = false;

function preencherFormulario(equipamento) {
    document.getElementById("imei").value = equipamento.imei;
    document.getElementById("marca").value = equipamento.marca;
    document.getElementById("modelo").value = equipamento.modelo;
    document.getElementById("cor").value = equipamento.cor;
    document.getElementById("descricao").value =
        equipamento.descricao ?? "";

    original = equipamento;
}

function lerFormulario() {
    return {
        marca: document.getElementById("marca").value.trim(),
        modelo: document.getElementById("modelo").value.trim(),
        cor: document.getElementById("cor").value.trim(),
        descricao: document.getElementById("descricao").value.trim() || null
    };
}

function explicarErro(detalhe) {
    if (Array.isArray(detalhe)) {
        return detalhe.map((erro) => {
            const campo = erro.loc.slice(1).join(".");
            return `${campo}: ${erro.msg}`;
        }).join(" | ");
    }

    return typeof detalhe === "string"
        ? detalhe
        : "Confira os dados preenchidos.";
}

async function carregarEquipamento() {
    if (!imei || !/^[0-9]{15}$/.test(imei)) {
        mensagem.textContent =
            "Aparelho não identificado. Volte à lista e escolha Editar aparelho.";
        return;
    }

    mensagem.textContent = "Carregando aparelho...";

    try {
        const resposta = await fetch(
            `/equipamentos/${encodeURIComponent(imei)}`
        );

        if (resposta.status === 404) {
            mensagem.textContent = "Aparelho não encontrado. Volte à lista.";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Falha ao carregar aparelho.");
        }

        const equipamento = await resposta.json();

        if (equipamento.imei !== imei) {
            throw new Error("Resposta inesperada da API.");
        }

        preencherFormulario(equipamento);
        campos.disabled = false;
        mensagem.textContent = "Altere os campos desejados e salve.";
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar o aparelho. Confira o servidor " +
            "e recarregue esta página.";
        console.error(erro);
    }
}

async function salvarAlteracoes(evento) {
    evento.preventDefault();

    if (
        salvando ||
        campos.disabled ||
        !original ||
        !formulario.reportValidity()
    ) {
        return;
    }

    const atuais = lerFormulario();
    const alteracoes = {};

    for (const [campo, valor] of Object.entries(atuais)) {
        if (valor !== (original[campo] ?? null)) {
            alteracoes[campo] = valor;
        }
    }

    if (Object.keys(alteracoes).length === 0) {
        mensagem.textContent = "Nenhuma alteração para salvar.";
        return;
    }

    salvando = true;
    campos.disabled = true;
    mensagem.textContent = "Salvando alterações...";

    let manterBloqueado = false;

    try {
        const resposta = await fetch(
            `/equipamentos/${encodeURIComponent(imei)}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(alteracoes)
            }
        );

        if (resposta.status === 404) {
            manterBloqueado = true;
            mensagem.textContent =
                "O aparelho não foi encontrado. Volte à lista.";
            return;
        }

        if (resposta.status >= 500) {
            throw new Error("O servidor não confirmou a alteração.");
        }

        const resultado = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = explicarErro(resultado.detail);
            return;
        }

        if (resultado.imei !== imei) {
            throw new Error("Resposta inesperada da API.");
        }

        preencherFormulario(resultado);
        mensagem.textContent = "Dados do aparelho atualizados com sucesso.";
    } catch (erro) {
        manterBloqueado = true;
        mensagem.textContent =
            "Não foi possível confirmar o salvamento. Volte à lista " +
            "e confira os dados antes de tentar novamente.";
        console.error(erro);
    } finally {
        salvando = false;
        campos.disabled = manterBloqueado;
    }
}

formulario.addEventListener("submit", salvarAlteracoes);

carregarEquipamento();