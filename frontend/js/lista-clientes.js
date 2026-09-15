const lista = document.getElementById("lista-clientes");
const busca = document.getElementById("busca-cliente");
const mensagem = document.getElementById("mensagem");
const botaoAtualizar = document.getElementById("atualizar-clientes");

let clientes = [];
let carregando = false;
let listaDisponivel = false;
let falhaNaAtualizacao = false;
let excluindo = false;

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function adicionarTexto(elemento, tag, texto) {
    const item = document.createElement(tag);
    item.textContent = texto;
    elemento.appendChild(item);
}

function criarCartao(cliente) {
    const cartao = document.createElement("article");
    cartao.className = "cartao";

    adicionarTexto(cartao, "h2", cliente.nome);
    adicionarTexto(cartao, "p", `CPF: ${cliente.cpf}`);
    adicionarTexto(cartao, "p", `Telefone: ${cliente.telefone}`);
    adicionarTexto(
        cartao,
        "p",
        `E-mail: ${cliente.email || "Não informado"}`
    );
    adicionarTexto(
        cartao,
        "p",
        `Endereço: ${cliente.endereco || "Não informado"}`
    );
    const editar = document.createElement("a");
    editar.className = "botao-link";
    editar.textContent = "Editar cliente";
    editar.href =
        `/interface/editar-cliente.html?cpf=${encodeURIComponent(cliente.cpf)}`;

    cartao.appendChild(editar);
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "Excluir cliente";
    excluir.className = "botao-excluir";
    excluir.disabled = excluindo;

    excluir.addEventListener("click", () => {
        excluirCliente(cliente);
    });

    cartao.appendChild(excluir);

    return cartao;
}

function renderizarClientes() {
    const termo = normalizarTexto(busca.value);
    const cpfBuscado = termo.replace(/\D/g, "");
    const buscaNumerica =
        cpfBuscado.length > 0 && /^[\d.\-\s]+$/.test(termo);

    const encontrados = clientes.filter((cliente) => {
        if (termo === "") {
            return true;
        }

        const nomeCombina = normalizarTexto(cliente.nome).includes(termo);
        const cpfCombina =
            buscaNumerica && cliente.cpf.includes(cpfBuscado);

        return nomeCombina || cpfCombina;
    });

    lista.replaceChildren();

    for (const cliente of encontrados) {
        lista.appendChild(criarCartao(cliente));
    }

    if (encontrados.length === 0) {
        adicionarTexto(
            lista,
            "p",
            clientes.length === 0
                ? "Nenhum cliente cadastrado."
                : "Nenhum cliente corresponde à busca."
        );
    }

    const aviso = falhaNaAtualizacao
        ? "Não foi possível atualizar. Exibindo os últimos dados carregados. "
        : "";

    mensagem.textContent =
        `${aviso}${encontrados.length} cliente(s) encontrado(s).`;
}
async function excluirCliente(cliente) {
    if (carregando || excluindo) {
        return;
    }

    const confirmou = window.confirm(
        `Excluir o cliente "${cliente.nome}" (CPF ${cliente.cpf})?\n\n` +
        "A exclusão é permanente e só será permitida se não houver " +
        "ordem de serviço vinculada."
    );

    if (!confirmou) {
        return;
    }

    excluindo = true;
    botaoAtualizar.disabled = true;
    busca.disabled = true;

    lista.querySelectorAll("button").forEach((botao) => {
        botao.disabled = true;
    });

    mensagem.textContent = "Excluindo cliente...";

    let aviso;

    try {
        const resposta = await fetch(
            `/clientes/${encodeURIComponent(cliente.cpf)}`,
            { method: "DELETE" }
        );

        if (resposta.ok) {
            aviso = "Cliente excluído com sucesso.";
        } else if (resposta.status === 404) {
            aviso = "O cliente já não está disponível.";
        } else if (resposta.status === 409) {
            const resultado = await resposta.json();
            aviso = resultado.detail;
        } else {
            aviso = `Não foi possível confirmar a exclusão (erro ${resposta.status}).`;
        }
    } catch (erro) {
        aviso =
            "A conexão falhou. Não foi possível confirmar a exclusão.";
        console.error(erro);
    }

    try {
        const resposta = await fetch("/clientes/");

        if (!resposta.ok) {
            throw new Error("Falha ao atualizar a lista.");
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error("Resposta inesperada da API.");
        }

        clientes = dados;
        listaDisponivel = true;
        falhaNaAtualizacao = false;
        renderizarClientes();

        mensagem.textContent = `${aviso} ${mensagem.textContent}`;
    } catch (erro) {
        falhaNaAtualizacao = true;
        mensagem.textContent =
            `${aviso} A lista pode estar desatualizada. ` +
            "Clique em Atualizar lista antes de tentar novamente.";
        console.error(erro);
    } finally {
        excluindo = false;
        botaoAtualizar.disabled = false;
        busca.disabled = !listaDisponivel;

        lista.querySelectorAll("button").forEach((botao) => {
            botao.disabled = false;
        });
    }
}
async function carregarClientes() {
    if (carregando || excluindo) {
        return;
    }

    carregando = true;
    botaoAtualizar.disabled = true;
    busca.disabled = true;
    mensagem.textContent = "Carregando clientes...";

    try {
        const resposta = await fetch("/clientes/");

        if (!resposta.ok) {
            throw new Error("Falha ao consultar clientes.");
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error("Resposta inesperada da API.");
        }

        clientes = dados;
        listaDisponivel = true;
        falhaNaAtualizacao = false;
        renderizarClientes();
    } catch (erro) {
        falhaNaAtualizacao = true;

        if (listaDisponivel) {
            renderizarClientes();
        } else {
            mensagem.textContent =
                "Não foi possível carregar os clientes. " +
                "Confira o servidor e clique em Atualizar lista.";
        }

        console.error(erro);
    } finally {
        carregando = false;
        botaoAtualizar.disabled = false;
        busca.disabled = !listaDisponivel;
    }
}

busca.addEventListener("input", () => {
    if (!carregando && !excluindo && listaDisponivel) {
        renderizarClientes();
    }
});

botaoAtualizar.addEventListener("click", carregarClientes);

carregarClientes();