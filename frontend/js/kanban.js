const estados = ["pendente", "em_andamento", "concluido"];
const mensagem = document.getElementById("mensagem");
const botaoAtualizar = document.getElementById("atualizar");
const filtroTecnico = document.getElementById("filtro-tecnico");

let todasTriagens = [];
let tecnicosPorId = new Map();
let clientesPorCpf = new Map();
let equipamentosPorImei = new Map();
let operacaoEmCurso = false;

function definirOcupado(ocupado) {
    operacaoEmCurso = ocupado;
    filtroTecnico.disabled = ocupado;

    document.querySelectorAll("button, select").forEach((elemento) => {
        elemento.disabled = ocupado;
    });
}

function adicionarTexto(elemento, tag, texto) {
    const item = document.createElement(tag);
    item.textContent = texto;
    elemento.appendChild(item);
}
function criarDetalhes(triagem) {
    const detalhes = document.createElement("details");
    detalhes.className = "detalhes-os";

    const resumo = document.createElement("summary");
    resumo.textContent = "Ver vistoria e observações";
    detalhes.appendChild(resumo);

    adicionarTexto(detalhes, "h4", "Vistoria de entrada");

    const itens = [
        ["liga", "Aparelho liga"],
        ["tela_touch", "Tela e touch"],
        ["traseira", "Tampa traseira"],
        ["carga", "Conector de carga"],
        ["cameras", "Câmeras"],
        ["botoes", "Botões"],
        ["oxidacao", "Sinais de oxidação"],
        ["rede", "Wi-Fi e rede móvel"]
    ];

    const resultados = {
        sem_avaria_aparente: "Sem avaria aparente",
        com_avaria: "Com avaria",
        nao_testado: "Não testado"
    };

    const lista = document.createElement("dl");

    for (const [campo, titulo] of itens) {
        const valor = triagem.checklist?.[campo];

        adicionarTexto(lista, "dt", titulo);
        adicionarTexto(
            lista,
            "dd",
            resultados[valor] ?? "Não informado"
        );
    }

    detalhes.appendChild(lista);

    adicionarTexto(detalhes, "h4", "Observações");

    const observacoes = document.createElement("p");
    observacoes.className = "observacoes-os";
    observacoes.textContent =
        triagem.observacoes?.trim() || "Nenhuma observação registrada.";

    detalhes.appendChild(observacoes);

    return detalhes;
}

function criarAtribuicao(triagem) {
    const container = document.createElement("div");
    container.className = "atribuicao-os";

    const label = document.createElement("label");
    label.textContent = "Técnico responsável";
    label.htmlFor = `tecnico-os-${triagem.id}`;

    const select = document.createElement("select");
    select.id = label.htmlFor;
    select.appendChild(new Option("Fila geral", ""));

    for (const [id, nome] of tecnicosPorId) {
        select.appendChild(new Option(`${nome} (#${id})`, String(id)));
    }

    if (
        triagem.tecnico_id !== null &&
        !tecnicosPorId.has(triagem.tecnico_id)
    ) {
        select.appendChild(new Option(
            `Técnico #${triagem.tecnico_id}`,
            String(triagem.tecnico_id)
        ));
    }

    select.value = triagem.tecnico_id === null
        ? ""
        : String(triagem.tecnico_id);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = "Salvar responsável";

    botao.addEventListener("click", () => {
        const tecnicoId = select.value === ""
            ? null
            : Number(select.value);

        atribuirTecnico(triagem, tecnicoId);
    });

    container.append(label, select, botao);

    return container;
}

