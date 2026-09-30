import argparse
from contextlib import closing
from pathlib import Path
import sqlite3

from app.backup import criar_backup, validar_backup
from app.database import engine


def restaurar():
    parser = argparse.ArgumentParser(
        description="Restaurar um backup do sistema de triagem."
    )
    parser.add_argument("arquivo", type=Path)
    parser.add_argument(
        "--verificar",
        action="store_true",
        help="Somente validar e mostrar os dados, sem restaurar.",
    )
    argumentos = parser.parse_args()

    origem = argumentos.arquivo.resolve()
    caminho = engine.url.database

    if not caminho or caminho == ":memory:":
        raise ValueError("O banco configurado não é um arquivo.")

    destino = Path(caminho).resolve()

    if not destino.is_file():
        raise ValueError("O banco atual não foi encontrado.")

    if origem.is_file() and origem.samefile(destino):
        raise ValueError("O backup escolhido é o próprio banco atual.")

    registros = validar_backup(origem)

    print(f"\nBackup escolhido: {origem}")
    print(f"Banco que será substituído: {destino}")
    print(f"Registros do backup: {registros}")

    if argumentos.verificar:
        print("\nVerificação concluída. Nenhum dado foi substituído.")
        return

    print(
        "\nFeche o sistema e pare todos os servidores antes de continuar."
        "\nA restauração substitui os dados atuais pelos dados do backup."
        "\nEla não combina os registros dos dois arquivos."
    )

    confirmacao = input(
        "\nCom o sistema fechado, digite RESTAURAR para confirmar: "
    )

    if confirmacao.strip() != "RESTAURAR":
        print("Restauração cancelada.")
        return

    engine.dispose()

    seguranca = criar_backup()
    validar_backup(seguranca)
    print(f"\nCópia do banco atual preservada em: {seguranca}")

    try:
        with closing(
            sqlite3.connect(origem.as_uri() + "?mode=ro", uri=True)
        ) as banco_origem:
            with closing(
                sqlite3.connect(
                    destino.as_uri() + "?mode=rw",
                    uri=True,
                )
            ) as banco_destino:
                banco_origem.backup(banco_destino)

        restaurados = validar_backup(destino)

    except Exception:
        print(
            "\nA restauração não foi confirmada."
            "\nMantenha o sistema fechado e preserve esta cópia:"
            f"\n{seguranca}"
        )
        raise

    print(f"\nRestauração concluída: {restaurados}")
    print("Você pode iniciar o sistema novamente.")


if __name__ == "__main__":
    try:
        restaurar()
    except (ValueError, RuntimeError, sqlite3.Error, OSError) as erro:
        print(f"\nErro: {erro}")
        raise SystemExit(1)