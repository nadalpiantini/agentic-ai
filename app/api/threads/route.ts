import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || "default-user";

    const result = await pool.query(
      "SELECT * FROM threads WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50",
      [userId]
    );

    return NextResponse.json({ threads: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || "default-user";
    const body = await req.json();
    const title = body.title || "New Chat";

    const result = await pool.query(
      "INSERT INTO threads (user_id, title) VALUES ($1, $2) RETURNING *",
      [userId, title]
    );

    return NextResponse.json({ thread: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
