# CresceBR E-commerce MVP

## Overview

The CresceBR E-commerce MVP is a comprehensive B2B marketplace platform designed to connect local industries in southwestern Paraná, Brazil. This minimum viable product (MVP) streamlines the procurement process by providing a centralized hub for businesses to discover products, request quotations, and manage orders.

The platform is built as a modern full-stack application with a React frontend, Node.js backend, and PostgreSQL database, all containerized with Docker for easy deployment and development.

**Technologies Used:**

- **Frontend:** React 19, TypeScript, Vite, Material-UI (MUI), Axios
- **Backend:** Node.js, Express, TypeScript, Sequelize ORM
- **Database:** PostgreSQL 15
- **Containerization:** Docker & Docker Compose
- **Testing:** Jest (Backend), Vitest (Frontend)
- **Authentication:** JWT (JSON Web Tokens)

## Architecture Diagram

_[Architecture diagram will be added here]_

## Features

### Core Features

- **User Authentication (JWT)** - Secure login and registration system with role-based access control
- **Multi-Role Support** - Customer, Supplier, and Admin user types with different permissions
- **Product Catalog** - Comprehensive product management with search and category filtering
- **Shopping Cart** - Full shopping cart functionality with product management
- **Quotation System** - Advanced B2B quotation system allowing customers to request quotes and suppliers to respond
- **Order Management** - Complete order lifecycle management from quotation to delivery
- **Admin Panel** - Full administrative interface for product and order management (CRUD operations)

### Advanced Features

- **Product Ratings & Reviews** - Customer feedback system for products
- **ViaCEP Integration** - Automatic address completion using Brazilian postal code API
- **Quote Calculations** - Automated pricing calculations with tax and shipping
- **Order Status Tracking** - Real-time order status updates with history
- **Company Registration** - Comprehensive business registration with CNPJ validation
- **CSV Import/Export** - Bulk product import and data export capabilities

### Technical Features

- **RESTful API** - Well-structured API with proper error handling
- **Database Migrations** - Sequelize-based database version control
- **Comprehensive Testing** - Unit and integration tests for both frontend and backend
- **Docker Support** - Full containerization for development and production
- **Type Safety** - Full TypeScript implementation across the stack

## Getting Started

### Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (v16 or higher)
- **pnpm** (recommended) or npm
- **Docker** and **Docker Compose**
- **Git**

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/crescebr/b2b-marketplace.git
   cd B2B
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://b2b_user:b2b_password@localhost:5432/b2b_marketplace
DB_HOST=localhost
DB_PORT=5432
DB_NAME=b2b_marketplace
DB_USER=b2b_user
DB_PASSWORD=b2b_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Server Configuration
PORT=3001
NODE_ENV=development

# PostgreSQL Database (for Docker)
POSTGRES_DB=b2b_marketplace
POSTGRES_USER=b2b_user
POSTGRES_PASSWORD=b2b_password
```

**Important:** Replace `your-super-secret-jwt-key-here-make-it-long-and-random` with a strong, randomly generated secret key.

### Running with Docker

The easiest way to run the entire application is using Docker Compose:

```bash
# Start all services (database, backend, frontend)
docker-compose up --build

# Run in detached mode
docker-compose up --build -d

# Stop all services
docker-compose down

