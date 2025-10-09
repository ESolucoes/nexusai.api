# ---------- build ----------
FROM mcr.microsoft.com/playwright:v1.44.0-focal AS build
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
FROM mcr.microsoft.com/playwright:v1.44.0-focal AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--experimental-global-webcrypto"
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV DISPLAY=:99

# instala Xvfb para simular display gráfico
RUN apt-get update && \
    apt-get install -y dumb-init xvfb && \
    rm -rf /var/lib/apt/lists/*

# diretório global para browsers (imagem Playwright já fornece permissão correta)
RUN mkdir -p /ms-playwright

# copia build e node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# dumb-init como init para melhor handling de signals
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 3000

# usa Xvfb para abrir navegador em modo headful
CMD ["xvfb-run", "-s", "-screen 0 1280x1024x24", "./entrypoint.sh"]
