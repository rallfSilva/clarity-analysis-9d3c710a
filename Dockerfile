FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

COPY . .

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# Expor porta do Vite
EXPOSE 8080

# Comando para rodar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]
