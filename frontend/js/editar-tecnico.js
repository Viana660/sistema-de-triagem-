const selecao = document.getElementById("selecao-tecnico");
const formulario = document.getElementById("form-edicao");
const campos = document.getElementById("campos-edicao");
const mensagem = document.getElementById("mensagem");

let original = null;
let ocupado = false;

function preencherFormulario(tecnico) {
    document.getElementById("tecnico-id").value = tecnico.id;
    document.getElementById("nome").value = tecnico.nome;
    document.getElementById("telefone").value =
        formatarTelefone(tecnico.telefone);
    document.getElementById("especialidade").value =
        tecnico.especialidade ?? "";

    original = tecnico;
}

function lerFormulario() {
    return {
        nome: document.getElementById("nome").value.trim(),
        telefone: somenteNumeros(
            document.getElementById("telefone").value
        ),
        especialidade:
            document.getElementById("especialidade").value.trim() || null
    };
}

function obterAlteracoes() {
    const alteracoes = {};

    if (!original) {
        return alteracoes;
    }

    for (const [campo, valor] of Object.entries(lerFormulario())) {
        if (valor !== (original[campo] ?? null)) {
            alteracoes[campo] = valor;
        }
    }

    return alteracoes;
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

async function carregarLista() {
    mensagem.textContent = "Carregando técnicos...";

    try {
        const resposta = await fetch("/tecnicos/");

        if (!resposta.ok) {
            throw new Error("Falha ao carregar técnicos.");
        }

        const tecnicos = await resposta.json();

        if (!Array.isArray(tecnicos)) {
            throw new Error("Resposta inesperada da API.");
        }

        selecao.replaceChildren(
            new Option("Selecione um técnico...", "")
        );

        for (const tecnico of tecnicos) {
            selecao.appendChild(new Option(
                `${tecnico.nome} (#${tecnico.id})`,
                String(tecnico.id)
            ));
        }

        selecao.disabled = tecnicos.length === 0;
        mensagem.textContent = tecnicos.length === 0
            ? "Nenhum técnico cadastrado."
            : "Selecione o técnico que deseja editar.";
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar os técnicos. " +
            "Confira o servidor e recarregue esta página.";
        console.error(erro);
    }
}

async function selecionarTecnico() {
    if (ocupado) {
        return;
    }

    if (original && Object.keys(obterAlteracoes()).length > 0) {
        const descartar = window.confirm(
            "Existem alterações não salvas. Deseja descartá-las e trocar de técnico?"
        );

        if (!descartar) {
            selecao.value = String(original.id);
            return;
        }
    }

    const id = selecao.value;

    original = null;
    formulario.reset();
    campos.disabled = true;

    if (id === "") {
        mensagem.textContent = "Selecione um técnico.";
        return;
    }

    ocupado = true;
    selecao.disabled = true;
    mensagem.textContent = "Carregando dados do técnico...";

    try {
        const resposta = await fetch(
            `/tecnicos/${encodeURIComponent(id)}`
        );

        if (resposta.status === 404) {
            mensagem.textContent = "Técnico não encontrado.";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Falha ao carregar técnico.");
        }

        const tecnico = await resposta.json();

        if (tecnico.id !== Number(id)) {
            throw new Error("Resposta inesperada da API.");
        }

        preencherFormulario(tecnico);
        campos.disabled = false;
        mensagem.textContent = "Altere os campos desejados e salve.";
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar os dados. " +
            "Selecione novamente o técnico ou recarregue a página.";
        console.error(erro);
    } finally {
        ocupado = false;
        selecao.disabled = false;

        if (!original) {
            selecao.value = "";
        }
    }
}

async function salvarAlteracoes(evento) {
    evento.preventDefault();

    if (
        ocupado ||
        campos.disabled ||
        !original ||
        !formulario.reportValidity()
    ) {
        return;
    }

    const alteracoes = obterAlteracoes();

    if (Object.keys(alteracoes).length === 0) {
        mensagem.textContent = "Nenhuma alteração para salvar.";
        return;
    }

    const id = original.id;

    ocupado = true;
    campos.disabled = true;
    selecao.disabled = true;
    mensagem.textContent = "Salvando alterações...";

    let manterBloqueado = false;

    try {
        const resposta = await fetch(`/tecnicos/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(alteracoes)
        });

        if (resposta.status === 404) {
            manterBloqueado = true;
            mensagem.textContent =
                "Técnico não encontrado. Recarregue a página.";
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

        if (resultado.id !== id) {
            throw new Error("Resposta inesperada da API.");
        }

        preencherFormulario(resultado);

        const opcao = Array.from(selecao.options).find(
            (item) => item.value === String(id)
        );

        if (opcao) {
            opcao.textContent = `${resultado.nome} (#${id})`;
        }

        mensagem.textContent = "Dados do técnico atualizados com sucesso.";
    } catch (erro) {
        manterBloqueado = true;
        mensagem.textContent =
            "Não foi possível confirmar o salvamento. " +
            "Recarregue a página e confira os dados antes de tentar novamente.";
        console.error(erro);
    } finally {
        ocupado = false;
        campos.disabled = manterBloqueado;
        selecao.disabled = manterBloqueado;
    }
}

selecao.addEventListener("change", selecionarTecnico);
formulario.addEventListener("submit", salvarAlteracoes);

carregarLista();