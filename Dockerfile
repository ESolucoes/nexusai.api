# ---------- build ----------
FROM mcr.microsoft.com/playwright:v1.56.1-focal AS build
WORKDIR /app

# deps com cache
COPY package*.json ./
RUN npm ci

# configs do Nest/TS
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

# código fonte
COPY src ./src

# build e slim de devDeps
RUN npm run build
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM mcr.microsoft.com/playwright:v1.56.1-focal AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--experimental-global-webcrypto --max_old_space_size=4096"

# 🔥 CONFIGURAÇÕES SIMPLIFICADAS - Deixa o Playwright gerenciar automaticamente
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# instala dependências adicionais
RUN apt-get update && \
    apt-get install -y dumb-init && \
    rm -rf /var/lib/apt/lists/*

# cria diretório para aplicação
RUN mkdir -p /app/dist /app/node_modules

# copia build e node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# 🔥 VERIFICAÇÃO SIMPLIFICADA
RUN echo "🔍 Verificando Playwright..." && \
    npx playwright --version && \
    echo "✅ Playwright verificado"

# dumb-init como init para melhor handling de signals
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 3000

CMD ["./entrypoint.sh"]