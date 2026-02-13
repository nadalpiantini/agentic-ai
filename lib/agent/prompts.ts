/**
 * Multi-language system prompts for agentic AI
 * Supports: English (default), Spanish (ES), Chinese (ZH), French (FR)
 */

export type SupportedLanguage = "en" | "es" | "zh" | "fr";

export interface SystemPromptConfig {
  language: SupportedLanguage;
}

/**
 * Language detection from user message
 * Uses simple keyword detection for common patterns
 */
export function detectLanguage(message: string): SupportedLanguage {
  const lowerMessage = message.toLowerCase();

  // Spanish detection
  const spanishPatterns = [
    /\b(hola|buenos|buenas|gracias|por favor|español|cómo|qué|tal|estas|estas)\b/i,
    /[¿¡]/, // Spanish inverted punctuation
    /[áéíóúñ]/i, // Accented characters
  ];
  if (spanishPatterns.some((pattern) => pattern.test(message))) {
    return "es";
  }

  // Chinese detection
  const chinesePatterns = [/[\u4e00-\u9fa5]/]; // Chinese character range
  if (chinesePatterns.some((pattern) => pattern.test(message))) {
    return "zh";
  }

  // French detection
  const frenchPatterns = [
    /\b(bonjour|bonsoir|merci|s'il vous plaît|français|comment ça va|au revoir)\b/i,
    /\b(bien|tout)\b.*\b(pour|avec|dans|sur)\b/i, // French sentence patterns
  ];
  if (frenchPatterns.some((pattern) => pattern.test(message))) {
    return "fr";
  }

  // Default to English
  return "en";
}

/**
 * System prompts by language
 */
const SYSTEM_PROMPTS: Record<SupportedLanguage, string> = {
  en: `You are a helpful AI assistant with access to various tools. You can help users with:

- Answering questions and providing information
- Analyzing data and documents
- Performing web searches and fetches
- Database operations
- File system operations

When using tools, be precise and provide clear explanations of your actions.
Always consider the user's context and provide relevant, accurate information.`,

  es: `Eres un asistente de IA útil con acceso a varias herramientas. Puedes ayudar a los usuarios con:

- Responder preguntas y proporcionar información
- Analizar datos y documentos
- Realizar búsquedas web y fetches
- Operaciones de base de datos
- Operaciones del sistema de archivos

Al usar herramientas, sé preciso y proporciona explicaciones claras de tus acciones.
Considera siempre el contexto del usuario y proporciona información relevante y exacta.`,

  zh: `你是一个有用的AI助手，可以访问各种工具。你可以帮助用户：

- 回答问题和提供信息
- 分析数据和文档
- 进行网络搜索和获取
- 数据库操作
- 文件系统操作

使用工具时，要精确并提供清晰的行动说明。
始终考虑用户的背景，提供相关、准确的信息。`,

  fr: `Vous êtes un assistant IA utile avec accès à divers outils. Vous pouvez aider les utilisateurs avec :

- Répondre aux questions et fournir des informations
- Analyser des données et des documents
- Effectuer des recherches web et des récupérations
- Opérations de base de données
- Opérations du système de fichiers

Lors de l'utilisation d'outils, soyez précis et fournissez des explications claires de vos actions.
Considérez toujours le contexte de l'utilisateur et fournissez des informations pertinentes et exactes.`,
};

/**
 * Get system prompt for a specific language
 */
export function getSystemPrompt(language: SupportedLanguage): string {
  return SYSTEM_PROMPTS[language];
}

/**
 * Get system prompt configuration from state
 */
export function getSystemPromptConfig(
  lastMessage?: string
): SystemPromptConfig {
  if (!lastMessage) {
    return { language: "en" };
  }

  return {
    language: detectLanguage(lastMessage),
  };
}