function criarCartao(triagem) {
    const cartao = document.createElement("article");
    cartao.className = "cartao";
    const nomeCliente = clientesPorCpf.get(triagem.cliente_cpf)
        ?? "Cliente não encontrado";

    const nomeAparelho = equipamentosPorImei.get(triagem.equipamento_imei)
        ?? "Aparelho não encontrado";

    adicionarTexto(cartao, "h3", `OS #${triagem.id}`);
    adicionarTexto(cartao, "p", `Cliente: ${nomeCliente}`);
    adicionarTexto(cartao, "p", `Aparelho: ${nomeAparelho}`);
    adicionarTexto(cartao, "p", `IMEI: ${triagem.equipamento_imei}`);
    adicionarTexto(cartao, "p", `Queixa: ${triagem.defeito_descricao}`);

    const prioridade = triagem.prioridade === "alta" ? "Alta" : "Normal";
    adicionarTexto(cartao, "p", `Prioridade: ${prioridade}`);

    const responsavel = triagem.tecnico_id === null
        ? "Fila geral"
        : tecnicosPorId.get(triagem.tecnico_id)
            ?? `Técnico #${triagem.tecnico_id}`;

    adicionarTexto(cartao, "p", responsavel);
    cartao.appendChild(criarDetalhes(triagem));
    cartao.appendChild(criarAtribuicao(triagem));
    const proximosStatus = {
        pendente: "em_andamento",
        em_andamento: "concluido"
    };

    const proximoStatus = proximosStatus[triagem.status];

    if (proximoStatus) {
        const botao = document.createElement("button");
        botao.type = "button";

        botao.textContent = triagem.status === "pendente"
            ? "Iniciar reparo"
            : "Concluir reparo";

        botao.addEventListener("click", () => {
            mudarStatus(triagem, proximoStatus);
        });

        cartao.appendChild(botao);
    }

    return cartao;
}

function renderizarQuadro(triagens) {
    for (const estado of estados) {
        const coluna = document.getElementById(estado);
        const contador = document.getElementById(`contador-${estado}`);

        coluna.replaceChildren();

        const itens = triagens.filter(
            (triagem) => triagem.status === estado
        );

        contador.textContent = itens.length;

        if (itens.length === 0) {
            const aviso = document.createElement("p");
            aviso.className = "vazio";
            aviso.textContent = "Nenhuma OS nesta etapa.";
            coluna.appendChild(aviso);
        }

        for (const triagem of itens) {
            coluna.appendChild(criarCartao(triagem));
        }
    }
}

function preencherFiltroTecnicos(tecnicos) {
    const selecaoAnterior = filtroTecnico.value;

    filtroTecnico.replaceChildren(
        new Option("Todos os responsáveis", "todos"),
        new Option("Fila geral", "geral")
    );

    for (const tecnico of tecnicos) {
        const opcao = new Option(
            `${tecnico.nome} (#${tecnico.id})`,
            String(tecnico.id)
        );

        filtroTecnico.appendChild(opcao);
    }

    const selecaoAindaExiste = Array.from(filtroTecnico.options).some(
        (opcao) => opcao.value === selecaoAnterior
    );

    filtroTecnico.value = selecaoAindaExiste
        ? selecaoAnterior
        : "todos";
}

function aplicarFiltro() {
    const selecionado = filtroTecnico.value;

    const filtradas = todasTriagens.filter((triagem) => {
        if (selecionado === "todos") {
            return true;
        }

        if (selecionado === "geral") {
            return triagem.tecnico_id === null;
        }

        return triagem.tecnico_id === Number(selecionado);
    });

    renderizarQuadro(filtradas);

    return filtradas.length;
}

async function consultarERenderizar() {
    const respostas = await Promise.all([
        fetch("/triagens/"),
        fetch("/tecnicos/"),
        fetch("/clientes/"),
        fetch("/equipamentos/")
    ]);

    if (respostas.some((resposta) => !resposta.ok)) {
        throw new Error("Não foi possível carregar os dados do quadro.");
    }

    const dados = await Promise.all(
        respostas.map((resposta) => resposta.json())
    );

    if (!dados.every((lista) => Array.isArray(lista))) {
        throw new Error("A API retornou uma resposta inesperada.");
    }

    const [triagens, tecnicos, clientes, equipamentos] = dados;

    todasTriagens = triagens;

    tecnicosPorId = new Map(
        tecnicos.map((tecnico) => [tecnico.id, tecnico.nome])
    );

    clientesPorCpf = new Map(
        clientes.map((cliente) => [cliente.cpf, cliente.nome])
    );

    equipamentosPorImei = new Map(
        equipamentos.map((equipamento) => [
            equipamento.imei,
            `${equipamento.marca} ${equipamento.modelo}`
        ])
    );

    preencherFiltroTecnicos(tecnicos);

    const quantidadeVisivel = aplicarFiltro();
    definirOcupado(true);

    return quantidadeVisivel;
}

