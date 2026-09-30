import ctypes
import logging
import os
import socket
import sys
import threading
import time
from pathlib import Path

import uvicorn
import webview


def preparar_ambiente():
    pasta = Path(os.environ["LOCALAPPDATA"]) / "SistemaDeTriagem"
    pasta.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        filename=pasta / "sistema.log",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        encoding="utf-8",
    )

    if getattr(sys, "frozen", False):
        banco = pasta / "assistencia.db"
        os.environ["TRIAGEM_DATABASE_URL"] = (
            f"sqlite:///{banco.as_posix()}"
        )


def iniciar():
    from main import app

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as conexao:
        conexao.bind(("127.0.0.1", 0))
        porta = conexao.getsockname()[1]

        configuracao = uvicorn.Config(
            app,
            host="127.0.0.1",
            port=porta,
            loop="asyncio",
            http="h11",
            ws="none",
            log_config=None,
            access_log=False,
            timeout_graceful_shutdown=10,
        )
        servidor = uvicorn.Server(configuracao)

        def executar_servidor():
            try:
                servidor.run(sockets=[conexao])
            except BaseException:
                logging.exception("Falha no servidor.")

        processo_servidor = threading.Thread(
            target=executar_servidor,
            daemon=False,
        )
        processo_servidor.start()

        try:
            limite = time.monotonic() + 30

            while not servidor.started:
                if not processo_servidor.is_alive():
                    raise RuntimeError(
                        "O servidor não conseguiu iniciar."
                    )

                if time.monotonic() > limite:
                    raise TimeoutError(
                        "O servidor demorou demais para iniciar."
                    )

                time.sleep(0.1)

            endereco = (
                f"http://127.0.0.1:{porta}/interface/kanban.html"
            )

            webview.create_window(
                "Sistema de Triagem",
                endereco,
                width=1200,
                height=800,
                min_size=(800, 600),
            )

            # Permanece aqui enquanto a janela estiver aberta.
            webview.start(gui="edgechromium")

        finally:
            # Executado ao fechar a janela ou ocorrer um erro.
            servidor.should_exit = True
            processo_servidor.join()


if __name__ == "__main__":
    try:
        preparar_ambiente()
        iniciar()
    except Exception:
        logging.exception("Não foi possível abrir o sistema.")
        ctypes.windll.user32.MessageBoxW(
            0,
            "Não foi possível iniciar o sistema.\n\n"
            "Consulte o arquivo sistema.log na pasta:\n"
            "%LOCALAPPDATA%\\SistemaDeTriagem",
            "Sistema de Triagem",
            0x10,
        )