# Stop and remove volumes (this will delete your database data)
docker-compose down -v
```

The application will be available at:

- **Frontend:** http://localhost:80
- **Backend API:** http://localhost:3001
- **Database:** localhost:5432

### Running Locally (without Docker)

If you prefer to run the services individually:

1. **Start the PostgreSQL database:**

   ```bash
   docker-compose up -d database
   ```

2. **Run database migrations:**

   ```bash
   pnpm --filter backend db:migrate
   pnpm --filter backend db:seed
   ```

3. **Start the backend server:**

   ```bash
   pnpm --filter backend dev
   ```

4. **Start the frontend development server:**
   ```bash
   pnpm --filter frontend dev
   ```

The application will be available at:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## API Endpoints Documentation

### Authentication Endpoints

| HTTP Method | Path                          | Description              | Protected? |
| ----------- | ----------------------------- | ------------------------ | ---------- |
| POST        | `/api/auth/register`          | Register a new customer  | No         |
| POST        | `/api/auth/register-supplier` | Register a new supplier  | No         |
| POST        | `/api/auth/login`             | User login               | No         |
| GET         | `/api/auth/me`                | Get current user profile | User       |

### Product Endpoints

| HTTP Method | Path                       | Description                     | Protected? |
| ----------- | -------------------------- | ------------------------------- | ---------- |
| GET         | `/api/products`            | Get all products with filtering | No         |
| GET         | `/api/products/categories` | Get product categories          | No         |
| GET         | `/api/products/:id`        | Get specific product details    | No         |
| POST        | `/api/products`            | Create new product              | Supplier   |
| PUT         | `/api/products/:id`        | Update product                  | Supplier   |
| DELETE      | `/api/products/:id`        | Delete product                  | Admin      |

### Quotation Endpoints

| HTTP Method | Path                           | Description                          | Protected? |
| ----------- | ------------------------------ | ------------------------------------ | ---------- |
| POST        | `/api/quotations`              | Create new quotation                 | User       |
| GET         | `/api/quotations`              | Get user's quotations                | User       |
| GET         | `/api/quotations/:id`          | Get specific quotation               | User       |
| PUT         | `/api/quotations/supplier/:id` | Update quotation (supplier response) | Supplier   |
| POST        | `/api/quotations/calculate`    | Calculate quote pricing              | User       |
| GET         | `/api/quotations/admin/all`    | Get all quotations                   | Admin      |

### Order Endpoints

| HTTP Method | Path                           | Description                 | Protected?     |
| ----------- | ------------------------------ | --------------------------- | -------------- |
| POST        | `/api/orders`                  | Create order from quotation | User           |
| GET         | `/api/orders`                  | Get user's orders           | User           |
| GET         | `/api/orders/:orderId/history` | Get order status history    | User           |
| PUT         | `/api/orders/:orderId/status`  | Update order status         | Admin/Supplier |
| GET         | `/api/orders/admin/all`        | Get all orders              | Admin          |
| GET         | `/api/orders/admin/stats`      | Get order statistics        | Admin          |

### Admin Endpoints

| HTTP Method | Path                      | Description                | Protected? |
| ----------- | ------------------------- | -------------------------- | ---------- |
| GET         | `/api/admin/products`     | Get all products for admin | Admin      |
| POST        | `/api/admin/products`     | Create product as admin    | Admin      |
| PUT         | `/api/admin/products/:id` | Update product as admin    | Admin      |
| DELETE      | `/api/admin/products/:id` | Delete product as admin    | Admin      |

### Health Check

| HTTP Method | Path          | Description      | Protected? |
| ----------- | ------------- | ---------------- | ---------- |
| GET         | `/api/health` | API health check | No         |

## Testing

### Running Tests

Run tests for both frontend and backend:

```bash
# Run all tests
pnpm test

# Run backend tests only
pnpm --filter backend test

# Run frontend tests only
pnpm --filter frontend test

# Run tests in watch mode
pnpm --filter backend test:watch
pnpm --filter frontend test:ui

# Run tests with coverage
pnpm --filter frontend test:coverage
```

### Test Structure

- **Backend Tests:** Located in `backend/src/__tests__/` and `backend/src/**/__tests__/`
- **Frontend Tests:** Located in `frontend/src/**/__tests__/` and alongside components
- **Test Configuration:**
  - Backend uses Jest with TypeScript
  - Frontend uses Vitest with React Testing Library

## Additional Commands

### Database Management

```bash
# Create database
pnpm --filter backend db:create

# Run migrations
pnpm --filter backend db:migrate

# Rollback migrations
pnpm --filter backend db:migrate:undo

# Seed database
pnpm --filter backend db:seed

# Reset database
pnpm --filter backend db:seed:undo
```

### Development Commands

```bash
# Start both frontend and backend in development mode
pnpm dev

# Build the entire application
pnpm build

# Lint all code
pnpm lint

# Clean all build artifacts and node_modules
pnpm clean
```

## Project Structure

```
B2B/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── migrations/          # Database migrations
│   └── seeders/             # Database seeders
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   └── services/        # API services
├── shared/                  # Shared TypeScript types
└── docker-compose.yml       # Docker configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support, please open an issue in the GitHub repository or contact the CresceBR team.
