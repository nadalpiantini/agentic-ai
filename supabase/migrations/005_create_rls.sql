-- Enable Row Level Security (RLS) on all tables
-- RLS ensures users can only access their own data

-- Enable RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_writes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Threads policies
-- Users can read their own threads
CREATE POLICY "Users can read own threads"
ON threads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own threads
CREATE POLICY "Users can insert own threads"
ON threads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own threads
CREATE POLICY "Users can update own threads"
ON threads
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own threads
CREATE POLICY "Users can delete own threads"
ON threads
FOR DELETE
USING (auth.uid() = user_id);

-- Messages policies
-- Users can read messages from their own threads
CREATE POLICY "Users can read messages from own threads"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = messages.thread_id
    AND threads.user_id = auth.uid()
  )
);

-- Users can insert messages into their own threads
CREATE POLICY "Users can insert messages into own threads"
ON messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = messages.thread_id
    AND threads.user_id = auth.uid()
  )
);

-- Checkpoints policies
-- Users can read their own checkpoints
CREATE POLICY "Users can read own checkpoints"
ON checkpoints
FOR SELECT
USING (auth.uid()::text = thread_id::text);

-- Users can insert their own checkpoints
CREATE POLICY "Users can insert own checkpoints"
ON checkpoints
FOR INSERT
WITH CHECK (auth.uid()::text = thread_id::text);

-- Users can update their own checkpoints
CREATE POLICY "Users can update own checkpoints"
ON checkpoints
FOR UPDATE
USING (auth.uid()::text = thread_id::text);

-- Users can delete their own checkpoints
CREATE POLICY "Users can delete own checkpoints"
ON checkpoints
FOR DELETE
USING (auth.uid()::text = thread_id::text);

-- Checkpoint writes policies
-- Users can manage their own checkpoint writes
CREATE POLICY "Users can manage own checkpoint writes"
ON checkpoint_writes
FOR ALL
USING (auth.uid()::text = thread_id::text)
WITH CHECK (auth.uid()::text = thread_id::text);

-- Documents policies
-- For now, allow all authenticated users to read documents
-- You may want to restrict this further based on your use case
CREATE POLICY "Authenticated users can read documents"
ON documents
FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert documents (typically done server-side)
CREATE POLICY "Service role can insert documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add helpful comments
COMMENT ON COLUMN threads.user_id IS 'References auth.uid() from Supabase Auth';
COMMENT ON TABLE threads IS 'RLS enabled: users can only access their own threads';
COMMENT ON TABLE messages IS 'RLS enabled: users can only access messages from their threads';
COMMENT ON TABLE checkpoints IS 'RLS enabled: users can only access their own checkpoints';
