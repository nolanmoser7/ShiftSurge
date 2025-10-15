import postgres from 'postgres';

// Direct PostgreSQL connection to bypass Supabase PostgREST cache issues
const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
