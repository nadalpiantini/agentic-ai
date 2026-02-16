#!/usr/bin/env python3
"""
OpenClaw Telegram Bot
Bot de Telegram integrado con OpenClaw AI
"""

import os
import sys
import logging
from datetime import datetime
from typing import Optional

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
    ConversationHandler,
)
from dotenv import load_dotenv
from openai import OpenAI

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler('openclaw_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuración OpenAI (Ollama Cloud)
OPENCLAW_CLIENT = OpenAI(
    api_key=os.getenv('OPENCLAW_API_KEY'),
    base_url=os.getenv('OPENCLAW_BASE_URL', 'https://ollama.com/v1')
)

DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'deepseek-v3.2')

# Historial de conversaciones (simple, en producción usar DB)
conversations = {}

# ============================================================
# COMANDOS DEL BOT
# ============================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Comando /start - Inicia el bot"""
    user = update.effective_user

    welcome_message = f"""
🤖 **OpenClaw AI Bot**

¡Hola {user.first_name}! Soy tu asistente AI impulsado por OpenClaw.

📝 **Comandos disponibles:**
/start - Muestra este mensaje
/chat - Chatear con la AI
/model - Cambiar modelo
/history - Ver historial
/clear - Limpiar conversación
/help - Mostrar ayuda

💬 Escribe cualquier mensaje para chatear conmigo.

🔧 **Modelo actual:** `{DEFAULT_MODEL}`
"""

    await update.message.reply_text(
        welcome_message,
        parse_mode='Markdown'
    )

    # Inicializar historial para este usuario
    user_id = update.effective_user.id
    if user_id not in conversations:
        conversations[user_id] = []

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Comando /help - Muestra ayuda"""
    help_text = """
📖 **Ayuda de OpenClaw Bot**

**Comandos básicos:**
/start - Iniciar el bot
/chat <mensaje> - Enviar mensaje a la AI
/model - Cambiar modelo AI
/clear - Limpiar historial

**Modelos disponibles:**
• `deepseek-v3.2` - Modelo principal (recomendado)
• `qwen3-coder:480b` - Programación
• `kimi-k2.5` - Contexto largo
• `mistral-large-3:675b` - General

**Tips:**
• Puedes enviar mensajes直接 sin comando
• El historial se mantiene por sesión
• Usa /clear para reiniciar conversación

🔗 *Powered by OpenClaw + Ollama Cloud*
"""
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def model_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Comando /model - Seleccionar modelo"""
    keyboard = [
        [
            InlineKeyboardButton("DeepSeek V3.2", callback_data='model_deepseek-v3.2'),
            InlineKeyboardButton("Qwen3 Coder", callback_data='model_qwen3-coder:480b'),
        ],
        [
            InlineKeyboardButton("Kimi K2.5", callback_data='model_kimi-k2.5'),
            InlineKeyboardButton("Mistral Large", callback_data='model_mistral-large-3:675b'),
        ],
    ]

    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "🔧 **Selecciona un modelo AI:**",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def clear_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Comando /clear - Limpiar historial"""
    user_id = update.effective_user.id

    if user_id in conversations:
        conversations[user_id] = []

    await update.message.reply_text(
        "🗑️ **Historial limpiado**\n\nConversación reiniciada.",
        parse_mode='Markdown'
    )

async def history_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Comando /history - Ver historial"""
    user_id = update.effective_user.id

    if user_id not in conversations or not conversations[user_id]:
        await update.message.reply_text("📭 No hay historial aún.")
        return

    history = conversations[user_id]
    msg_count = len(history)
    last_msg = history[-1]['content'][:100] + "..." if len(history[-1]['content']) > 100 else history[-1]['content']

    await update.message.reply_text(
        f"📚 **Historial de conversación**\n\n"
        f"• Mensajes: {msg_count}\n"
        f"• Último mensaje: {last_msg}\n\n"
        f"Usa /clear para limpiar.",
        parse_mode='Markdown'
    )

async def chat_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja mensajes de chat"""
    user_id = update.effective_user.id
    user_message = update.message.text

    # Verificar si es comando
    if user_message.startswith('/'):
        return

    # Mostrar "escribiendo..."
    await update.message.chat.send_action('typing')

    try:
        # Obtener historial
        if user_id not in conversations:
            conversations[user_id] = []

        # Agregar mensaje del usuario
        conversations[user_id].append({
            "role": "user",
            "content": user_message
        })

        # Llamar a OpenClaw API
        logger.info(f"User {user_id} sending message to {DEFAULT_MODEL}")

        response = OPENCLAW_CLIENT.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=conversations[user_id],
            max_tokens=2048,
            temperature=0.7,
        )

        # Extraer respuesta
        ai_response = response.choices[0].message.content

        # Agregar respuesta al historial
        conversations[user_id].append({
            "role": "assistant",
            "content": ai_response
        })

        # Enviar respuesta
        await update.message.reply_text(ai_response)

        logger.info(f"Response sent to user {user_id}")

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        await update.message.reply_text(
            f"❌ **Error:** {str(e)}\n\nIntenta nuevamente o usa /help",
            parse_mode='Markdown'
        )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja callbacks de botones inline"""
    query = update.callback_query
    await query.answer()

    model = query.data.replace('model_', '')

    # Cambiar modelo global
    global DEFAULT_MODEL
    DEFAULT_MODEL = model

    await query.edit_message_text(
        f"✅ **Modelo cambiado a:** `{model}`",
        parse_mode='Markdown'
    )

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja errores"""
    logger.error(f"Update {update} caused error {context.error}")

# ============================================================
# MAIN
# ============================================================

def main() -> None:
    """Inicia el bot"""
    # Verificar token
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token or token == 'your_token_here':
        logger.error("❌ TELEGRAM_BOT_TOKEN no configurado")
        print("\n" + "="*60)
        print("🔑 CONFIGURA TU TOKEN DE TELEGRAM")
        print("="*60)
        print("\n1. Abre Telegram y busca @BotFather")
        print("2. Envía /newbot y sigue las instrucciones")
        print("3. Copia el token que te da BotFather")
        print("4. Crea archivo .env con:")
        print("   TELEGRAM_BOT_TOKEN=tu_token_aqui")
        print("\n" + "="*60 + "\n")
        sys.exit(1)

    # Crear aplicación
    application = Application.builder().token(token).build()

    # Agregar handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("model", model_command))
    application.add_handler(CommandHandler("clear", clear_command))
    application.add_handler(CommandHandler("history", history_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, chat_message))
    application.add_error_handler(error_handler)

    # Iniciar bot
    logger.info("🤖 OpenClaw Telegram Bot iniciado!")
    logger.info(f"📧 Modelo: {DEFAULT_MODEL}")

    print("\n" + "="*60)
    print("🤖 OPENCLAW TELEGRAM BOT")
    print("="*60)
    print(f"✅ Bot iniciado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔧 Modelo: {DEFAULT_MODEL}")
    print("📱 Esperando mensajes...\n")

    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
