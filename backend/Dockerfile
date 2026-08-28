FROM node:20-slim

# Instala dependências do sistema necessárias para compilação nativa de pacotes como better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia manifestos de pacotes
COPY package*.json ./

# Instala dependências de produção
RUN npm install --omit=dev

# Copia o código fonte
COPY src ./src

# Cria diretório padrão para o banco de dados
RUN mkdir -p /data

ENV PORT=8080
ENV DB_PATH=/data/salao.db

EXPOSE 8080

CMD ["node", "src/server.js"]
