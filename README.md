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

## Running with Docker

This project is configured to run entirely within Docker containers. This is the recommended way to run the application for development and testing.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd CresceBR-new
    ```

2.  **Create an environment file:**
    Copy the example file to create your own local configuration.
    ```bash
    cp .env.example .env
    ```
    _You can customize the values in the `.env` file if needed, but the defaults should work out of the box._

### Running the Application

1.  **Build and start the services:**
    This command will build the Docker images for the frontend and backend, start all containers, and set up the database.

    ```bash
    docker-compose up --build
    ```

2.  **Access the application:**
    - **Frontend:** Open your browser and go to [http://localhost:8080](http://localhost:8080)
    - **Backend API:** The API will be available at `http://localhost:3001`

### Running Tests

To run the automated tests, execute the following commands in a new terminal while the application is running:

- **Run Backend Tests:**

  ```bash
  docker-compose exec backend npm test
  ```

- **Run Frontend Tests:**
  ```bash
  docker-compose exec frontend npm test
  ```

### Stopping the Application

To stop all running containers, press `Ctrl + C` in the terminal where `docker-compose up` is running, or run the following command from the project root:

```bash
docker-compose down
```

To remove the database volume as well, use:

```bash
docker-compose down -v
```
