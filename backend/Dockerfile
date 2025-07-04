# Stage 1: Build stage
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy shared workspace
COPY shared ./shared

# Copy backend source code
COPY backend/ ./

# Set build-time argument for environment
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Build TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy dependencies from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
# Copy built code from build stage
COPY --from=build /usr/src/app/dist ./dist
# Copy migrations and seeders
COPY --from=build /usr/src/app/migrations ./migrations
COPY --from=build /usr/src/app/seeders ./seeders
# Copy config and package.json
COPY backend/config/config.json ./config/config.json
COPY backend/package.json .

# Install sequelize-cli globally to run migrations
RUN npm install -g sequelize-cli

# Expose port
EXPOSE 3001

# Command to run the application
# It will first wait for the database to be ready, then run migrations, and finally start the server.
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node dist/server.js"]