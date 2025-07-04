# B2B Marketplace for Local Industries

## Project Description

This project is a Minimum Viable Product (MVP) for a B2B marketplace platform designed to connect local industries. The platform aims to streamline the procurement process by providing a centralized hub for businesses to discover products, request quotations, and manage orders.

### Core Functionalities:

*   **Company Registration:** A comprehensive registration process for both buyers and suppliers, including a verification system for new companies.
*   **Product Catalog:** A robust product catalog with features like search, filtering by category, and detailed product pages.
*   **Quotation System:** An integrated quotation system that allows buyers to request quotes for specific products and suppliers to respond with their pricing and terms.
*   **Order Management:** A complete order management system that enables buyers to place orders from approved quotations and suppliers to manage the order lifecycle (e.g., processing, shipped, delivered).

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, Material-UI (MUI)
*   **Backend:** Node.js, Express, TypeScript, Sequelize, PostgreSQL
*   **Database:** PostgreSQL
*   **Containerization:** Docker

### Architecture Diagram

## Getting Started / Local Setup

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher)
*   Docker and Docker Compose

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd B2B
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory by copying the example file:

```bash
cp backend/.env.example backend/.env
```

Update the `backend/.env` file with your local database and JWT credentials:

```
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=b2b_marketplace
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

### 4. Run the Database

Start the PostgreSQL database using Docker Compose:

```bash
docker-compose up -d
```

### 5. Run the Application

Use the following commands to run the backend and frontend services in development mode:

```bash
# Run the backend server
npm run dev:backend

# Run the frontend development server
npm run dev:frontend
```

## Available Scripts

*   `npm run dev:frontend`: Starts the frontend development server (usually on `localhost:3000`).
*   `npm run dev:backend`: Starts the backend server with hot-reloading (usually on `localhost:3001`).
*   `npm run build`: Builds the frontend and backend for production.