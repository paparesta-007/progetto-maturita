# Cambiamo la versione a 20-alpine
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]