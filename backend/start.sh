#!/bin/bash
set -e

echo "🚀 Starting CresceBR Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until nc -z db 5432; do
  echo "Database is not ready yet, waiting..."
  sleep 2
done
echo "✅ Database is ready!"

# Function to run migrations with retry
run_migrations() {
  local max_attempts=3
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "📊 Running database migrations (attempt $attempt/$max_attempts)..."
    
    if npx sequelize-cli db:migrate; then
      echo "✅ Migrations completed successfully"
      return 0
    else
      echo "❌ Migration attempt $attempt failed"
      if [ $attempt -eq $max_attempts ]; then
        echo "💥 All migration attempts failed"
        exit 1
      fi
      echo "⏳ Waiting 5 seconds before retry..."
      sleep 5
      attempt=$((attempt + 1))
    fi
  done
}

# Function to run seeders with retry
run_seeders() {
  local max_attempts=3
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "🌱 Running database seeders (attempt $attempt/$max_attempts)..."
    
    if npx sequelize-cli db:seed:all; then
      echo "✅ Seeders completed successfully"
      return 0
    else
      echo "❌ Seeder attempt $attempt failed"
      if [ $attempt -eq $max_attempts ]; then
        echo "⚠️  Seeders failed, but continuing startup..."
        return 0
      fi
      echo "⏳ Waiting 3 seconds before retry..."
      sleep 3
      attempt=$((attempt + 1))
    fi
  done
}

# Run migrations and seeders
run_migrations
run_seeders

echo "🎯 Starting the application..."
exec node dist/server.js