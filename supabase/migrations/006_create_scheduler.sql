-- Migration 006: Create scheduled_tasks table for Autonomous Scheduler
-- Sprint 4: Autonomous Scheduler

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_for ON scheduled_tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_thread_id ON scheduled_tasks(thread_id);

-- Comments for documentation
COMMENT ON TABLE scheduled_tasks IS 'Autonomous agent task scheduling for time-based and event-based agent actions';
COMMENT ON COLUMN scheduled_tasks.id IS 'Unique task identifier';
COMMENT ON COLUMN scheduled_tasks.agent_id IS 'Agent that should execute this task';
COMMENT ON COLUMN scheduled_tasks.thread_id IS 'Thread context for task execution';
COMMENT ON COLUMN scheduled_tasks.task_type IS 'Type of scheduled task (check_in, follow_up, reminder, autonomous)';
COMMENT ON COLUMN scheduled_tasks.scheduled_for IS 'When the task should be executed';
COMMENT ON COLUMN scheduled_tasks.status IS 'Current task status (pending, running, completed, failed, cancelled)';
COMMENT ON COLUMN scheduled_tasks.payload IS 'Task-specific data (JSON)';
COMMENT ON COLUMN scheduled_tasks.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN scheduled_tasks.max_retries IS 'Maximum retry attempts before marking as failed';
COMMENT ON COLUMN scheduled_tasks.last_error IS 'Last error message if task failed';
