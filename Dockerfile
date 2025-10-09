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

# diretório global para browsers
RUN mkdir -p /ms-playwright && chmod a+rX /ms-playwright

# copia build e node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# garante que user node tenha permissão
RUN chown -R node:node /ms-playwright
RUN chmod -R a+rX /ms-playwright

# usa dumb-init como init para melhor handling de signals
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 3000
CMD ["./entrypoint.sh"]
