const lista = document.getElementById("lista-equipamentos");
const busca = document.getElementById("busca-equipamento");
const mensagem = document.getElementById("mensagem");
const botaoAtualizar = document.getElementById("atualizar-equipamentos");

let equipamentos = [];
let carregando = false;
let listaDisponivel = false;
let falhaNaAtualizacao = false;

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

function criarCartao(equipamento) {
    const cartao = document.createElement("article");
    cartao.className = "cartao";

    adicionarTexto(
        cartao,
        "h2",
        `${equipamento.marca} ${equipamento.modelo}`
    );
    adicionarTexto(cartao, "p", `IMEI: ${equipamento.imei}`);
    adicionarTexto(cartao, "p", `Cor: ${equipamento.cor}`);
    adicionarTexto(
        cartao,
        "p",
        `Descrição: ${equipamento.descricao || "Não informada"}`
    );
    const editar = document.createElement("a");
    editar.className = "botao-link";
    editar.textContent = "Editar aparelho";
    editar.href =
        `/interface/editar-equipamento.html?imei=${encodeURIComponent(equipamento.imei)}`;

    cartao.appendChild(editar);
    return cartao;
}

function renderizarEquipamentos() {
    const termo = normalizarTexto(busca.value);

    const encontrados = equipamentos.filter((equipamento) => {
        const identificacao = normalizarTexto(
            `${equipamento.marca} ${equipamento.modelo}`
        );

        return identificacao.includes(termo)
            || equipamento.imei.includes(termo);
    });

    lista.replaceChildren();

    for (const equipamento of encontrados) {
        lista.appendChild(criarCartao(equipamento));
    }

    if (encontrados.length === 0) {
        adicionarTexto(
            lista,
            "p",
            equipamentos.length === 0
                ? "Nenhum aparelho cadastrado."
                : "Nenhum aparelho corresponde à busca."
        );
    }

    const aviso = falhaNaAtualizacao
        ? "Não foi possível atualizar. Exibindo os últimos dados carregados. "
        : "";

    mensagem.textContent =
        `${aviso}${encontrados.length} aparelho(s) encontrado(s).`;
}

async function carregarEquipamentos() {
    if (carregando) {
        return;
    }

    carregando = true;
    botaoAtualizar.disabled = true;
    busca.disabled = true;
    mensagem.textContent = "Carregando aparelhos...";

    try {
        const resposta = await fetch("/equipamentos/");

        if (!resposta.ok) {
            throw new Error("Falha ao consultar aparelhos.");
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error("Resposta inesperada da API.");
        }

        equipamentos = dados;
        listaDisponivel = true;
        falhaNaAtualizacao = false;
        renderizarEquipamentos();
    } catch (erro) {
        falhaNaAtualizacao = true;

        if (listaDisponivel) {
            renderizarEquipamentos();
        } else {
            mensagem.textContent =
                "Não foi possível carregar os aparelhos. " +
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
    if (!carregando && listaDisponivel) {
        renderizarEquipamentos();
    }
});

botaoAtualizar.addEventListener("click", carregarEquipamentos);

carregarEquipamentos();