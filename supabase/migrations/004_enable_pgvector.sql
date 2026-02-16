-- Enable pgvector extension for vector similarity search
-- This is required for RAG (Retrieval Augmented Generation)

-- Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table for RAG
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
-- Uses IVFFlat indexing method for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_documents_embedding
ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_documents_metadata
ON documents
USING GIN (metadata);

-- Add comments
COMMENT ON TABLE documents IS 'Document chunks with embeddings for RAG';
COMMENT ON COLUMN documents.embedding IS 'OpenAI text-embedding-ada-002 embedding (1536 dimensions)';
COMMENT ON COLUMN documents.metadata IS 'Document metadata (source, chunk_id, etc.)';
