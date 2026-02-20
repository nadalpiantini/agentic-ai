-- NRS Dynamic Targets
-- Supports unlimited, ever-growing watchlist for Squadron Intel Feed
-- Seeds come from YAML, discovery adds CT logs, GitHub search, entity expansion

CREATE TABLE IF NOT EXISTS nrs_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL,              -- 'domain' | 'repo' | 'api'
  identifier TEXT NOT NULL UNIQUE,        -- 'example.com' | 'org/repo'
  category TEXT DEFAULT 'discovered',     -- grouping label
  note TEXT,                              -- human note about why this target matters
  source TEXT NOT NULL,                   -- 'seed' | 'ct_logs' | 'github_search' | 'expansion' | 'manual'
  discovered_at TIMESTAMPTZ DEFAULT now(),
  last_scanned_at TIMESTAMPTZ,
  scan_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb      -- arbitrary extra data (registrar, nameservers, etc.)
);

CREATE INDEX IF NOT EXISTS idx_nrs_targets_type ON nrs_targets(target_type);
CREATE INDEX IF NOT EXISTS idx_nrs_targets_active ON nrs_targets(active);
CREATE INDEX IF NOT EXISTS idx_nrs_targets_source ON nrs_targets(source);
CREATE INDEX IF NOT EXISTS idx_nrs_targets_identifier ON nrs_targets(identifier);

-- RLS: allow service role full access (NRS backend uses service key)
ALTER TABLE nrs_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on nrs_targets"
  ON nrs_targets
  FOR ALL
  USING (true)
  WITH CHECK (true);
