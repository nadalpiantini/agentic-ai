# ✅ TO-DO - MESH + OPENCLAW TELEGRAM BOT

**Fecha**: 2026-02-16
**Estado**: En progreso

---

## 📋 TAREAS PENDIENTES

### 1. ⚡ Configurar Mesh M2 ↔ M1ni

**EN M1NI (esta Mac):**
```bash
bash ~/setup_m1ni_complete.sh
```

Este script hará:
- ✅ Habilitar SSH (ya tiene clave de M2 agregada)
- ✅ Iniciar Tailscale
- ✅ Iniciar Docker
- ✅ Crear e iniciar servidor Sephirot (PostgreSQL, Redis, Qdrant)

**VERIFICACIÓN:**
```bash
# Verificar servicios
~/check_twin_services.sh

# Desde M2 (tu MacBook), probar conexión:
ssh m1ni
```

---

### 2. 🤖 Configurar OpenClaw Telegram Bot

**CREAR BOT EN TELEGRAM:**
1. Abre Telegram y busca @BotFather
2. Envía `/newbot`
3. Sigue instrucciones:
   - Nombre: `OpenClaw Bot`
   - Username: `MiOpenClaw_bot` (debe terminar en `_bot`)
4. **Copia el token** que te da BotFather

**CONFIGURAR BOT:**
```bash
cd ~/openclaw-telegram-bot

# Editar .env y pegar token
nano .env
# Reemplaza: TELEGRAM_BOT_TOKEN=PENDING_REPLACE_WITH_BOTFATHER_TOKEN
# Con: TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

# O ejecuta:
bash ~/openclaw-telegram-bot/start_bot.sh
```

**INICIAR BOT:**
```bash
cd ~/openclaw-telegram-bot
python3 openclaw_bot.py
```

**PROBAR:**
1. Abre Telegram
2. Busca tu bot (@MiOpenClaw_bot o el nombre que elegiste)
3. Envía `/start`

---

## 📁 ARCHIVOS CREADOS

### Mesh M1ni:
- `~/.ssh/authorized_keys` - Clave pública de M2 ✅
- `~/setup_m1ni_complete.sh` - Script completo de setup
- `~/check_twin_services.sh` - Verificación de servicios
- `~/sephirot-server/docker-compose.yml` - Servicios (se creará al ejecutar)

### Telegram Bot:
- `~/openclaw-telegram-bot/openclaw_bot.py` - Código del bot
- `~/openclaw-telegram-bot/requirements.txt` - Dependencias
- `~/openclaw-telegram-bot/start_bot.sh` - Script de inicio
- `~/openclaw-telegram-bot/.env` - Variables (falta token)
- `~/openclaw-telegram-bot/README.md` - Documentación completa

---

## 🎯 ORDEN RECOMENDADO

1. **PRIMERO:** Configurar mesh
   ```bash
   bash ~/setup_m1ni_complete.sh
   ```

2. **SEGUNDO:** Configurar Telegram bot
   - Crear bot en Telegram
   - Configurar token en `.env`
   - Iniciar bot

---

## ✅ ESTADO ACTUAL

| Tarea | Estado | Nota |
|-------|--------|------|
| Clave SSH M2 agregada | ✅ | `~/.ssh/authorized_keys` |
| Script setup M1ni | ✅ | `~/setup_m1ni_complete.sh` |
| Telegram Bot código | ✅ | `~/openclaw-telegram-bot/` |
| Bot ejecutándose | ⏳ | Falta token de Telegram |
| Mesh M2 ↔ M1ni | ⏳ | Falta ejecutar script |
| Servidor Sephirot | ⏳ | Se creará con script |

---

## 🔗 COMANDOS ÚTILES

### Verificar servicios:
```bash
~/check_twin_services.sh
```

### Ver logs Sephirot:
```bash
cd ~/sephirot-server && docker-compose logs -f
```

### Reiniciar bot Telegram:
```bash
cd ~/openclaw-telegram-bot
python3 openclaw_bot.py
```

### Conectarse desde M2:
```bash
ssh m1ni
ssh m1
ssh twin
```

---

**Última actualización**: 2026-02-16
