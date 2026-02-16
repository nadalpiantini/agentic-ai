#!/bin/bash
echo "🔍 Verificando servicios de Twin..."
echo "===================================="

# SSH
echo -n "SSH: "
if sudo systemsetup -getremotelogin | grep -q "On"; then
    echo "✅ Activo"
else
    echo "❌ Inactivo - Requiere configuración manual"
fi

# Tailscale
echo -n "Tailscale: "
if command -v tailscale &> /dev/null; then
    if tailscale status &>/dev/null; then
        echo "✅ Activo"
        tailscale ip -4 2>/dev/null || echo "Conectando..."
    else
        echo "⚠️  Instalado pero no activo"
    fi
else
    echo "❌ No instalado"
fi

# ZeroTier
echo -n "ZeroTier: "
if command -v zerotier-cli &> /dev/null; then
    if sudo zerotier-cli status &>/dev/null; then
        echo "✅ Activo"
    else
        echo "⚠️  Instalado pero no activo"
    fi
else
    echo "❌ No instalado"
fi

# Docker
echo -n "Docker: "
if docker ps &>/dev/null; then
    running=$(docker ps --format "{{.Names}}" | wc -l | tr -d ' ')
    echo "✅ Activo ($running contenedores)"
else
    echo "❌ No corriendo"
fi

# Sephirot
echo -n "Sephirot: "
if curl -s http://localhost:4040/health | grep -q "healthy"; then
    echo "✅ Activo"
else
    echo "❌ No responde"
fi

# Network
echo -n "Red: "
if ping -c 1 google.com &>/dev/null; then
    echo "✅ Conectado"
else
    echo "❌ Sin conexión"
fi

# Sleep Prevention
echo -n "Sleep Mode: "
if pmset -g | grep -q "sleep.*0"; then
    echo "✅ Desactivado"
else
    echo "⚠️  Activo - Requiere corrección"
fi

echo ""
echo "📊 IPs actuales:"
echo "LAN: $(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 'No conectado')"
echo "Tailscale: $(tailscale ip -4 2>/dev/null || echo 'No disponible')"
echo "ZeroTier: $(sudo zerotier-cli listnetworks 2>/dev/null | grep -oP '^\d+.*?\K[\d.]+' | head -1 || echo 'No disponible')"
