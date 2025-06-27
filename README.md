# 🚀 CresceBR - B2B Marketplace

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node->=16.0.0-brightgreen.svg)

**CresceBR** é um Marketplace B2B MVP (Minimum Viable Product) desenvolvido para atender pequenas e médias empresas (PMEs) do sudoeste do Paraná. O projeto oferece uma plataforma completa de comércio eletrônico B2B com recursos modernos e interface intuitiva.

## 📋 Visão Geral

Este projeto foi desenvolvido como um MVP acadêmico, mas com foco na produção futura. Utiliza uma arquitetura de comércio componível (composable commerce) com microserviços RESTful no backend e uma aplicação frontend responsiva.

### 🎯 Funcionalidades Principais

- ✅ **Autenticação e Autorização** (JWT)
- ✅ **Catálogo de Produtos** com busca e filtros
- ✅ **Carrinho de Compras** persistente
- ✅ **Sistema de Checkout** simulado
- ✅ **Painel Administrativo** para gestão de produtos
- ✅ **Integração com ViaCEP** para preenchimento automático de endereços
- ✅ **Cálculo de Frete** simulado
- ✅ **Design Responsivo** (mobile-first)
- ✅ **Sistema de Avaliações** (simulado)

## 🏗️ Arquitetura

### Estrutura do Monorepo

```
CresceBR/
├── frontend/          # Aplicação React com TypeScript e Vite
├── backend/           # API Node.js com Express e TypeScript
├── shared/            # Tipos e interfaces compartilhadas
├── package.json       # Scripts do monorepo
├── .env.example       # Variáveis de ambiente de exemplo
└── README.md          # Este arquivo
```

### Stack Tecnológica

#### 🎨 Frontend
- **React 18** - Framework JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Material-UI (MUI)** - Biblioteca de componentes
- **React Router** - Navegação
- **Axios** - Cliente HTTP
- **React Context API** - Gerenciamento de estado
- **React Hot Toast** - Notificações

#### ⚙️ Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados
- **Sequelize** - ORM
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **Express Validator** - Validação de dados

#### 🔧 Ferramentas
- **Concurrently** - Execução paralela de scripts
- **ESLint** - Linting de código
- **Git** - Controle de versão

## 🚀 Instalação e Execução

### Pré-requisitos

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **PostgreSQL** >= 12.0

### 1. Clone o Repositório

```bash
git clone https://github.com/crescebr/b2b-marketplace.git
cd b2b-marketplace
```

### 2. Configuração do Ambiente

```bash
# Copie os arquivos de exemplo
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edite os arquivos .env com suas configurações
```

### 3. Configuração do Banco de Dados

```sql
-- Conecte-se ao PostgreSQL e execute:
CREATE DATABASE crescebr_b2b;
CREATE USER crescebr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crescebr_b2b TO crescebr_user;
```

### 4. Instalação das Dependências

```bash
# Instala todas as dependências do monorepo
npm run setup
```

### 5. Executar em Desenvolvimento

```bash
# Executa frontend e backend simultaneamente
npm run dev
```

A aplicação estará disponível em:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/v1/health

## 📚 Scripts Disponíveis

### Monorepo
```bash
npm run dev          # Executa frontend e backend em desenvolvimento
npm run build        # Build completo do projeto
npm run start        # Executa em produção
npm run test         # Executa todos os testes
npm run lint         # Executa linting em todo o código
npm run clean        # Limpa node_modules e builds
```

### Frontend
```bash
npm run frontend:dev     # Executa apenas o frontend
npm run frontend:build   # Build do frontend
npm run frontend:preview # Preview do build do frontend
```

### Backend
```bash
npm run backend:dev    # Executa apenas o backend
npm run backend:build  # Build do backend
npm run backend:start  # Executa backend em produção
```

## 🔌 API Endpoints

### 🔐 Autenticação
- `POST /api/v1/auth/register` - Cadastro de usuário
- `POST /api/v1/auth/login` - Login de usuário

### 📦 Produtos
- `GET /api/v1/products` - Listar produtos (com filtros)
- `GET /api/v1/products/:id` - Buscar produto por ID
- `GET /api/v1/products/categories` - Listar categorias

#### Admin (Requer autenticação de admin)
- `POST /api/v1/products` - Criar produto
- `PUT /api/v1/products/:id` - Atualizar produto
- `DELETE /api/v1/products/:id` - Deletar produto

### 🛒 Pedidos (Requer autenticação)
- `POST /api/v1/orders` - Criar pedido
- `GET /api/v1/orders/:id` - Buscar pedido por ID

### 🏥 Saúde
- `GET /api/v1/health` - Health check da API

## 👥 Contas de Teste

O sistema vem com contas pré-configuradas para teste:

### Administrador
- **Email**: admin@crescebr.com
- **Senha**: admin123

### Cliente
- **Email**: cliente@teste.com
- **Senha**: cliente123

## 🎨 Guia de Estilo Visual

### Cores Principais
- **Deep Ocean Blue**: #1E3A8A
- **Forest Green**: #059669

### Tipografia
- **Headings**: Inter (Google Fonts)
- **Body Text**: Open Sans (Google Fonts)

### Design System
- Design mobile-first e responsivo
- Componentes Material-UI customizados
- Paleta de cores consistente
- Espaçamento e tipografia padronizados

## 🔧 Configuração Avançada

### Variáveis de Ambiente

#### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crescebr_b2b
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_APP_NAME=CresceBR
VITE_ENABLE_DEBUG=true
```

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Executar testes do backend
npm run backend:test

# Executar testes do frontend
npm run frontend:test

# Executar testes em watch mode
npm run test:watch
```

## 📦 Build e Deploy

### Build de Produção
```bash
# Build completo
npm run build

# Build apenas do frontend
npm run frontend:build

# Build apenas do backend
npm run backend:build
```

### Deploy
```bash
# Executar em produção
npm start

# Ou usar PM2 para produção
pm2 start backend/dist/server.js --name "crescebr-api"
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Roadmap

### Versão 1.1
- [ ] Sistema de notificações
- [ ] Chat de suporte
- [ ] Relatórios de vendas
- [ ] Sistema de cupons de desconto

### Versão 1.2
- [ ] API de pagamentos real (PIX/Cartão)
- [ ] Gestão de estoque
- [ ] Sistema de reviews e ratings
- [ ] Integração com transportadoras

### Versão 2.0
- [ ] App mobile (React Native)
- [ ] Sistema de marketplace multi-vendor
- [ ] IA para recomendações
- [ ] Analytics avançados

## 🐛 Solução de Problemas

### Problemas Comuns

**Erro de conexão com banco de dados**
```bash
# Verifique se o PostgreSQL está rodando
sudo service postgresql status

# Verifique as credenciais no .env
```

**Erro de porta já em uso**
```bash
# Verificar processos usando as portas
lsof -i :3000
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>
```

**Problemas com dependências**
```bash
# Limpar e reinstalar
npm run clean
npm run setup
```

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: suporte@crescebr.com
- **Issues**: [GitHub Issues](https://github.com/crescebr/b2b-marketplace/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/crescebr/b2b-marketplace/wiki)

---

**Desenvolvido com ❤️ pela equipe CresceBR**

*Conectando empresas, impulsionando o crescimento no sudoeste do Paraná.*