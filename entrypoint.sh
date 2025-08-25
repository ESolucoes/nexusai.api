#!/bin/sh
set -e
DS=$(find dist -iname "data-source.js" 2>/dev/null | head -n1)
if [ -z "$DS" ]; then
  echo "DataSource compilado não encontrado em dist/. Verifique seu build."
  ls -R dist || true
  exit 1
fi
echo "🚀 Rodando migrations com $DS ..."
node node_modules/typeorm/cli.js -d "$DS" migration:run
echo "✅ Migrations concluídas, iniciando aplicação..."
exec node dist/main.js
