import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";
import { env } from "@/lib/utils/env";

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

export async function closeCheckpointer(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    checkpointer = null;
  }
}
