#!/bin/bash
# ============================================================
# OpenClaw Telegram Bot - Quick Start
# ============================================================

set -e

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$BOT_DIR/.env"

echo "🤖 OpenClaw Telegram Bot - Setup"
echo "================================="
echo ""

# Verificar que estamos en el directorio correcto
cd "$BOT_DIR"

# Verificar dependencias
echo "📦 Verificando dependencias..."
if ! python3 -c "import telegram" 2>/dev/null; then
    echo "❌ Falta instalar dependencias"
    echo "Ejecuta: pip3 install -r requirements.txt"
    exit 1
fi
echo "✅ Dependencias OK"

# Verificar .env
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "⚠️  Archivo .env no encontrado"
    echo "================================"
    echo ""
    echo "1. Abre Telegram y busca @BotFather"
    echo "2. Envía /newbot"
    echo "3. Sigue las instrucciones"
    echo "4. Copia el token que te da"
    echo ""
    read -p "Pega tu token aquí: " TOKEN

    if [ -z "$TOKEN" ]; then
        echo "❌ Token no puede estar vacío"
        exit 1
    fi

    # Crear .env
    cat > "$ENV_FILE" << EOF
TELEGRAM_BOT_TOKEN=$TOKEN
OPENCLAW_API_KEY=your_api_key_here
OPENCLAW_BASE_URL=https://ollama.com/v1
DEFAULT_MODEL=deepseek-v3.2
ALLOWED_USERS=*
EOF

    echo ""
    echo "✅ .env creado"
    echo "⚠️  EDITA .env y agrega tu OPENCLAW_API_KEY"
fi

# Verificar token configurado
if grep -q "your_token_here\|your_api_key_here" "$ENV_FILE"; then
    echo "❌ Token o API key no configurados en .env"
    echo "Edita $ENV_FILE y agrega tus credenciales"
    exit 1
fi

echo "✅ Configuración OK"
echo ""

# Iniciar bot
echo "🚀 Iniciando bot..."
echo "Ctrl+C para detener"
echo ""

python3 openclaw_bot.py
