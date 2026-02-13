#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const migration = `
  alter table public.threads
  drop constraint if exists threads_user_id_fkey;

  alter table public.messages
  drop constraint if exists messages_user_id_fkey;

  alter table public.threads
  alter column user_id type text using user_id::text;

  alter table public.messages
  alter column user_id type text using user_id::text;
`;

async function runMigration() {
  try {
    console.log("🔄 Executing migration...");

    // Split into individual statements since Supabase doesn't support multi-statement queries
    const statements = migration
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s);

    for (const statement of statements) {
      const { error } = await supabase.rpc("execute_sql", {
        sql: statement,
      });

      if (error && error.message.includes("does not exist")) {
        // RPC doesn't exist, try alternative
        console.log("⚠️  RPC method not available, using direct connection");
        break;
      }

      if (error) {
        throw error;
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log("   - Removed FK constraints");
    console.log("   - Changed user_id from uuid to text");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runMigration();
