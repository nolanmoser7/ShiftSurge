import postgres from 'postgres';

// Extract project reference from SUPABASE_URL
// e.g., https://eopeghiffhenhetwfnfv.supabase.co -> eopeghiffhenhetwfnfv
const supabaseUrl = process.env.SUPABASE_URL || '';
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Build direct PostgreSQL connection string to Supabase database
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

// Direct PostgreSQL connection to Supabase database (bypasses PostgREST cache)
const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
