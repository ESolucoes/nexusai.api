# ============================================================
#                       BUILD STAGE
# ============================================================
FROM mcr.microsoft.com/playwright:v1.44.0-focal AS build

WORKDIR /app

# Dependências com cache
COPY package*.json ./
RUN npm ci

# Configs NestJS/TS
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

# Código fonte
COPY src ./src

# Build (gera /dist)
RUN npm run build

# Remove devDependencies para runtime menor
RUN npm prune --omit=dev


# ============================================================
#                       RUNTIME STAGE
# ============================================================
FROM mcr.microsoft.com/playwright:v1.44.0-focal AS runtime

WORKDIR /app

# -------- VARIÁVEIS DE AMBIENTE --------
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--experimental-global-webcrypto --max_old_space_size=4096"
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# -------- PACOTES NECESSÁRIOS --------
RUN apt-get update && \
    apt-get install -y dumb-init nginx && \
    rm -rf /var/lib/apt/lists/*

# -------- COPIA ARQUIVOS DA BUILD --------
RUN mkdir -p /app/dist /app/node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./

# -------- ENTRYPOINT --------
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# -------- NGINX (caso você use nginx.conf) --------
# Coloque seu arquivo em: /docker/nginx.conf
# Ele será copiado automaticamente
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# -------- INSTALA PLAYWRIGHT --------
RUN echo "📥 Instalando browsers Playwright..." && \
    npx playwright install && \
    npx playwright --version

# -------- ENTRYPOINT PRINCIPAL --------
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 3000

CMD ["./entrypoint.sh"]
