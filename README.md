# Sistema de Triagem para Assistências Técnicas

Projeto acadêmico desenvolvido na disciplina de Engenharia de Software,
com implementação incremental e versionamento usando Git e GitHub.

## Objetivo

Organizar o recebimento de aparelhos em uma assistência técnica,
registrando clientes, equipamentos, vistoria inicial e acompanhamento
das ordens de serviço.

## Escopo do MVP

- Cadastrar e consultar clientes.
- Registrar aparelhos.
- Registrar o defeito relatado e o checklist de entrada.
- Gerar uma ordem de serviço com status pendente.
- Atribuir um técnico ou encaminhar para a fila geral.
- Exibir as ordens em um quadro Kanban.
- Atualizar o status: pendente, em andamento e concluído.

## Tecnologias previstas

- Python e FastAPI.
- SQLite e SQLAlchemy.
- HTML, CSS e JavaScript.

## Situação

Em desenvolvimento. A implementação será realizada por etapas.

## Autor

Vinicius de Oliveira Viana



## Como executar para desenvolvimento no Windows

### Pré-requisitos

- Python instalado. Versão utilizada no desenvolvimento: 3.14.2.
- Git instalado.

### Instalação

Clone o repositório e entre na pasta:

```powershell
git clone https://github.com/Viana660/sistema-de-triagem-.git
cd sistema-de-triagem-
```

Crie o ambiente virtual:

```powershell
py -m venv .venv
```

Instale as dependências:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Execução

Inicie o servidor de desenvolvimento:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Acesse no navegador:

- Aplicação: http://127.0.0.1:8000
- Documentação da API: http://127.0.0.1:8000/docs

Para encerrar o servidor, pressione Ctrl + C no terminal.

### Funcionalidades disponíveis

- Cadastro de clientes com CPF, nome e telefone obrigatórios.
- E-mail e endereço opcionais.
- Validação do formato de CPF, telefone e e-mail.
- Bloqueio de CPF duplicado.
- Listagem de clientes e consulta por CPF.
- Persistência dos registros em banco SQLite.

A validação dos dígitos verificadores do CPF ainda será implementada.