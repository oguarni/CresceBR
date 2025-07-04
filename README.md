# CresceBR E-commerce MVP

This is an MVP (Minimum Viable Product) of an e-commerce platform developed for an academic project.

## Features

- **User Management:** User registration and JWT-based authentication.
- **Product Catalog:** List products with images, descriptions, and prices.
- **Shopping Cart:** Add and remove products from the cart.
- **Admin Panel:** CRUD operations for products for admin users.
- **Quotations:** Users can request quotations for products.

## Technologies

- **Frontend:** React.js, Vite, TypeScript, Chakra UI
- **Backend:** Node.js, Express, TypeScript, Sequelize
- **Database:** PostgreSQL
- **Containerization:** Docker

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Local Development Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd CresceBR-new
    ```

2.  **Create Backend Environment File:**
    Navigate to the `backend` folder, create a copy of `.env.example`, and rename it to `.env`.

    ```bash
    cd backend
    cp .env.example .env
    cd ..
    ```

    _You can customize the variables in `backend/.env` if needed, but the defaults are configured to work with Docker Compose._

3.  **Build and Run with Docker Compose:**
    From the root directory of the project, run the following command:

    ```bash
    docker-compose up --build
    ```

    This command will build the images for the frontend, backend, and database services and start the containers.

4.  **Access the Application:**
    - **Frontend:** Open your browser and go to [http://localhost:5173](http://localhost:5173)
    - **Backend API:** The API will be running at `http://localhost:3001`

### Running Tests

To run the tests for both frontend and backend, you can use the `docker-compose exec` command.

1.  **Run Backend Tests:**

    ```bash
    docker-compose exec crescebr_backend npm test
    ```

2.  **Run Frontend Tests:**
    ```bash
    docker-compose exec crescebr_frontend npm test
    ```
