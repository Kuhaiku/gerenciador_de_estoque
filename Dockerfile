# Estágio 1: Usar uma imagem base oficial do Node.js. A versão -alpine é leve.
FROM node:20-alpine

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos de definição de pacotes
COPY package*.json ./

# Instalar apenas as dependências de produção para manter a imagem limpa e segura
RUN npm install --only=production

# Copiar o resto do código da aplicação (backend e frontend)
# O .dockerignore garantirá que node_modules e outros arquivos não sejam copiados
COPY . .

# Expor a porta em que a aplicação roda dentro do contêiner
EXPOSE 3000

# O comando para iniciar a aplicação quando o contêiner subir
CMD [ "node", "backend/server.js" ]
