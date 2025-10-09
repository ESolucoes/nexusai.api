#!/bin/sh
set -e

# ---------- Configura Playwright ----------
# define onde o Playwright deve colocar os browsers
export PLAYWRIGHT_BROWSERS_PATH=/app/.ms-playwright

# instala Chromium se não estiver presente
if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH/chromium-*" ]; then
  echo "🚀 Instalando Chromium via Playwright..."
  npx playwright install chromium
  echo "✅ Chromium instalado em $PLAYWRIGHT_BROWSERS_PATH"
fi

# ---------- Rodar migrations ----------
DS=$(find dist -iname "data-source.js" 2>/dev/null | head -n1)
if [ -z "$DS" ]; then
  echo "DataSource compilado não encontrado em dist/. Verifique seu build."
  ls -R dist || true
  exit 1
fi

echo "🚀 Rodando migrations com $DS ..."
node node_modules/typeorm/cli.js -d "$DS" migration:run
echo "✅ Migrations concluídas, iniciando aplicação..."

# ---------- Inicia aplicação ----------
exec node dist/main.js
