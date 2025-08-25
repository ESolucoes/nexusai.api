#!/bin/sh
set -e

echo "🚀 Rodando migrations..."
node node_modules/typeorm/cli.js -d dist/data-source.js migration:run

echo "✅ Migrations concluídas, iniciando aplicação..."
exec node dist/main.js
