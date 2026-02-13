/**
 * Specialized Agent Types
 * Each agent type is optimized for specific task categories
 */

export type AgentType = "chat" | "code" | "search";

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  defaultModel: "claude" | "deepseek" | "ollama" | "zai";
  keywords: string[];
  capabilities: string[];
}

/**
 * Agent definitions with their specializations
 */
export const AGENTS: Record<AgentType, AgentConfig> = {
  chat: {
    type: "chat",
    name: "Chat Agent",
    description: "General conversation and Q&A",
    defaultModel: "zai",
    keywords: [
      "hello", "hi", "hey", "help", "explain", "tell me",
      "what is", "how do", "can you", "please", "thanks",
      "hola", "buenos", "gracias", "ayuda", "explica",
      "你好", "您好", "谢谢", "请问",
    ],
    capabilities: [
      "general conversation",
      "answering questions",
      "providing explanations",
      "basic assistance",
    ],
  },

  code: {
    type: "code",
    name: "Code Agent",
    description: "Programming and technical tasks",
    defaultModel: "claude",
    keywords: [
      "code", "coding", "programming", "function", "class",
      "debug", "fix bug", "implement", "refactor", "algorithm",
      "api", "database", "sql", "test", "deploy",
      "código", "programar", "función", "depurar",
      "代码", "编程", "函数", "调试",
      "code", "analyz", "reason", "syntax", "error",
    ],
    capabilities: [
      "writing code",
      "debugging",
      "code review",
      "technical explanations",
      "api design",
      "database queries",
    ],
  },

  search: {
    type: "search",
    name: "Search Agent",
    description: "Web browsing and information retrieval",
    defaultModel: "deepseek",
    keywords: [
      "search", "find", "look up", "google", "web",
      "browse", "fetch", "url", "http", "website",
      "recent", "latest", "news", "information",
      "buscar", "buscar", "encontrar", "sitio web",
      "搜索", "查找", "网页", "最新",
      "translate", "summarize", "bulk", "fetch",
    ],
    capabilities: [
      "web searches",
      "fetching urls",
      "information retrieval",
      "content summarization",
      "translation",
    ],
  },
};

/**
 * Detect agent type from message content
 */
export function detectAgentType(message: string): AgentType {
  const lowerMessage = message.toLowerCase();

  // Score each agent type based on keyword matches
  const scores: Record<AgentType, number> = {
    chat: 0,
    code: 0,
    search: 0,
  };

  for (const [agentType, config] of Object.entries(AGENTS)) {
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        scores[agentType as AgentType]++;
      }
    }
  }

  // Return agent with highest score, default to chat
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    return "chat"; // Default to chat agent
  }

  // Find agent with max score (prioritize code > search > chat on ties)
  if (scores.code >= scores.search && scores.code >= scores.chat) {
    return "code";
  }
  if (scores.search >= scores.chat) {
    return "search";
  }
  return "chat";
}

/**
 * Get agent configuration
 */
export function getAgentConfig(type: AgentType): AgentConfig {
  return AGENTS[type];
}

/**
 * Get optimal model for agent type
 * Can be overridden by user preferences or constraints
 */
export function getModelForAgent(
  agentType: AgentType,
  constraints?: {
    privacy?: boolean; // Force local model
    cost?: boolean; // Force cheaper model
    quality?: boolean; // Force best model
  }
): "claude" | "deepseek" | "ollama" | "zai" {
  const agent = AGENTS[agentType];

  // Apply constraints
  if (constraints?.privacy) {
    return "ollama"; // Force local
  }
  if (constraints?.cost) {
    return "deepseek"; // Cheaper
  }
  if (constraints?.quality) {
    return "claude"; // Best quality
  }

  // Default to agent's preferred model
  return agent.defaultModel;
}
