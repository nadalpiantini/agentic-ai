# 🤖 OpenClaw Telegram Bot

Bot de Telegram integrado con OpenClaw AI usando Ollama Cloud.

## 🚀 Setup Rápido

### 1. Crear Bot en Telegram

1. **Abre Telegram** y busca **@BotFather**
2. **Envía** `/newbot`
3. **Sigue las instrucciones:**
   - Elegir nombre: `OpenClaw Bot` (o el que quieras)
   - Elegir username: `MiOpenClaw_bot` (debe terminar en `_bot`)
4. **Copia el token** que te da BotFather
   - Formato: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`

### 2. Configurar Variables de Entorno

```bash
cd openclaw-telegram-bot

# Crear archivo .env
cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENCLAW_API_KEY=your_openclaw_api_key_here
OPENCLAW_BASE_URL=https://ollama.com/v1
DEFAULT_MODEL=deepseek-v3.2
ALLOWED_USERS=*
EOF

# Reemplaza los placeholders con tus credenciales reales
```

### 3. Instalar Dependencias

```bash
pip3 install -r requirements.txt
```

### 4. Ejecutar Bot

```bash
python3 openclaw_bot.py
```

Deberías ver:
```
============================================================
🤖 OPENCLAW TELEGRAM BOT
============================================================
✅ Bot iniciado: 2026-02-16 HH:MM:SS
🔧 Modelo: deepseek-v3.2
📱 Esperando mensajes...
```

### 5. Probar en Telegram

1. **Abre tu bot** en Telegram (busca el username que elegiste)
2. **Envía** `/start`
3. **¡Listo!** Ya puedes chatear con OpenClaw

---

## 📝 Comandos del Bot

| Comando | Descripción |
|---------|-------------|
| `/start` | Inicia el bot y muestra bienvenida |
| `/help` | Muestra ayuda y comandos disponibles |
| `/chat <msg>` | Envía mensaje a la AI |
| `/model` | Selecciona modelo AI (inline buttons) |
| `/clear` | Limpia historial de conversación |
| `/history` | Muestra estadísticas del historial |

---

## 🧠 Modelos Disponibles

- **`deepseek-v3.2`** - Modelo principal (recomendado)
- **`qwen3-coder:480b`** - Especializado en programación
- **`kimi-k2.5`** - Contexto largo (1M tokens)
- **`mistral-large-3:675b`** - General purpose

---

## 🔧 Configuración Avanzada

### Cambiar Modelo por Defecto

Edita `.env`:
```bash
DEFAULT_MODEL=qwen3-coder:480b
```

### Restringir Usuarios

Edita `.env`:
```bash
# Solo permitir usuarios específicos (por Telegram ID)
ALLOWED_USERS=123456789,987654321

# Obtener tu ID: envía /start a @userinfobot
```

### Logs

El bot guarda logs en `openclaw_bot.log`:
```bash
tail -f openclaw_bot.log
```

---

## 🛠️ Troubleshooting

### Bot no responde

1. **Verificar token:**
   ```bash
   cat .env | grep TELEGRAM_BOT_TOKEN
   ```

2. **Verificar logs:**
   ```bash
   tail -20 openclaw_bot.log
   ```

3. **Restart bot:**
   ```bash
   # Matar proceso
   pkill -f openclaw_bot.py

   # Reiniciar
   python3 openclaw_bot.py
   ```

### Error de API

Verificar que Ollama Cloud esté accesible:
```bash
curl https://ollama.com/v1/models
```

---

## 📊 Arquitectura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Telegram   │ ───> │ OpenClaw Bot │ ───> │ Ollama Cloud│
│   Usuario   │      │  (Python)    │      │  (OpenAI)   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ↓
                     ┌──────────────┐
                     │  Historial   │
                     │  (Memoria)   │
                     └──────────────┘
```

---

**🔗 Powered by OpenClaw + Ollama Cloud + Telegram**
