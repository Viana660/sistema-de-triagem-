(() => {
    const pagina = window.location.pathname.split("/").pop();

    function link(titulo, destino) {
        const ativo = pagina === destino;

        return `
            <a class="menu-item"
               href="/interface/${destino}"
               ${ativo ? 'aria-current="page"' : ""}>
                ${titulo}
            </a>
        `;
    }

    function grupo(titulo, paginas, itens) {
        const ativo = paginas.includes(pagina);

        return `
            <details class="menu-grupo menu-categoria"
                     ${ativo ? "open" : ""}>
                <summary>${titulo}</summary>
                <div class="menu-subitens">
                    ${itens}
                </div>
            </details>
        `;
    }

    const menu = document.createElement("aside");
    menu.className = "menu-lateral";

    menu.innerHTML = `
        <a class="marca-sistema" href="/interface/kanban.html">
            Triagem
        </a>

        <nav aria-label="Navegação principal">
            ${link("Bancada", "kanban.html")}
            ${link("Histórico", "historico.html")}
            ${link("Nova triagem", "triagem.html")}

            <details class="menu-grupo" open>
                <summary>Cadastros</summary>

                <div class="menu-subitens">
                    ${grupo(
                        "Clientes",
                        [
                            "clientes.html",
                            "lista-clientes.html",
                            "editar-cliente.html",
                        ],
                        link("Novo cliente", "clientes.html")
                        + link(
                            "Consultar clientes",
                            "lista-clientes.html"
                        )
                    )}

                    ${grupo(
                        "Aparelhos",
                        [
                            "equipamentos.html",
                            "lista-equipamentos.html",
                            "editar-equipamento.html",
                        ],
                        link("Novo aparelho", "equipamentos.html")
                        + link(
                            "Consultar aparelhos",
                            "lista-equipamentos.html"
                        )
                    )}

                    ${grupo(
                        "Técnicos",
                        [
                            "tecnicos.html",
                            "editar-tecnico.html",
                        ],
                        link("Novo técnico", "tecnicos.html")
                        + link("Editar técnico", "editar-tecnico.html")
                    )}
                </div>
            </details>
        </nav>
    `;

    document.body.classList.add("com-menu-lateral");
    document.body.prepend(menu);
})();