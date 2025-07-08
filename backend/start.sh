#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Backend startup script initiated."

# The wait-for-it.sh script is executed from docker-compose to ensure the database is ready.
echo "Database is ready. Proceeding with migrations..."

# Run database migrations
npx sequelize-cli db:migrate

echo "Migrations completed successfully."

# Seed the database with initial data
# This is crucial for the application to have default users, products, etc.
echo "Seeding database..."
npx sequelize-cli db:seed:all

echo "Database seeding completed successfully."

# Start the server using the docker-specific command
echo "Starting application server..."
npm run start:docker

echo "Server started."