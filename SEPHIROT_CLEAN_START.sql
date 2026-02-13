-- ============================================================================
-- 🚀 SEPHIROT.XYZ - CLEAN START (DROP & RECREATE)
-- ============================================================================

-- Drop everything and start fresh
DROP VIEW IF EXISTS api_health_summary CASCADE;
DROP VIEW IF EXISTS message_stats CASCADE;
DROP VIEW IF EXISTS thread_stats CASCADE;
DROP TABLE IF EXISTS "metrics" CASCADE;
DROP TABLE IF EXISTS "database_health" CASCADE;
DROP TABLE IF EXISTS "rate_limits" CASCADE;
DROP TABLE IF EXISTS "api_requests" CASCADE;
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;

-- ============================================================================
-- Create all tables fresh
-- ============================================================================

CREATE TABLE "messages" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "activity_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT DEFAULT 'success',
  error_code TEXT,
  error_message TEXT,
  duration_ms INT,
  request_id TEXT UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "api_requests" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE NOT NULL,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  user_id TEXT,
  status_code INT,
  response_time_ms INT,
  error_code TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "rate_limits" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_id TEXT,
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  window_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 hour')
);

CREATE TABLE "database_health" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "metrics" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- Create indexes
-- ============================================================================

CREATE INDEX idx_threads_user_id ON "threads"(user_id);
CREATE INDEX idx_threads_created_at ON "threads"(created_at DESC);
CREATE INDEX idx_messages_thread_id ON "messages"(thread_id);
CREATE INDEX idx_messages_user_id ON "messages"(user_id);
CREATE INDEX idx_messages_created_at ON "messages"(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON "activity_logs"(user_id);
CREATE INDEX idx_activity_logs_created_at ON "activity_logs"(created_at DESC);
CREATE INDEX idx_api_requests_created_at ON "api_requests"(created_at DESC);
CREATE INDEX idx_api_requests_user_id ON "api_requests"(user_id);
CREATE INDEX idx_rate_limits_ip ON "rate_limits"(ip_address);
CREATE INDEX idx_database_health_created ON "database_health"(created_at DESC);
CREATE INDEX idx_metrics_created ON "metrics"(created_at DESC);

-- ============================================================================
-- Create views
-- ============================================================================

CREATE VIEW thread_stats AS
SELECT
  user_id,
  COUNT(*) as total_threads,
  MAX(created_at) as last_thread_created,
  MAX(updated_at) as last_activity
FROM "threads"
GROUP BY user_id;

CREATE VIEW message_stats AS
SELECT
  thread_id,
  COUNT(*) as total_messages,
  MAX(created_at) as last_message_time
FROM "messages"
GROUP BY thread_id;

CREATE VIEW api_health_summary AS
SELECT
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful,
  COUNT(CASE WHEN status_code >= 500 THEN 1 END) as errors,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
  MAX(created_at) as last_request
FROM "api_requests"
WHERE created_at > now() - INTERVAL '1 hour';

-- ============================================================================
-- Optimize
-- ============================================================================

ANALYZE "threads";
ANALYZE "messages";
ANALYZE "activity_logs";
ANALYZE "api_requests";
ANALYZE "rate_limits";
ANALYZE "database_health";
ANALYZE "metrics";

-- ============================================================================
-- SUCCESS
-- ============================================================================

SELECT '✅ SEPHIROT SETUP COMPLETE - CLEAN START!' as status;
