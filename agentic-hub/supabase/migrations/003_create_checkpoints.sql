-- Create LangGraph checkpoint tables
-- These tables store agent execution state for resumable workflows

-- Main checkpoint storage table
CREATE TABLE IF NOT EXISTS checkpoints (
  thread_id UUID NOT NULL,
  checkpoint_id TEXT NOT NULL,
  checkpoint JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (thread_id, checkpoint_id)
);

-- Checkpoint writes table for pending writes
CREATE TABLE IF NOT EXISTS checkpoint_writes (
  thread_id UUID NOT NULL,
  checkpoint_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (thread_id, checkpoint_id, task_id, idx)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checkpoints_thread_id ON checkpoints(thread_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_created_at ON checkpoints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkpoint_writes_thread_id ON checkpoint_writes(thread_id);

-- Add comments
COMMENT ON TABLE checkpoints IS 'LangGraph agent execution state checkpoints';
COMMENT ON TABLE checkpoint_writes IS 'Pending writes for checkpoint commits';
COMMENT ON COLUMN checkpoints.checkpoint IS 'Serialized agent state';
COMMENT ON COLUMN checkpoints.metadata IS 'Checkpoint metadata (step, source, etc.)';
