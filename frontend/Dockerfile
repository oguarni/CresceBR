FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV REACT_APP_API_URL=http://backend:3001/api

EXPOSE 3000

CMD ["npm", "start"]