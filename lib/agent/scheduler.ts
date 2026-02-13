/**
 * Autonomous Scheduler
 * Enables agents to schedule their own check-ins and tasks
 */

import { Pool } from "pg";
import { env } from "@/lib/utils/env";

export interface ScheduleTask {
  id: string;
  agentId: string;
  threadId: string;
  taskType: "check_in" | "follow_up" | "reminder" | "autonomous";
  scheduledFor: Date;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  payload: any;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  lastError?: string;
}

export interface ScheduleOptions {
  scheduledFor: Date | string; // ISO string or Date object
  taskType: ScheduleTask["taskType"];
  payload?: any;
  maxRetries?: number;
}

/**
 * Autonomous Scheduler
 * Manages time-based and event-based agent scheduling
 */
export class AutonomousScheduler {
  private pool: Pool;
  private processingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(databaseUrl: string = env.DATABASE_URL) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  /**
   * Initialize scheduler tables
   */
  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        task_type TEXT NOT NULL CHECK (task_type IN ('check_in', 'follow_up', 'reminder', 'autonomous')),
        scheduled_for TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        payload JSONB,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_error TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_for ON scheduled_tasks(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_thread_id ON scheduled_tasks(thread_id);
    `);
  }

  /**
   * Schedule a new task for an agent
   */
  async schedule(
    agentId: string,
    threadId: string,
    options: ScheduleOptions
  ): Promise<string> {
    const scheduledFor =
      typeof options.scheduledFor === "string"
        ? new Date(options.scheduledFor)
        : options.scheduledFor;

    const result = await this.pool.query(
      `INSERT INTO scheduled_tasks
       (agent_id, thread_id, task_type, scheduled_for, payload, max_retries)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        agentId,
        threadId,
        options.taskType,
        scheduledFor,
        JSON.stringify(options.payload || {}),
        options.maxRetries || 3,
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Get pending tasks that are due
   */
  async getDueTasks(limit = 10): Promise<ScheduleTask[]> {
    const result = await this.pool.query(
      `SELECT * FROM scheduled_tasks
       WHERE status = 'pending'
         AND scheduled_for <= NOW()
       ORDER BY scheduled_for ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapRowToTask);
  }

  /**
   * Update task status
   */
  async updateStatus(
    taskId: string,
    status: ScheduleTask["status"],
    error?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE scheduled_tasks
       SET status = $1,
           updated_at = NOW(),
           last_error = $2
       WHERE id = $3`,
      [status, error || null, taskId]
    );
  }

  /**
   * Increment retry count for failed task
   */
  async incrementRetry(taskId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE scheduled_tasks
       SET retry_count = retry_count + 1,
           updated_at = NOW(),
           status = CASE
             WHEN retry_count + 1 >= max_retries THEN 'failed'
             ELSE 'pending'
           END
       WHERE id = $1
       RETURNING retry_count, max_retries, status`,
      [taskId]
    );

    const row = result.rows[0];
    return row.status !== "failed";
  }

  /**
   * Get tasks for a specific thread
   */
  async getTasksForThread(threadId: string): Promise<ScheduleTask[]> {
    const result = await this.pool.query(
      `SELECT * FROM scheduled_tasks
       WHERE thread_id = $1
       ORDER BY scheduled_for DESC`,
      [threadId]
    );

    return result.rows.map(this.mapRowToTask);
  }

  /**
   * Cancel a scheduled task
   */
  async cancel(taskId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE scheduled_tasks
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [taskId]
    );

    return result.rows.length > 0;
  }

  /**
   * Start the processing loop
   */
  async start(intervalMs = 5000): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Ensure tables exist
    await this.initialize();

    this.processingInterval = setInterval(async () => {
      await this.processDueTasks();
    }, intervalMs);
  }

  /**
   * Stop the processing loop
   */
  async stop(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * Process all due tasks
   * This is called automatically by the processing loop
   */
  private async processDueTasks(): Promise<void> {
    const tasks = await this.getDueTasks(10);

    for (const task of tasks) {
      await this.updateStatus(task.id, "running");

      try {
        // Execute the task based on its type
        await this.executeTask(task);

        await this.updateStatus(task.id, "completed");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const canRetry = await this.incrementRetry(task.id);

        if (!canRetry) {
          await this.updateStatus(task.id, "failed", errorMessage);
        }
      }
    }
  }

  /**
   * Execute a scheduled task
   * Override this method in subclasses for custom behavior
   */
  protected async executeTask(task: ScheduleTask): Promise<void> {
    // Default implementation just logs
    console.log(`Executing task ${task.id} of type ${task.taskType}`);

    // In a real implementation, this would:
    // 1. Load the agent state
    // 2. Execute the task
    // 3. Store results
    // 4. Trigger follow-up actions if needed
  }

  /**
   * Clean up old completed tasks
   */
  async cleanup(olderThanDays = 7): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM scheduled_tasks
       WHERE status IN ('completed', 'failed', 'cancelled')
         AND updated_at < NOW() - INTERVAL '1 day' * $1`,
      [olderThanDays]
    );

    return result.rowCount || 0;
  }

  /**
   * Get scheduler statistics
   */
  async getStats(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const result = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'running') AS running,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
      FROM scheduled_tasks
    `);

    return result.rows[0];
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.stop();
    await this.pool.end();
  }

  /**
   * Map database row to ScheduleTask object
   */
  private mapRowToTask(row: any): ScheduleTask {
    return {
      id: row.id,
      agentId: row.agent_id,
      threadId: row.thread_id,
      taskType: row.task_type,
      scheduledFor: new Date(row.scheduled_for),
      status: row.status,
      payload: row.payload,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastError: row.last_error,
    };
  }
}

// Singleton instance
let globalScheduler: AutonomousScheduler | undefined;

export function getGlobalScheduler(): AutonomousScheduler {
  if (!globalScheduler) {
    globalScheduler = new AutonomousScheduler();
  }
  return globalScheduler;
}

export async function resetGlobalScheduler(): Promise<void> {
  if (globalScheduler) {
    await globalScheduler.close();
    globalScheduler = undefined;
  }
}
