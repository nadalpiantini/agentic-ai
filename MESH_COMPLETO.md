# 🎉 MESH M2 ↔ M1NI - COMPLETADO

**Fecha**: 2026-02-16
**Estado**: ✅ **PRODUCCIÓN**

---

## ✅ SERVICIOS CONFIGURADOS

### 🗄️  Sephirot Server (M1ni)
| Servicio | Estado | Puerto | Conexión desde M2 |
|----------|--------|--------|-------------------|
| **PostgreSQL** | ✅ Activo | 5432 | `postgres://sephirot:sephirot_pass@m1ni:5432` |
| **Redis** | ✅ Activo | 6379 | `redis://m1ni:6379` |
| **Qdrant** | ✅ Activo | 6333 | `http://m1ni:6333` |

### 🌐 Red
| Servicio | IP | Estado |
|----------|-----|--------|
| **Tailscale** | 100.85.23.89 | ✅ Activo |
| **LAN** | 192.168.1.239 | ✅ Conectado |
| **SSH** | - | ✅ Habilitado |

---

## 📡 CONEXIÓN DESDE M2

### SSH
```bash
# Conectarse a M1ni
ssh m1ni
ssh m1
ssh twin

# Ejecutar comando remoto
ssh m1ni "docker ps"
ssh m1ni "cd sephirot-server && docker-compose logs"
```

### Base de Datos
```bash
# Desde M2, conectarse a PostgreSQL en M1ni
psql -h m1ni -U sephirot -d agent_platform

# O desde aplicación
DATABASE_URL="postgresql://sephirot:sephirot_pass@m1ni:5432/agent_platform"
```

### Redis
```bash
# Desde M2
redis-cli -h m1ni -p 6379

# O desde aplicación
REDIS_URL="redis://m1ni:6379"
```

### Qdrant
```bash
# Desde M2
curl http://m1ni:6333/health

# O desde aplicación
QDRANT_URL="http://m1ni:6333"
```

---

## 🔄 GESTIÓN DE SERVICIOS

### Verificar servicios
```bash
~/check_twin_services.sh
```

### Ver logs
```bash
cd ~/sephirot-server
docker-compose logs -f
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f qdrant
```

### Reiniciar servicios
```bash
cd ~/sephirot-server
docker-compose restart
docker-compose restart postgres
```

### Detener servicios
```bash
cd ~/sephirot-server
docker-compose down
```

### Iniciar servicios
```bash
cd ~/sephirot-server
docker-compose up -d
```

---

## 🤖 OPENCLAW TELEGRAM BOT

**Bot**: @M1nimacbot
**Estado**: ✅ Corriendo
**Proceso**: PID 69069

### Comandos del Bot
- `/start` - Iniciar bot
- `/help` - Ayuda
- `/chat <msg>` - Chatear con AI
- `/model` - Cambiar modelo
- `/clear` - Limpiar historial

### Gestión del Bot
```bash
# Verificar estado
ps aux | grep openclaw_bot

# Ver logs
tail -f ~/openclaw-telegram-bot/bot.log

# Reiniciar
pkill -f openclaw_bot.py
cd ~/openclaw-telegram-bot
python3 openclaw_bot.py
```

---

## 📁 ARCHIVOS DE CONFIGURACIÓN

### Mesh
- `~/.ssh/authorized_keys` - Claves SSH públicas
- `~/.ssh/config` - Configuración SSH
- `~/sephirot-server/docker-compose.yml` - Servicios
- `~/check_twin_services.sh` - Verificación

### Telegram Bot
- `~/openclaw-telegram-bot/openclaw_bot.py` - Código del bot
- `~/openclaw-telegram-bot/.env` - Variables (token)
- `~/openclaw-telegram-bot/bot.log` - Logs

---

## 🎯 PRÓXIMOS PASOS

1. **Probar conexión desde M2**
   ```bash
   ssh m1ni "hostname && whoami"
   ```

2. **Probar bot en Telegram**
   - Abre @M1nimacbot
   - Envía `/start`

3. **Conectar app al servidor**
   - Configurar app para usar DB en M1ni
   - Usar Redis en M1ni
   - Usar Qdrant en M1ni

4. **Auto-inicio del bot**
   - Crear launchd para bot
   - Crear launchd para servicios

---

## 🔥 TROUBLESHOOTING

### SSH no conecta
```bash
# Verificar SSH habilitado en M1ni
sudo systemsetup -getremotelogin

# Verificar clave
cat ~/.ssh/authorized_keys

# Ver config SSH
cat ~/.ssh/config
```

### Servicios no responden
```bash
# Ver contenedores
cd ~/sephirot-server
docker-compose ps

# Reiniciar
docker-compose restart
```

### Bot no responde
```bash
# Ver logs
tail -f ~/openclaw-telegram-bot/bot.log

# Reiniciar
pkill -f openclaw_bot.py
cd ~/openclaw-telegram-bot
python3 openclaw_bot.py &
```

---

**🚀 Mesh M2 ↔ M1ni listo para producción!**

**Última actualización**: 2026-02-16
