import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Returns system health status for monitoring and load balancers.
 * Checks:
 * - API status
 * - Database connectivity
 * - Environment configuration
 */
export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: "unknown",
      env: "unknown",
    },
  };

  // Check database connectivity
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      health.checks.database = "error";
      health.checks.env = "error";
      return NextResponse.json(health, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query to check connection
    const { error } = await supabase.from("threads").select("id").limit(1);

    if (error) {
      health.checks.database = "error";
      health.status = "degraded";
      return NextResponse.json(health, { status: 503 });
    }

    health.checks.database = "ok";
  } catch (error) {
    health.checks.database = "error";
    health.status = "degraded";
    return NextResponse.json(health, { status: 503 });
  }

  // Check environment variables
  const requiredEnvs = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
  ];

  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

  if (missingEnvs.length > 0) {
    health.checks.env = "error";
    health.status = "degraded";
    health.missing = missingEnvs;
    return NextResponse.json(health, { status: 503 });
  }

  health.checks.env = "ok";

  // Check if at least one LLM API key is configured
  const hasLLM =
    !!process.env.ANTHROPIC_API_KEY ||
    !!process.env.DEEPSEEK_API_KEY ||
    !!process.env.OLLAMA_BASE_URL;

  if (!hasLLM) {
    health.checks.llm = "error";
    health.status = "degraded";
  } else {
    health.checks.llm = "ok";
  }

  // Return 200 if all checks pass
  return NextResponse.json(health, { status: 200 });
}
