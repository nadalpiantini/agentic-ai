import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";
import { env } from "@/lib/utils/env";
import { getGlobalContextManager } from "./context";

let checkpointer: PostgresSaver | null = null;
let pool: pg.Pool | null = null;

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointer) return checkpointer;

  pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  checkpointer = PostgresSaver.fromConnString(env.DATABASE_URL);
  await checkpointer.setup();

  return checkpointer;
}

/**
 * Save context to context stack manager
 * Called after checkpoints are saved
 */
export async function saveContextToStack(
  threadId: string,
  messages: any[],
  metadata?: { language?: string; agentType?: string }
): Promise<string> {
  const contextManager = getGlobalContextManager();
  return contextManager.push(threadId, messages, {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...metadata,
  });
}

/**
 * Load context from context stack manager
 * Called before checkpoints are loaded
 */
export async function loadContextFromStack(threadId: string): Promise<any[]> {
  const contextManager = getGlobalContextManager();
  return contextManager.getStack(threadId);
}

export async function closeCheckpointer(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    checkpointer = null;
  }
}