async function carregarTriagens() {
    if (operacaoEmCurso) {
        return;
    }

    definirOcupado(true);
    mensagem.textContent = "Carregando ordens de serviço...";

    try {
        const quantidade = await consultarERenderizar();
        mensagem.textContent = `${quantidade} ordem(ns) exibida(s) para o filtro selecionado.`;
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível atualizar. Os cartões podem estar desatualizados. Clique em Atualizar fila para tentar novamente.";

        console.error(erro);
    } finally {
        definirOcupado(false);
    }
}

async function atribuirTecnico(triagem, tecnicoId) {
    if (operacaoEmCurso) {
        return;
    }

    if (tecnicoId === triagem.tecnico_id) {
        mensagem.textContent =
            `O responsável da OS #${triagem.id} já é o selecionado.`;
        return;
    }

    definirOcupado(true);
    mensagem.textContent = `Salvando responsável da OS #${triagem.id}...`;

    let aviso;

    try {
        const resposta = await fetch(
            `/triagens/${triagem.id}/tecnico`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tecnico_id: tecnicoId
                })
            }
        );

        if (resposta.ok) {
            aviso = `Responsável da OS #${triagem.id} atualizado.`;
        } else if (resposta.status === 404) {
            aviso = "A OS ou o técnico não foi encontrado.";
        } else {
            aviso = `A API recusou a alteração (erro ${resposta.status}).`;
        }
    } catch (erro) {
        aviso =
            "A conexão falhou. Não foi possível confirmar se a alteração foi salva.";
        console.error(erro);
    }

    try {
        await consultarERenderizar();
        mensagem.textContent = `${aviso} Quadro atualizado.`;
    } catch (erro) {
        mensagem.textContent =
            `${aviso} Não foi possível recarregar o quadro. ` +
            "Clique em Atualizar fila antes de tentar novamente.";
        console.error(erro);
    } finally {
        definirOcupado(false);
    }
}

async function mudarStatus(triagem, novoStatus) {
    if (operacaoEmCurso) {
        return;
    }

    definirOcupado(true);
    mensagem.textContent = `Atualizando OS #${triagem.id}...`;

    let aviso;

    try {
        const resposta = await fetch(
            `/triagens/${triagem.id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status_atual: triagem.status,
                    novo_status: novoStatus
                })
            }
        );

        if (resposta.ok) {
            aviso = `Status da OS #${triagem.id} atualizado.`;
        } else if (resposta.status === 409) {
            aviso =
                "A alteração não foi aplicada: o estado da OS mudou ou a transição não é permitida.";
        } else if (resposta.status === 404) {
            aviso = "A ordem de serviço não foi encontrada.";
        } else {
            aviso = `A API recusou a atualização (erro ${resposta.status}).`;
        }
    } catch (erro) {
        aviso =
            "A conexão falhou. Não foi possível confirmar se a alteração foi salva.";

        console.error(erro);
    }

    try {
        await consultarERenderizar();
        mensagem.textContent = `${aviso} Quadro atualizado.`;
    } catch (erro) {
        mensagem.textContent =
            `${aviso} Não foi possível recarregar o quadro. Clique em Atualizar fila antes de tentar novamente.`;

        console.error(erro);
    } finally {
        definirOcupado(false);
    }
}

botaoAtualizar.addEventListener("click", carregarTriagens);

filtroTecnico.addEventListener("change", () => {
    if (operacaoEmCurso) {
        return;
    }

    const quantidade = aplicarFiltro();

    mensagem.textContent =
        `${quantidade} ordem(ns) exibida(s) com os últimos dados carregados.`;
});

carregarTriagens();