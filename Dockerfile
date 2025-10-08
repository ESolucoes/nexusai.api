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

# libs básicas p/ Playwright
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# só o necessário pra rodar
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# instalar Playwright e Chromium
RUN npx playwright install --with-deps
RUN npx playwright install chromium

EXPOSE 3000
CMD ["./entrypoint.sh"]
