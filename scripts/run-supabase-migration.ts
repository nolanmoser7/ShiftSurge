import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('\n=== Running Supabase Migration ===\n');

  try {
    // Step 1: Create neighborhoods table
    console.log('1. Creating neighborhoods table...');
    const { error: neighborhoodsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS neighborhoods (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          slug VARCHAR NOT NULL UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    });
    
    if (neighborhoodsError && !neighborhoodsError.message.includes('already exists')) {
      console.log('   Note:', neighborhoodsError.message);
    } else {
      console.log('   ✓ Neighborhoods table ready');
    }

    // Step 2: Create invite_tokens table
    console.log('2. Creating invite_tokens table...');
    const { error: inviteError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (inviteError && !inviteError.message.includes('already exists')) {
      console.log('   Note:', inviteError.message);
    } else {
      console.log('   ✓ Invite tokens table ready');
    }

    // Step 3: Enable RLS
    console.log('3. Enabling Row Level Security...');
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY'
    });
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY'
    });
    console.log('   ✓ RLS enabled');

    // Step 4: Create policies
    console.log('4. Creating RLS policies...');
    await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Public read access" ON neighborhoods'
    });
    await supabase.rpc('exec_sql', {
      sql: 'CREATE POLICY "Public read access" ON neighborhoods FOR SELECT USING (true)'
    });
    
    await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Service role has full access" ON invite_tokens'
    });
    await supabase.rpc('exec_sql', {
      sql: 'CREATE POLICY "Service role has full access" ON invite_tokens FOR ALL USING (true) WITH CHECK (true)'
    });
    console.log('   ✓ Policies created');

    // Step 5: Insert neighborhoods
    console.log('5. Inserting default neighborhoods...');
    const { error: insertError } = await supabase
      .from('neighborhoods')
      .upsert([
        { slug: 'downtown', name: 'Downtown', is_active: true },
        { slug: 'midtown', name: 'Midtown', is_active: true },
        { slug: 'uptown', name: 'Uptown', is_active: true },
        { slug: 'waterfront', name: 'Waterfront', is_active: true },
        { slug: 'arts-district', name: 'Arts District', is_active: true },
      ], { onConflict: 'slug' });
    
    if (insertError) {
      console.log('   Note:', insertError.message);
    } else {
      console.log('   ✓ Neighborhoods inserted');
    }

    // Step 6: Update organizations table
    console.log('6. Updating organizations table...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE organizations 
          ADD COLUMN IF NOT EXISTS neighborhood_id VARCHAR REFERENCES neighborhoods(id),
          ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
          ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8),
          ADD COLUMN IF NOT EXISTS staff_min INTEGER,
          ADD COLUMN IF NOT EXISTS staff_max INTEGER
      `
    });
    console.log('   ✓ Organizations table updated');

    // Step 7: Reload schema cache
    console.log('7. Reloading PostgREST schema cache...');
    await supabase.rpc('exec_sql', {
      sql: "NOTIFY pgrst, 'reload schema'"
    });
    console.log('   ✓ Schema cache reloaded');

    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
