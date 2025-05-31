# B2B Marketplace

Sistema de marketplace B2B com gestão de fornecedores, produtos, cotações e pedidos.

## Funcionalidades

- **Autenticação**: Registro e login de usuários (compradores, fornecedores, admin)
- **Gestão de Produtos**: CRUD de produtos com categorias
- **Sistema de Cotações**: Solicitação e envio de cotações entre compradores e fornecedores
- **Gestão de Pedidos**: Processamento completo de pedidos
- **Sistema de Avaliações**: Avaliação de fornecedores e produtos
- **Analytics**: Dashboard com métricas de vendas e performance
- **Administração**: Painel administrativo para gestão do sistema

## Tecnologias

### Backend
- Node.js + Express
- PostgreSQL + Sequelize ORM
- JWT para autenticação
- Express Validator
- Bcrypt para criptografia

### Frontend
- React 18
- Material-UI
- React Router
- Axios

## Como executar com Docker (RÁPIDO)

### Pré-requisitos
- Docker
- Docker Compose

### Passos RÁPIDOS

1. Clone o repositório:
```bash
git clone <repository-url>
cd MarketPlace_B2B
```

2. **OPCIONAL** - Copie o arquivo de ambiente:
```bash
cp backend/.env.example backend/.env
```

3. **Execute IMEDIATAMENTE**:
```bash
# Usando o docker-compose simples
docker-compose -f docker-compose.simple.yml up --build

# OU usando o docker-compose principal
docker-compose up --build
```

4. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5434

### Para desenvolvimento

Para executar apenas o backend:
```bash
docker-compose up postgres backend
```

Para executar apenas o frontend:
```bash
docker-compose up frontend
```

### Se der erro, limpe tudo:
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build --force-recreate
```

## API Endpoints

### Autenticação
- POST `/api/auth/register` - Registro
- POST `/api/auth/login` - Login
- GET `/api/auth/profile` - Perfil do usuário

### Produtos
- GET `/api/products` - Listar produtos
- GET `/api/products/search` - Buscar produtos
- POST `/api/products` - Criar produto (fornecedor/admin)

### Cotações
- POST `/api/quotes/request` - Solicitar cotação
- GET `/api/quotes/supplier` - Cotações do fornecedor
- POST `/api/quotes/submit` - Enviar cotação

### Pedidos
- POST `/api/orders` - Criar pedido
- GET `/api/orders` - Listar pedidos do usuário
- PUT `/api/orders/:id/status` - Atualizar status

## Estrutura do Projeto

```
MarketPlace_B2B/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   └── Dockerfile
└── docker-compose.yml
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request
