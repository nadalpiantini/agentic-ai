import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

let vectorStore: SupabaseVectorStore | null = null;

export function getVectorStore(): SupabaseVectorStore | null {
  if (vectorStore) return vectorStore;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !openaiKey) {
    return null;
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const embeddings = new OpenAIEmbeddings({ apiKey: openaiKey });

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
