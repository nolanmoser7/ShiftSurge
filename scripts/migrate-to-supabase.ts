import postgres from 'postgres';

// Extract project reference from SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL || '';
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const password = process.env.SUPABASE_DB_PASSWORD;

console.log('Connecting to Supabase database...');
console.log('Project Reference:', projectRef);

// Try session pooler connection (supports IPv4)
const regions = ['us-east-1', 'us-west-1', 'eu-central-1', 'ap-southeast-1'];

async function tryConnection(region: string) {
  const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  
  try {
    const sql = postgres(connectionString, { max: 1, connect_timeout: 5 });
    await sql`SELECT 1`;
    console.log(`✓ Connected successfully via ${region}!`);
    return sql;
  } catch (err: any) {
    console.log(`✗ ${region} failed:`, err.message);
    return null;
  }
}

async function main() {
  let sql: any = null;

  // Try each region
  for (const region of regions) {
    sql = await tryConnection(region);
    if (sql) break;
  }

  if (!sql) {
    console.error('Could not connect to Supabase. Trying direct connection...');
    // Try direct connection
    const directConnectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
    sql = postgres(directConnectionString, { max: 1 });
  }

  console.log('\nCreating tables...\n');

  try {
    // Create neighborhoods table
    console.log('Creating neighborhoods table...');
    await sql`
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        slug VARCHAR NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ neighborhoods table created');

    // Create invite_tokens table
    console.log('Creating invite_tokens table...');
    await sql`
      CREATE TABLE IF NOT EXISTS invite_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR,
        token VARCHAR NOT NULL UNIQUE,
        created_by_user_id VARCHAR NOT NULL REFERENCES users(id),
        invite_type VARCHAR NOT NULL CHECK (invite_type IN ('admin', 'staff')),
        expires_at TIMESTAMPTZ,
        max_uses INTEGER DEFAULT 1,
        current_uses INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ invite_tokens table created');

    // Enable RLS
    console.log('Enabling RLS...');
    await sql`ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY`;
    console.log('✓ RLS enabled');

    // Create policies (drop if exists first)
    console.log('Creating RLS policies...');
    await sql`DROP POLICY IF EXISTS "Public read access" ON neighborhoods`;
    await sql`CREATE POLICY "Public read access" ON neighborhoods FOR SELECT USING (true)`;
    
    await sql`DROP POLICY IF EXISTS "Service role has full access" ON invite_tokens`;
    await sql`CREATE POLICY "Service role has full access" ON invite_tokens FOR ALL USING (true) WITH CHECK (true)`;
    console.log('✓ Policies created');

    // Insert neighborhoods
    console.log('Inserting neighborhoods...');
    await sql`
      INSERT INTO neighborhoods (name, slug, is_active) VALUES
        ('Downtown', 'downtown', true),
        ('Midtown', 'midtown', true),
        ('Uptown', 'uptown', true),
        ('Waterfront', 'waterfront', true),
        ('Arts District', 'arts-district', true)
      ON CONFLICT (slug) DO NOTHING
    `;
    console.log('✓ Neighborhoods inserted');

    // Update organizations table
    console.log('Updating organizations table...');
    await sql`
      ALTER TABLE organizations 
        ADD COLUMN IF NOT EXISTS neighborhood_id VARCHAR REFERENCES neighborhoods(id),
        ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS staff_min INTEGER,
        ADD COLUMN IF NOT EXISTS staff_max INTEGER
    `;
    console.log('✓ Organizations table updated');

    // Reload PostgREST schema cache
    console.log('\nReloading PostgREST schema cache...');
    await sql`NOTIFY pgrst, 'reload schema'`;
    console.log('✓ Schema cache reloaded');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
