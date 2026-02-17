#!/usr/bin/env python3
"""Test interno del bot OpenClaw"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENCLAW_API_KEY")
if not api_key:
    raise ValueError("OPENCLAW_API_KEY no encontrada en entorno")

# Configuración
OPENCLAW_CLIENT = OpenAI(
    api_key=api_key,
    base_url=os.getenv("OPENCLAW_BASE_URL", "https://ollama.com/v1")
)

DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "deepseek-v3.2")

print("🧪 TEST INTERNO DEL BOT")
print("=" * 60)

# Simular conversación
test_messages = [
    {"role": "user", "content": "Hola, ¿qué puedes hacer?"}
]

print("\n📨 Mensaje de prueba:")
print(f"  Usuario: {test_messages[0]['content']}")

print("\n🤖 Enviando a OpenClaw (Ollama Cloud)...")
print(f"  Modelo: {DEFAULT_MODEL}")
print(f"  API: {OPENCLAW_CLIENT.base_url}")

try:
    response = OPENCLAW_CLIENT.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=test_messages,
        max_tokens=500,
        temperature=0.7,
    )

    ai_response = response.choices[0].message.content

    print("\n✅ Respuesta recibida:")
    print("-" * 60)
    print(ai_response)
    print("-" * 60)

    print("\n📊 Métricas:")
    print(f"  Tokens usados: {response.usage.total_tokens if hasattr(response, 'usage') else 'N/A'}")
    print(f"  Modelo: {response.model}")

    print("\n✅ TEST EXITOSO - Bot funciona correctamente")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
