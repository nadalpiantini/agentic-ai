import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

let vectorStore: SupabaseVectorStore | null = null;

// Explicit environment variables for Vercel Edge Runtime compatibility
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export function getVectorStore(): SupabaseVectorStore | null {
  if (vectorStore) return vectorStore;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
    return null;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const embeddings = new OpenAIEmbeddings({ apiKey: OPENAI_API_KEY });

  vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });

  return vectorStore;
}

export async function addDocuments(
  documents: { pageContent: string; metadata?: Record<string, unknown> }[]
): Promise<void> {
  const store = getVectorStore();
  if (!store) {
    throw new Error(
      "Vector store not configured. Ensure OPENAI_API_KEY is set."
    );
  }
  const docs = documents.map((d) => ({
    pageContent: d.pageContent,
    metadata: d.metadata ?? {},
  }));
  await store.addDocuments(docs);
}
