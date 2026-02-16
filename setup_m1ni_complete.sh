#!/bin/bash
# ============================================================
# Setup Completo de M1ni como Servidor Twin
# ============================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🖥️  M1NI - CONFIGURACIÓN COMPLETA COMO SERVIDOR       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 1. HABILITAR SSH
echo "📋 PASO 1: Habilitando SSH..."
echo "────────────────────────────────────────"
if sudo systemsetup -getremotelogin | grep -q "On"; then
    echo "✅ SSH ya está habilitado"
else
    echo "Habilitando SSH (requiere password)..."
    sudo systemsetup -setremotelogin on
    echo "✅ SSH habilitado"
fi
echo ""

# 2. INICIAR TAILSCALE
echo "📋 PASO 2: Iniciando Tailscale..."
echo "────────────────────────────────────────"
if pgrep -q "Tailscale"; then
    echo "✅ Tailscale ya está corriendo"
else
    echo "Iniciando Tailscale..."
    open -a Tailscale
    sleep 5
    echo "✅ Tailscale iniciado"
fi

# Mostrar IPs
echo ""
echo "📌 Direcciones IP:"
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "No disponible")
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "No disponible")
echo "  • Tailscale: $TAILSCALE_IP"
echo "  • Local: $LOCAL_IP"
echo ""

# 3. INICIAR DOCKER
echo "📋 PASO 3: Iniciando Docker..."
echo "────────────────────────────────────────"
if pgrep -q "Docker"; then
    echo "✅ Docker ya está corriendo"
else
    echo "Iniciando Docker..."
    open -a Docker
    echo "⏳ Esperando que Docker inicie..."
    sleep 15
    echo "✅ Docker iniciado"
fi
echo ""

# 4. INICIAR SERVIDOR SEPHIROT
echo "📋 PASO 4: Iniciando Sephirot Server..."
echo "────────────────────────────────────────"

if [ ! -d ~/sephirot-server ]; then
    echo "Creando directorio sephirot-server..."
    mkdir -p ~/sephirot-server
    
    # Crear docker-compose.yml
    cat > ~/sephirot-server/docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: sephirot-postgres
    environment:
      POSTGRES_USER: sephirot
      POSTGRES_PASSWORD: sephirot_pass
      POSTGRES_DB: agent_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: sephirot-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:v1.7.4
    container_name: sephirot-qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
COMPOSE

    echo "✅ docker-compose.yml creado"
fi

cd ~/sephirot-server
echo "Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando que servicios inicien..."
sleep 10

# Verificar servicios
echo ""
echo "📊 Estado de servicios:"
docker-compose ps

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ CONFIGURACIÓN COMPLETADA                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📡 CONEXIÓN DESDE M2:"
echo "  ssh m1ni"
echo "  ssh m1"
echo "  ssh twin"
echo ""
echo "🗄️  SERVICIOS SEPHIROT:"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo "  • Qdrant: localhost:6333"
echo ""
echo "🔍 VERIFICAR:"
echo "  ~/check_twin_services.sh"
echo ""
echo "📋 LOGS:"
echo "  cd ~/sephirot-server && docker-compose logs -f"
echo ""
