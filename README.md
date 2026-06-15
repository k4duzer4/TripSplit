# SplitTrip ✈️💸

Um sistema Fullstack para gerenciar e dividir despesas de viagens em grupo (semelhante ao Splitwise). O algoritmo inteligente da aplicação minimiza o número de transferências necessárias na hora do acerto de contas!

Projeto desenvolvido para a disciplina de Fullstack Básico.

## 🚀 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Banco de Dados**: SQLite
- **Autenticação**: JWT (JSON Web Tokens) e bcrypt para hash de senhas
- **Frontend**: HTML5, CSS3 puro, Javascript (Vanilla / Fetch API) e Bootstrap 5
- **Arquitetura Frontend**: Single Page Application (SPA) baseada em Hash Routing.

## ⚙️ Funcionalidades

- Cadastro e Autenticação de Usuários.
- Criação e Gerenciamento de Viagens.
- Adição de amigos cadastrados na plataforma como participantes da viagem.
- Cadastro de despesas associadas a uma viagem, permitindo selecionar quem pagou e quem está dividindo o gasto.
- Cálculo de Balanço: Demonstra quanto cada pessoa gastou e qual o saldo dela.
- Algoritmo de Otimização: Simplifica as dívidas indicando quem deve transferir dinheiro para quem, com a menor quantidade de transações possível.
- Bloqueio de alterações após a finalização da viagem.

## 🛠️ Como rodar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.

### Passo 1: Configurar o Backend
1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   node server.js
   ```
   *O banco de dados SQLite (`database.sqlite`) será criado automaticamente na pasta `backend`.*
   *O servidor rodará na porta `3000` (http://localhost:3000).*

### Passo 2: Executar o Frontend
O frontend não requer servidor para funcionar localmente graças ao uso da arquitetura SPA Vanilla.
1. Vá até a pasta `frontend`.
2. Abra o arquivo `index.html` diretamente no seu navegador de preferência.

## 🎥 Vídeo de Apresentação
*(Insira aqui o link para o vídeo do YouTube/Drive apresentando o projeto)*

## 🌐 Deploy
*(Insira aqui o link para a aplicação rodando em produção)*
