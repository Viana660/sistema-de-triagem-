const formulario = document.getElementById("form-edicao");
const campos = document.getElementById("campos-edicao");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const cpf = parametros.get("cpf");

let original = null;
let salvando = false;

function preencherFormulario(cliente) {
    document.getElementById("cpf").value = formatarCPF(cliente.cpf);
    document.getElementById("telefone").value =
        formatarTelefone(cliente.telefone);
    document.getElementById("nome").value = cliente.nome;
    document.getElementById("email").value = cliente.email ?? "";
    document.getElementById("endereco").value = cliente.endereco ?? "";

    original = cliente;
}

function lerFormulario() {
    return {
        nome: document.getElementById("nome").value.trim(),
        telefone: somenteNumeros(document.getElementById("telefone").value),
        email: document.getElementById("email").value.trim() || null,
        endereco: document.getElementById("endereco").value.trim() || null
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

async function carregarCliente() {
    if (!cpf || !/^[0-9]{11}$/.test(cpf)) {
        mensagem.textContent =
            "Cliente não identificado. Volte à lista e escolha Editar cliente.";
        return;
    }

    mensagem.textContent = "Carregando cliente...";

    try {
        const resposta = await fetch(
            `/clientes/${encodeURIComponent(cpf)}`
        );

        if (resposta.status === 404) {
            mensagem.textContent = "Cliente não encontrado. Volte à lista.";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Falha ao carregar cliente.");
        }

        const cliente = await resposta.json();

        if (cliente.cpf !== cpf) {
            throw new Error("Resposta inesperada da API.");
        }

        preencherFormulario(cliente);
        campos.disabled = false;
        mensagem.textContent = "Altere os campos desejados e salve.";
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar o cliente. Confira o servidor " +
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
            `/clientes/${encodeURIComponent(cpf)}`,
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
                "O cliente não foi encontrado. Volte à lista.";
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

        if (resultado.cpf !== cpf) {
            throw new Error("Resposta inesperada da API.");
        }

        preencherFormulario(resultado);
        mensagem.textContent = "Dados do cliente atualizados com sucesso.";
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

carregarCliente();