FROM node:18-alpine as build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .
COPY shared/ ./shared/

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]