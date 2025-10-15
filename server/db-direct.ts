import postgres from 'postgres';

// Direct PostgreSQL connection using the local DATABASE_URL
// This is the development database where all tables are created
const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
