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

MVP implementado e ampliado com consulta, edição e exclusão protegida
de clientes e aparelhos, edição de técnicos, máscaras de entrada e
preparação de mensagens para WhatsApp.

As verificações automatizadas executadas foram aprovadas. A validação
de desempenho, concorrência e compatibilidade entre navegadores
permanece pendente.

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

- Página inicial da API (JSON): http://127.0.0.1:8000
- Documentação da API: http://127.0.0.1:8000/docs

- Bancada técnica: http://127.0.0.1:8000/interface/kanban.html

- Nova triagem: http://127.0.0.1:8000/interface/triagem.html

- Cadastro de clientes: http://127.0.0.1:8000/interface/clientes.html

- Cadastro de aparelhos: http://127.0.0.1:8000/interface/equipamentos.html

- Cadastro de técnicos: http://127.0.0.1:8000/interface/tecnicos.html

- Consultar clientes: http://127.0.0.1:8000/interface/lista-clientes.html

- Consultar aparelhos: http://127.0.0.1:8000/interface/lista-equipamentos.html

- Editar técnicos: http://127.0.0.1:8000/interface/editar-tecnico.html

A edição de clientes e aparelhos é acessada pelos cartões das respectivas
listas. A preparação da mensagem é acessada pelo link “Preparar mensagem”
no cartão da OS.

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
- Registro das datas de início e conclusão do reparo.
- Separação entre bancada e histórico no limite de 15 horas.
- Criação e validação de backups.
- Prevenção de backups automáticos repetidos no mesmo dia.
- Rejeição de arquivos ausentes, inválidos ou sem as tabelas obrigatórias.
- Verificação e cancelamento da restauração sem substituir dados.
- Restauração com preservação e recuperação do estado anterior.

Os testes de status utilizam um banco SQLite em memória, sem alterar
os registros do banco da aplicação. Eles verificam diretamente a função
de atualização, sem enviar requisições HTTP.

A validação do CPF é matemática e não consulta a situação cadastral
na Receita Federal.

Os 22 testes da suíte foram executados e aprovados.
Os testes de backup e restauração utilizam arquivos SQLite temporários,
sem alterar o banco dos atendimentos.

## Verificações complementares

Em 16/09/2026, foram executados:

| Grupo | Resultado |
|---|---|
| Testes existentes de CPF e status | 10 aprovados |
| Verificações funcionais por HTTP em banco temporário | 106 aprovadas |
| Verificações JavaScript de máscaras e link do WhatsApp | 17 aprovadas |
| Verificação de sintaxe dos arquivos JavaScript | Sem erros |

As verificações complementares foram executadas com apoio do Codex,
fora da suíte versionada. O comando unittest deste README executa
somente os testes disponíveis no diretório tests.

A abertura do WhatsApp foi simulada, sem conexão externa ou envio
de mensagens. Não foram realizados testes de carga, requisições
simultâneas ou interação no navegador nesta rodada.

## Atualização de bancos existentes

Para bancos criados antes da inclusão do técnico responsável na OS,
pare o servidor e execute:

```powershell
.\.venv\Scripts\python.exe migrations/001_adicionar_tecnico_triagem.py
```

A migração cria um backup em `backups/` antes de adicionar a coluna
`tecnico_id`. As OS existentes permanecem na fila geral.

Para bancos criados antes da inclusão das datas da OS, pare o sistema
e execute na raiz do projeto:

```powershell
.\.venv\Scripts\python.exe migrations/002_adicionar_datas_triagem.py
```

A migração cria uma cópia de segurança e adiciona as colunas de datas.
Datas desconhecidas dos atendimentos antigos permanecem vazias.
As OS já concluídas recebem prazo de entrada no histórico de 15 horas
a partir da migração.

Em uma instalação nova, a estrutura atual é criada ao iniciar a aplicação,
sem necessidade de executar essas migrações.

Os arquivos do banco e os backups não são versionados.

## Datas e histórico das ordens de serviço

Novas OS registram automaticamente a data de criação. O avanço do status
registra o início do reparo e a conclusão.

As datas são armazenadas em UTC e exibidas no horário local do computador.
Datas desconhecidas de registros antigos aparecem como “Não registrada”.

