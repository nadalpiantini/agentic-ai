import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  // LLM Providers
  ANTHROPIC_API_KEY: z.string().min(1),
  DEEPSEEK_API_KEY: z.string().min(1),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),

  // Agent Config
  DEFAULT_MODEL: z
    .enum(["claude", "deepseek", "ollama"])
    .default("claude"),
  MAX_LLM_CALLS: z.coerce.number().int().positive().default(25),
  MAX_RECURSION_DEPTH: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof envSchema>;

const isBuildTime =
  process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL;

let _env: Env | null = null;

const buildDefaults: Env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder",
  SUPABASE_SERVICE_ROLE_KEY: "placeholder",
  DATABASE_URL: "postgres://placeholder",
  ANTHROPIC_API_KEY: "placeholder",
  DEEPSEEK_API_KEY: "placeholder",
  OLLAMA_BASE_URL: "http://localhost:11434",
  DEFAULT_MODEL: "claude",
  MAX_LLM_CALLS: 25,
  MAX_RECURSION_DEPTH: 10,
};

function validateEnv(): Env {
  if (isBuildTime) {
    return buildDefaults;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment variables:\n${formatted}\n\nCheck your .env file against .env.example.`
    );
  }

  return parsed.data;
}

export const env: Env = new Proxy({} as Env, {
  get(_, prop: string) {
    if (!_env) {
      _env = validateEnv();
    }
    return _env[prop as keyof Env];
  },
});
