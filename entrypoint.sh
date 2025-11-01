#!/bin/sh
set -e

echo "🚀 Iniciando aplicação NexusAI..."

# ---------- Configurações Playwright ----------
export PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
export CHROMIUM_PATH=/ms-playwright/chromium-1084/chrome-linux/chrome
export PLAYWRIGHT_EXECUTABLE_PATH=/ms-playwright/chromium-1084/chrome-linux/chrome

echo "🔧 Configurações do Playwright:"
echo "   - PLAYWRIGHT_BROWSERS_PATH: $PLAYWRIGHT_BROWSERS_PATH"
echo "   - CHROMIUM_PATH: $CHROMIUM_PATH"
echo "   - NODE_ENV: $NODE_ENV"

# ---------- Verifica Chromium ----------
echo "🔍 Verificando instalação do Chromium..."

# Lista possíveis caminhos do Chromium
echo "📍 Procurando Chromium no sistema..."
find / -name "*chromium*" -o -name "*chrome*" 2>/dev/null | grep -v "proc\|sys" | head -10

if [ -f "$CHROMIUM_PATH" ]; then
    echo "✅ Chromium encontrado: $($CHROMIUM_PATH --version | head -n1)"
else
    echo "⚠️ Chromium não encontrado no caminho configurado"
    echo "🔧 Playwright vai usar o Chromium interno"
fi

# ---------- Teste do Playwright ----------
echo "🧪 Testando Playwright..."
if node -e "
const { chromium } = require('playwright');
async function test() {
    try {
        console.log('🔧 Iniciando teste Playwright...');
        const browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'networkidle' });
        const title = await page.title();
        await browser.close();
        console.log('✅ Playwright testado com sucesso - Title:', title);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no Playwright:', error.message);
        process.exit(1);
    }
}
test();
"; then
    echo "✅ Playwright funcionando corretamente"
else
    echo "❌ Falha no teste do Playwright"
    exit 1
fi

# ---------- Rodar migrations ----------
echo "🚀 Procurando DataSource para migrations..."
DS=$(find dist -name "data-source.js" -o -name "data-source.ts" 2>/dev/null | head -n1)

if [ -z "$DS" ]; then
    echo "⚠️ DataSource não encontrado, listando dist/:"
    find dist -type f -name "*.js" | head -10
    echo "⏭️ Pulando migrations..."
else
    echo "📦 DataSource encontrado: $DS"
    echo "🚀 Executando migrations..."
    if node node_modules/typeorm/cli.js -d "$DS" migration:run; then
        echo "✅ Migrations concluídas com sucesso"
    else
        echo "❌ Erro nas migrations, continuando sem migrations..."
    fi
fi

# ---------- Inicia aplicação ----------
echo "🎉 Iniciando aplicação NexusAI..."
exec node dist/main.js