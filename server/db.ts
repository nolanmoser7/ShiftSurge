import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Construct Supabase pooler connection string
const SUPABASE_PROJECT_REF = "eopeghiffhenhetwfnfv";
const SUPABASE_REGION = "aws-0-us-east-1";
const supabasePoolerUrl = `postgresql://postgres.${SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@${SUPABASE_REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true`;

// Use Supabase pooler connection for Drizzle
// CRITICAL: prepare: false is required for Supabase transaction pooler mode
const client = postgres(supabasePoolerUrl, {
  prepare: false,  // Required for Supabase pooler (pgbouncer)
  ssl: "prefer",
  max: 10,
});

export const db = drizzle(client, { schema });
