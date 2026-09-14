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

## Tecnologias utilizadas

- Python e FastAPI.
- SQLite e SQLAlchemy.
- HTML, CSS e JavaScript.

## Situação

MVP com as funcionalidades do escopo implementadas, em fase de
validação do fluxo completo e preparação para apresentação.

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

- Bancada técnica: http://127.0.0.1:8000/interface/kanban.html

- Nova triagem: http://127.0.0.1:8000/interface/triagem.html

- Cadastro de clientes: http://127.0.0.1:8000/interface/clientes.html

- Cadastro de aparelhos: http://127.0.0.1:8000/interface/equipamentos.html

- Cadastro de técnicos: http://127.0.0.1:8000/interface/tecnicos.html

Para encerrar o servidor, pressione Ctrl + C no terminal.

## Testes automatizados

Na raiz do projeto, execute:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Os testes verificam:

- Aceitação de CPF com dígitos verificadores consistentes.
- Rejeição de CPF com dígitos incorretos, formato inválido ou números repetidos.
- Avanço da OS de pendente para em andamento e depois para concluído.
- Bloqueio de saltos e retornos de status.
- Rejeição de pedidos baseados em um status desatualizado.
- Retorno de erro para uma OS inexistente.

Os testes de status utilizam um banco SQLite em memória, sem alterar
os registros do banco da aplicação. Eles verificam diretamente a função
de atualização, sem enviar requisições HTTP.

A validação do CPF é matemática e não consulta a situação cadastral
na Receita Federal.

## Atualização de bancos existentes

Para bancos criados antes da inclusão do técnico responsável na OS,
pare o servidor e execute:

```powershell
.\.venv\Scripts\python.exe migrations/001_adicionar_tecnico_triagem.py
```

A migração cria um backup em `backups/` antes de adicionar a coluna
`tecnico_id`. As OS existentes permanecem na fila geral.

Em uma instalação nova, a estrutura atual é criada ao iniciar a aplicação,
sem necessidade de executar essa migração.

Os arquivos do banco e os backups não são versionados.

### Funcionalidades disponíveis

- Cadastro de clientes com CPF, nome e telefone obrigatórios.
- E-mail e endereço opcionais.
- Validação do formato de CPF, telefone e e-mail.
- Bloqueio de CPF duplicado.
- Listagem de clientes e consulta por CPF.
- Persistência dos registros em banco SQLite.
- Edição parcial de clientes, preservando os campos não enviados.
- Remoção de e-mail e endereço opcionais.
- Bloqueio da alteração de CPF pela rota de edição.
- Validação dos dígitos verificadores do CPF em novos cadastros.
- Rejeição de CPFs formados por números repetidos.
- Cadastro de aparelhos com IMEI, marca, modelo e cor obrigatórios.
- Descrição opcional do aparelho.
- Validação do IMEI com exatamente 15 números.
- Bloqueio de IMEI duplicado.
- Listagem de aparelhos e consulta por IMEI.
- Persistência dos aparelhos em SQLite.
- Cadastro e consulta de técnicos.
- Geração de OS vinculada a cliente e aparelho existentes.
- Checklist obrigatório de oito itens na entrada.
- Prioridade normal ou alta, com status inicial pendente.
- Listagem e consulta das ordens de serviço.
- Atribuição e troca de técnico responsável.
- Retorno da OS à fila geral, sem técnico atribuído.
- Avanço sequencial da OS: pendente, em andamento e concluído.
- Bloqueio de saltos e retornos de status.
- Rejeição de mudanças baseadas em um status desatualizado.
- Kanban com colunas de espera, reparo e conclusão.
- Contadores de OS por coluna.
- Botões para iniciar e concluir reparos.
- Exibição do nome do técnico responsável.
- Filtro por técnico ou fila geral.
- Atualização do quadro após mudanças e conflitos de status.
- Formulário para gerar ordens de serviço pelo navegador.
- Seleção de cliente, aparelho e técnico, com opção de fila geral.
- Preenchimento obrigatório dos oito itens da vistoria.
- Exibição de mensagens de sucesso e erros de cadastro.
- Cadastro de clientes pelo navegador, com e-mail e endereço opcionais.
- Exibição dos erros de validação e de CPF duplicado na interface.
- Cadastro de aparelhos pelo navegador.
- Exibição de erros de validação e de IMEI duplicado na interface.
- Consulta dos oito itens da vistoria diretamente nos cartões do Kanban.
- Exibição das observações da OS em uma área que pode ser expandida.
- Exibição do nome do cliente e da marca/modelo do aparelho nos cartões do Kanban.
- Atribuição e troca de técnico diretamente nos cartões do Kanban.
- Retorno à fila geral pela interface, preservando o status da OS.
- Atualização do quadro e do filtro após salvar o responsável.
- Cadastro de técnicos pelo navegador, com especialidade opcional.
- Seleção dos técnicos cadastrados na abertura da OS e no Kanban.

Para criar uma triagem, cadastre o cliente e o aparelho pelas respectivas
interfaces. Depois, abra Nova triagem, selecione os registros e preencha
o defeito relatado e a vistoria de entrada.

## Validação manual

Fluxo de atendimento testado:
cadastro de cliente, aparelho e técnico; abertura da OS com vistoria;
consulta no Kanban; atribuição de responsável; filtro por técnico;
avanço até a conclusão.

Resultado: fluxo realizado com sucesso.

Persistência verificada: os registros permaneceram disponíveis
após parar e iniciar novamente o servidor.

Também foi executado um atendimento completo pelo navegador, usando
registros identificados como TESTE VISUAL.

A OS #10 foi criada com vistoria e observações, atribuída ao técnico,
consultada pelo filtro e avançada até a conclusão. Após atualizar
o quadro, o status concluído permaneceu.
