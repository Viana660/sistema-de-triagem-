const formulario = document.getElementById("form-triagem");
const campos = document.getElementById("campos-triagem");
const mensagem = document.getElementById("mensagem");

const clienteSelect = document.getElementById("cliente");
const equipamentoSelect = document.getElementById("equipamento");
const tecnicoSelect = document.getElementById("tecnico");

let enviando = false;

const itensChecklist = [
    ["liga", "Aparelho liga"],
    ["tela_touch", "Tela e touch"],
    ["traseira", "Tampa traseira"],
    ["carga", "Conector de carga"],
    ["cameras", "Câmeras"],
    ["botoes", "Botões"],
    ["oxidacao", "Sinais de oxidação"],
    ["rede", "Wi-Fi e rede móvel"]
];

function criarChecklist() {
    const container = document.getElementById("checklist");

    for (const [campo, titulo] of itensChecklist) {
        const label = document.createElement("label");
        label.textContent = `${titulo} *`;

        const select = document.createElement("select");
        select.id = `check-${campo}`;
        select.required = true;

        select.append(
            new Option("Selecione o resultado...", ""),
            new Option("Sem avaria aparente", "sem_avaria_aparente"),
            new Option("Com avaria", "com_avaria"),
            new Option("Não testado", "nao_testado")
        );

        label.appendChild(select);
        container.appendChild(label);
    }
}

async function consultarLista(endereco) {
    const resposta = await fetch(endereco);

    if (!resposta.ok) {
        throw new Error(`Falha ao consultar ${endereco}`);
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados)) {
        throw new Error("Resposta inesperada da API.");
    }

    return dados;
}

async function carregarCadastros() {
    mensagem.textContent = "Carregando cadastros...";

    try {
        const [clientes, equipamentos, tecnicos] = await Promise.all([
            consultarLista("/clientes/"),
            consultarLista("/equipamentos/"),
            consultarLista("/tecnicos/")
        ]);

        clienteSelect.replaceChildren(
            new Option("Selecione um cliente...", "")
        );

        for (const cliente of clientes) {
            clienteSelect.appendChild(
                new Option(`${cliente.nome} — ${cliente.cpf}`, cliente.cpf)
            );
        }

        equipamentoSelect.replaceChildren(
            new Option("Selecione um aparelho...", "")
        );

        for (const equipamento of equipamentos) {
            equipamentoSelect.appendChild(
                new Option(
                    `${equipamento.marca} ${equipamento.modelo} — ${equipamento.imei}`,
                    equipamento.imei
                )
            );
        }

        tecnicoSelect.replaceChildren(
            new Option("Fila geral — sem técnico", "")
        );

        for (const tecnico of tecnicos) {
            tecnicoSelect.appendChild(
                new Option(`${tecnico.nome} (#${tecnico.id})`, tecnico.id)
            );
        }

        if (clientes.length === 0 || equipamentos.length === 0) {
            mensagem.textContent =
                "Cadastre pelo menos um cliente e um aparelho na API. Depois recarregue esta página.";
            return;
        }

        campos.disabled = false;
        mensagem.textContent = "Preencha os dados e todos os itens da vistoria.";
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar os cadastros. Confira o servidor e recarregue a página.";

        console.error(erro);
    }
}

function montarDados() {
    const checklist = {};

    for (const [campo] of itensChecklist) {
        checklist[campo] = document.getElementById(`check-${campo}`).value;
    }

    return {
        cliente_cpf: clienteSelect.value,
        equipamento_imei: equipamentoSelect.value,
        tecnico_id: tecnicoSelect.value === ""
            ? null
            : Number(tecnicoSelect.value),
        prioridade: document.getElementById("prioridade").value,
        defeito_descricao: document.getElementById("defeito").value.trim(),
        checklist: checklist,
        observacoes: document.getElementById("observacoes").value.trim() || null
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

async function salvarTriagem(evento) {
    evento.preventDefault();

    if (enviando || campos.disabled || !formulario.reportValidity()) {
        return;
    }

    const dados = montarDados();

    enviando = true;
    campos.disabled = true;
    mensagem.textContent = "Salvando ordem de serviço...";

    let resultadoIncerto = false;

    try {
        const resposta = await fetch("/triagens/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        if (resposta.status >= 500) {
            throw new Error("O servidor não confirmou o resultado.");
        }

        const resultado = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = explicarErro(resultado.detail);
            return;
        }

        if (!Number.isInteger(resultado.id)) {
            throw new Error("Resposta de cadastro inesperada.");
        }

        formulario.reset();

        mensagem.textContent =
            `OS #${resultado.id} criada com sucesso. Ela está aguardando análise na bancada.`;
    } catch (erro) {
        resultadoIncerto = true;

        mensagem.textContent =
            "Não foi possível confirmar o cadastro. Confira a bancada antes de tentar novamente para evitar uma OS duplicada. Depois recarregue esta página.";

        console.error(erro);
    } finally {
        enviando = false;
        campos.disabled = resultadoIncerto;
    }
}

formulario.addEventListener("submit", salvarTriagem);

criarChecklist();
carregarCadastros();