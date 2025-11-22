#!/bin/sh
set -e

echo "🚀 Iniciando NexusAI..."

# Rodar migrations caso exista DataSource
DS=$(find dist -name "data-source.js" -o -name "data-source.ts" 2>/dev/null | head -n1)

if [ -n "$DS" ]; then
  echo "📦 Executando migrations..."
  node node_modules/typeorm/cli.js -d "$DS" migration:run || echo "⚠️ Falha nas migrations (continuando mesmo assim)"
else
  echo "⚠️ Nenhum data-source encontrado, pulando migrations"
fi

echo "🎉 Iniciando aplicação NestJS..."
exec node dist/main.js
