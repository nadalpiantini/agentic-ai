#!/bin/bash
# Habilitar SSH en M1ni
echo "🔧 Habilitando SSH en M1ni..."
sudo systemsetup -setremotelogin on
echo "✅ SSH habilitado"
sudo systemsetup -getremotelogin
echo ""
echo "📌 IP Tailscale: $(tailscale ip -4 2>/dev/null || echo 'No disponible')"
echo "📌 IP Local: $(ipconfig getifaddr en0 2>/dev/null || echo 'No disponible')"