Após 15 horas da conclusão, a OS deixa a consulta da bancada e passa
para o histórico, sem exclusão dos dados.

O histórico está disponível pelo menu lateral ou em:
http://127.0.0.1:8000/interface/historico.html

A bancada e o histórico consultam atualizações a cada 60 segundos
enquanto a página está visível. A atualização automática é adiada
durante operações ou quando há uma seleção de responsável não salva.

## Backup e restauração

Execute os comandos abaixo na raiz do projeto. Eles usam o banco
configurado em TRIAGEM_DATABASE_URL ou, por padrão, assistencia.db
na pasta de execução.

### Backup manual

```powershell
.\.venv\Scripts\python.exe -c "from app.backup import criar_backup; print(criar_backup())"
```

O backup é criado na pasta backups, ao lado do banco utilizado.
Cada cópia manual recebe um nome com data e hora e passa por uma
verificação de integridade.

### Backup automático

Ao iniciar o sistema, se o banco já existir, é criado um backup
automático por dia, identificado como automatico_AAAAMMDD.db.

O backup automático não é repetido nas demais aberturas do mesmo dia.
A rotina acontece somente na inicialização; manter o sistema aberto
durante vários dias não gera novas cópias diariamente.

Falhas na rotina de backup interrompem a inicialização.
Não há exclusão automática de backups antigos.

### Verificar um backup

Substitua NOME_DO_BACKUP.db pelo nome do arquivo escolhido:

```powershell
.\.venv\Scripts\python.exe restaurar_backup.py "backups\NOME_DO_BACKUP.db" --verificar
```

A verificação confere a integridade, as tabelas e colunas obrigatórias,
os vínculos declarados no banco e mostra a quantidade de registros.
Ela não substitui os dados nem valida todas as regras de cada cadastro.

Backups antigos sem a estrutura exigida pela versão atual são rejeitados.

### Restaurar um backup

Feche o sistema e pare todos os servidores. Execute:

```powershell
.\.venv\Scripts\python.exe restaurar_backup.py "backups\NOME_DO_BACKUP.db"
```

Confira os caminhos exibidos e digite RESTAURAR para confirmar.

A restauração substitui os dados atuais pelos dados do backup;
não combina registros. Antes da substituição, cria e valida uma
cópia do banco atual, permitindo recuperar o estado anterior.

O comando não detecta automaticamente se o sistema está aberto.
Backup e restauração ainda são operados pelo terminal.

As cópias ficam no mesmo disco do banco. Para proteção contra falha
do dispositivo, mantenha também uma cópia em outro local seguro.

## Funcionalidades disponíveis

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
- Consulta de clientes com busca por nome ou CPF.
- Edição de clientes pela interface, preservando o CPF.
- Exclusão de clientes somente quando não possuem OS vinculada.
- Consulta de aparelhos com busca por IMEI, marca ou modelo.
- Edição de aparelhos pela interface, preservando o IMEI.
- Exclusão de aparelhos somente quando não possuem OS vinculada.
- Máscaras de CPF e telefone, com envio de somente números à API.
- Edição de nome, telefone e especialidade dos técnicos.
- Prévia de mensagem da OS com aparelho, defeito, prioridade e vistoria.
- Seleção do técnico destinatário sem alterar o responsável pela OS.
- Geração de link para abrir o WhatsApp com a mensagem preenchida.
- Envio da mensagem confirmado pelo usuário no próprio WhatsApp.

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

## Limitações atuais

- Não há autenticação nem controle de permissões.
- Não há implantação pública configurada.
- A atualização automática consulta o servidor a cada 60 segundos,
  somente com a página visível e sem operações ou seleção de
  responsável pendentes; não há sincronização instantânea.
- A integração com WhatsApp gera um link; não envia mensagens
  automaticamente nem confirma sua entrega.
- Os telefones são tratados como brasileiros, com DDD e código
  internacional 55 na geração do link.
- Clientes e aparelhos com qualquer OS vinculada, inclusive concluída,
  não podem ser excluídos.
- As edições cadastrais não possuem detecção de conflito entre usuários
  alterando simultaneamente o mesmo campo.
- As metas de desempenho e a compatibilidade entre navegadores ainda
  precisam de validação formal.
