FROM node:18-alpine

WORKDIR /app

COPY Backend/package*.json ./
RUN npm install

COPY Backend/ ./

EXPOSE 3000

CMD ["node", "src/server.js"]