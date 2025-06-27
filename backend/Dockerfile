FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .
COPY shared/ ./shared/

RUN npm run build

RUN npm prune --omit=dev

EXPOSE 3001

CMD ["npm", "start"]