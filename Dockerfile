# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# libs básicas p/ compatibilidade
RUN apk add --no-cache libc6-compat

# deps com cache
COPY package*.json ./
RUN npm ci

# configs do Nest/TS
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

# código fonte (inclui src/data-source.ts)
COPY src ./src

# build e “slim” de deps
RUN npm run build
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--experimental-global-webcrypto"

# diretório fixo para browsers (evita cache em /root)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# libs necessárias para Chromium funcionar no Alpine
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  fontconfig \
  bash \
  lcms2

# cria o diretório global para browsers e dá permissões
RUN mkdir -p /ms-playwright && chmod a+rX /ms-playwright

# só o necessário pra rodar
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# instala Chromium via Playwright no caminho definido (não --with-deps)
# executa como root — os arquivos serão escritos em /ms-playwright
RUN npx playwright install chromium

# garante que o user 'node' (existente na imagem oficial) possa ler/exec os browsers
# se você executar a app como usuário diferente, ajuste o usuário/UID abaixo
RUN chown -R node:node /ms-playwright || true
RUN chmod -R a+rX /ms-playwright

EXPOSE 3000
CMD ["./entrypoint.sh"]
