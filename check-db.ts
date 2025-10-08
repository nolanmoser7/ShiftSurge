import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  ssl: "prefer",
  max: 1,
});

async function checkDatabase() {
  try {
    const result = await client`SELECT current_database(), current_user, version()`;
    console.log("✅ Connected to database:", result[0].current_database);
    console.log("User:", result[0].current_user);
    
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log("\nTables:", tables.length);
    tables.forEach(t => console.log("  -", t.table_name));
    
    await client.end();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkDatabase();
