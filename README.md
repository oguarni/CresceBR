# CresceBR - Plataforma E-commerce B2B

## Visão Geral do Projeto

CresceBR é uma plataforma completa de e-commerce B2B (Business-to-Business) desenvolvida para facilitar o comércio entre empresas no mercado brasileiro. A plataforma oferece funcionalidades abrangentes para compradores e fornecedores, incluindo catálogo de produtos, sistema de cotações, gerenciamento de pedidos e painéis administrativos.

## Tech Stack

### Backend

- **Node.js** com **TypeScript** - Runtime e linguagem principal
- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JSON Web Tokens (JWT)** - Autenticação e autorização
- **bcryptjs** - Criptografia de senhas
- **Jest** - Framework de testes
- **Docker** - Containerização

### Frontend

- **React 18** com **TypeScript** - Interface do usuário
- **Material-UI (MUI)** - Biblioteca de componentes
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **React Query** - Gerenciamento de estado server
- **Vitest** - Framework de testes
- **Vite** - Build tool e dev server

### Infraestrutura

- **Docker Compose** - Orquestração de containers
- **NGINX** - Proxy reverso (produção)
- **GitHub Actions** - CI/CD

## Modelo de Dados User/Company

O sistema utiliza um modelo unificado onde cada **User** representa uma **Company** (empresa). Esta abordagem foi escolhida para refletir a natureza B2B da plataforma:

### Estrutura Principal

```typescript
interface User {
  id: number;
  email: string;
  cpf: string;
  address: string;
  role: 'customer' | 'admin' | 'supplier';
  companyName: string; // Nome comercial
  corporateName: string; // Razão social
  cnpj: string; // CNPJ da empresa
  cnpjValidated: boolean; // Status de validação
  industrySector: string; // Setor industrial
  companyType: 'buyer' | 'supplier' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  // ... outros campos
}
```

### Relacionamentos

- **Companies (Users)** podem ter múltiplas **Quotations** (Cotações)
- **Companies (Users)** podem ter múltiplos **Orders** (Pedidos)
- **Suppliers (Users)** podem ter múltiplos **Products** (Produtos)
- **Quotations** podem gerar **Orders**

## Configuração e Execução

### Pré-requisitos

- **Docker** (versão 20.10 ou superior)
- **Docker Compose** (versão 2.0 ou superior)
- **Git**

### Passos para Configuração

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/oguarni/CresceBR
   cd MarketPlace_B2B/B2B
   ```

2. **Certifique-se de que Docker e Docker Compose estão instalados:**

   ```bash
   docker --version
   docker-compose --version
   ```

3. **Execute o projeto completo:**

   ```bash
   docker-compose up --build -d
   ```

4. **Acesse a aplicação:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:3001
   - **Documentação da API:** http://localhost:3001/api/v1/health

### Estrutura de Serviços

O projeto utiliza os seguintes containers Docker:

- **frontend** - Aplicação React (porta 3000)
- **backend** - API Node.js (porta 3001)
- **postgres** - Banco de dados PostgreSQL (porta 5432)

## Executando Testes

### Testes do Backend

```bash
docker-compose exec backend npm test
```

### Testes do Frontend

```bash
docker-compose exec frontend npm test
```

### Coverage de Testes

```bash
# Backend
docker-compose exec backend npm run test:coverage

# Frontend
docker-compose exec frontend npm run test:coverage
```

## Funcionalidades Principais

### Para Compradores (Customers)

- Navegação no catálogo de produtos
- Solicitação de cotações
- Comparação de ofertas
- Gestão de pedidos
- Dashboard personalizado

### Para Fornecedores (Suppliers)

- Gestão de catálogo de produtos
- Resposta a cotações
- Processamento de pedidos
- Análise de vendas
- Dashboard de supplier

### Para Administradores

- Validação de empresas
- Moderação de produtos
- Monitoramento de transações
- Relatórios e analytics
- Gestão geral da plataforma

## Arquitetura do Projeto

```
B2B/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── models/         # Modelos Sequelize
│   │   ├── routes/         # Definições de rotas
│   │   ├── middleware/     # Middlewares personalizados
│   │   ├── services/       # Lógica de negócio
│   │   └── utils/          # Utilitários
│   ├── migrations/         # Migrações do banco
│   └── __tests__/          # Testes automatizados
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── contexts/       # Context APIs
│   │   ├── services/       # Serviços de API
│   │   └── utils/          # Utilitários
│   └── __tests__/          # Testes automatizados
├── shared/                 # Tipos TypeScript compartilhados
├── docker-compose.yml      # Configuração Docker
└── README.md              # Esta documentação
```

## Autenticação e Autorização

O sistema utiliza JWT (JSON Web Tokens) com refresh tokens para autenticação segura:

- **Access Token:** Vida útil de 15 minutos
- **Refresh Token:** Vida útil de 7 dias
- **Middleware de autorização** baseado em roles (customer, supplier, admin)
- **Validação de CNPJ** integrada

## Variáveis de Ambiente

### Backend (.env)

```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://crescebr:password@postgres:5432/crescebr_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:3001/api/v1
```

## Comandos Úteis

### Desenvolvimento

```bash
# Reiniciar apenas um serviço
docker-compose restart backend

# Ver logs de um serviço específico
docker-compose logs -f frontend

# Acessar container em execução
docker-compose exec backend bash

# Executar migrações
docker-compose exec backend npx sequelize-cli db:migrate

# Executar seeds
docker-compose exec backend npx sequelize-cli db:seed:all
```

### Produção

```bash
# Build para produção
docker-compose -f docker-compose.prod.yml up --build -d

# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Status do Projeto

✅ **Backend:** Totalmente funcional com 100% dos testes passando  
✅ **Frontend:** Interface completa com 95.8% dos testes passando  
✅ **Autenticação:** Sistema JWT implementado e testado  
✅ **Banco de Dados:** Migrações e relacionamentos estabelecidos  
✅ **Docker:** Containerização completa e funcional

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte e dúvidas:

- Abra uma issue no GitHub
- Consulte a documentação da API em `/api/v1/health`
- Verifique os logs com `docker-compose logs`

---

**CresceBR - Conectando empresas, impulsionando crescimento.** 🚀
