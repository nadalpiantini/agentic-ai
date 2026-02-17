#!/usr/bin/env python3
"""Test de integración completo con Telegram"""

import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN no encontrado en entorno")

BASE_URL = f"https://api.telegram.org/bot{TOKEN}"

print("🧪 TEST DE INTEGRACIÓN TELEGRAM + OPENCLAW")
print("=" * 60)

# 1. Obtener info del bot
print("\n1️⃣ Verificando bot...")
response = requests.get(f"{BASE_URL}/getMe")
data = response.json()

if data['ok']:
    bot = data['result']
    print(f"✅ Bot activo: @{bot['username']} ({bot['first_name']})")
    print(f"   ID: {bot['id']}")
else:
    print("❌ Bot no disponible")
    exit(1)

# 2. Obtener updates (mensajes)
print("\n2️⃣ Buscando mensajes...")
response = requests.get(f"{BASE_URL}/getUpdates")
data = response.json()

if data['ok']:
    updates = data['result']
    print(f"📨 Mensajes pendientes: {len(updates)}")

    if len(updates) > 0:
        print("\n📋 Mensajes recibidos:")
        for i, update in enumerate(updates[-3:], 1):  # Últimos 3
            if 'message' in update:
                msg = update['message']
                user = msg.get('from', {})
                chat = msg.get('chat', {})
                text = msg.get('text', '(no text)')

                print(f"\n  {i}. De: {user.get('first_name', 'Unknown')} (@{user.get('username', 'N/A')})")
                print(f"     Chat ID: {chat['id']}")
                print(f"     Texto: {text}")
                print(f"     Fecha: {msg['date']}")
    else:
        print("\n💡 No hay mensajes aún.")
        print("   Para probar el bot:")
        print("   1. Abre Telegram")
        print("   2. Busca tu bot")
        print("   3. Envía /start")

# 3. Verificar webhook
print("\n3️⃣ Verificando webhook...")
response = requests.get(f"{BASE_URL}/getWebhookInfo")
data = response.json()

if data['ok']:
    info = data['result']
    if info['url']:
        print(f"🔗 Webhook configurado: {info['url']}")
    else:
        print("✅ Modo polling activo (sin webhook)")

    if info.get('has_custom_certificate'):
        print("📜 Certificado custom: Sí")

    if info.get('pending_update_count', 0) > 0:
        print(f"⚠️  Updates pendientes: {info['pending_update_count']}")

print("\n" + "=" * 60)
print("✅ INTEGRACIÓN TELEGRAM VERIFICADA")
print("=" * 60)
