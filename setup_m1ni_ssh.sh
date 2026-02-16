#!/bin/bash
# ============================================================
# Setup SSH en M1ni - Ejecutar ESTE SCRIPT EN M1NI
# ============================================================

echo "🔧 Configurando SSH en M1ni..."
echo "================================"

# 1. Habilitar SSH
echo ""
echo "📋 Paso 1: Habilitando SSH..."
sudo systemsetup -setremotelogin on

# 2. Crear directorio .ssh
echo ""
echo "📋 Paso 2: Configurando claves..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 3. Crear authorized_keys con la clave pública de M2
echo ""
echo "📋 Paso 3: Agregando clave pública de M2..."
echo ""
echo "⚠️  COPIA ESTA CLAVE PÚBLICA DESDE M2:"
echo "-------------------------------------"
cat << 'KEY'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOWvYL+FKMYLZPqOq+LhOYlQgLQfR0dY9Z8XK7JYHQ5N nadalpiantini@M1
KEY
echo "-------------------------------------"
echo ""
echo "Pégala en el archivo ~/.ssh/authorized_keys en M1ni"
echo ""
read -p "Presiona ENTER cuando hayas copiado la clave..."

# 4. Verificar
echo ""
echo "📋 Paso 4: Verificando configuración..."
if sudo systemsetup -getremotelogin | grep -q "On"; then
    echo "✅ SSH habilitado"
else
    echo "❌ SSH no está habilitado"
    exit 1
fi

if [ -f ~/.ssh/authorized_keys ]; then
    echo "✅ authorized_keys creado"
    chmod 600 ~/.ssh/authorized_keys
else
    echo "⚠️  authorized_keys no existe - crea manualmente"
fi

# 5. Mostrar info
echo ""
echo "================================"
echo "✅ SETUP COMPLETADO"
echo "================================"
echo ""
echo "📌 Desde M2 ahora puedes conectar:"
echo "   ssh m1ni"
echo "   ssh m1"
echo "   ssh twin"
echo ""
echo "🔑 Usuario: nadalpiantini"
echo "🌐 IP Tailscale: $(tailscale ip -4 2>/dev/null || echo 'No disponible')"
echo ""
