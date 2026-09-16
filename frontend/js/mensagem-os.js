const mensagem = document.getElementById("mensagem");
const campos = document.getElementById("campos-mensagem");
const destinatario = document.getElementById("destinatario");
const telefone = document.getElementById("telefone-destinatario");
const previa = document.getElementById("previa");
const botaoWhatsApp = document.getElementById("abrir-whatsapp");

const parametros = new URLSearchParams(window.location.search);
const osId = parametros.get("os");

let tecnicosPorId = new Map();

async function consultar(endereco) {
    const resposta = await fetch(endereco);

    if (resposta.status === 404) {
        throw new Error("A OS ou um cadastro vinculado não foi encontrado.");
    }

    if (!resposta.ok) {
        throw new Error("Não foi possível consultar os dados.");
    }

    return resposta.json();
}

function montarMensagem(triagem, equipamento) {
    const nomesStatus = {
        pendente: "Aguardando análise",
        em_andamento: "Em reparo",
        concluido: "Concluído"
    };

    const resultados = {
        sem_avaria_aparente: "Sem avaria aparente",
        com_avaria: "Com avaria",
        nao_testado: "Não testado"
    };

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

    const linhas = [
        `*Ordem de serviço #${triagem.id}*`,
        "",
        `Aparelho: ${equipamento.marca} ${equipamento.modelo}`,
        `Cor: ${equipamento.cor}`,
        `Status: ${nomesStatus[triagem.status] ?? triagem.status}`,
        `Prioridade: ${triagem.prioridade === "alta" ? "Alta" : "Normal"}`,
        "",
        "*Defeito relatado*",
        triagem.defeito_descricao,
        "",
        "*Vistoria de entrada*"
    ];

    for (const [campo, titulo] of itens) {
        const resultado = resultados[triagem.checklist?.[campo]]
            ?? "Não informado";

        linhas.push(`- ${titulo}: ${resultado}`);
    }

    linhas.push(
        "",
        "*Observações*",
        triagem.observacoes?.trim() || "Nenhuma observação registrada."
    );

    return linhas.join("\n");
}

function atualizarDestinatario() {
    const tecnico = tecnicosPorId.get(Number(destinatario.value));
    const numeros = tecnico
        ? somenteNumeros(tecnico.telefone)
        : "";

    telefone.value = tecnico
        ? formatarTelefone(numeros)
        : "";

    const telefoneValido = /^[0-9]{10,11}$/.test(numeros);

    botaoWhatsApp.disabled = !telefoneValido;

    if (!tecnico) {
        mensagem.textContent = "Selecione um técnico destinatário.";
        return;
    }

    if (!telefoneValido) {
        mensagem.textContent =
            "O técnico não possui um telefone válido. Atualize o cadastro.";
        return;
    }

    mensagem.textContent =
        `Destinatário selecionado: ${tecnico.nome}. ` +
        "Confira o telefone e a mensagem antes de abrir o WhatsApp.";
}

async function carregarDados() {
    if (!osId || !/^[1-9][0-9]*$/.test(osId)) {
        mensagem.textContent =
            "OS não identificada. Volte à bancada e escolha Preparar mensagem.";
        return;
    }

    mensagem.textContent = "Carregando dados da ordem de serviço...";

    try {
        const [triagem, tecnicos] = await Promise.all([
            consultar(`/triagens/${encodeURIComponent(osId)}`),
            consultar("/tecnicos/")
        ]);

        if (
            !Array.isArray(tecnicos) ||
            String(triagem.id) !== osId
        ) {
            throw new Error("A API retornou dados inesperados.");
        }

        const equipamento = await consultar(
            `/equipamentos/${encodeURIComponent(triagem.equipamento_imei)}`
        );

        tecnicosPorId = new Map(
            tecnicos.map((tecnico) => [tecnico.id, tecnico])
        );

        destinatario.replaceChildren(
            new Option("Selecione um técnico...", "")
        );

        for (const tecnico of tecnicos) {
            destinatario.appendChild(new Option(
                `${tecnico.nome} (#${tecnico.id})`,
                String(tecnico.id)
            ));
        }

        previa.value = montarMensagem(triagem, equipamento);

        if (
            triagem.tecnico_id !== null &&
            tecnicosPorId.has(triagem.tecnico_id)
        ) {
            destinatario.value = String(triagem.tecnico_id);
        }

        campos.disabled = false;
        atualizarDestinatario();

        if (tecnicos.length === 0) {
            mensagem.textContent =
                "Não há técnicos cadastrados. Cadastre um técnico para escolher o destinatário.";
        }
    } catch (erro) {
        mensagem.textContent =
            `${erro.message} Confira o servidor e recarregue a página.`;
        console.error(erro);
    }
}

function abrirWhatsApp() {
    const tecnico = tecnicosPorId.get(Number(destinatario.value));

    if (!tecnico) {
        mensagem.textContent = "Selecione um técnico destinatário.";
        return;
    }

    const numeros = somenteNumeros(tecnico.telefone);

    if (!/^[0-9]{10,11}$/.test(numeros)) {
        mensagem.textContent =
            "Telefone inválido. Atualize o cadastro do técnico.";
        return;
    }

    const texto = previa.value.trim();

    if (!texto) {
        mensagem.textContent = "A mensagem ainda não está disponível.";
        return;
    }

    const telefoneInternacional = `55${numeros}`;
    const endereco =
        `https://wa.me/${telefoneInternacional}` +
        `?text=${encodeURIComponent(texto)}`;

    window.open(endereco, "_blank", "noopener,noreferrer");

    mensagem.textContent =
        "Foi solicitada a abertura do WhatsApp. " +
        "Revise a conversa e confirme o envio por lá. " +
        "Se nenhuma aba abriu, confira o bloqueio de pop-ups do navegador.";
}

destinatario.addEventListener("change", atualizarDestinatario);
botaoWhatsApp.addEventListener("click", abrirWhatsApp);

carregarDados();