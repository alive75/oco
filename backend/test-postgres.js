const { Client } = require('pg');

async function testPostgresConnection() {
  console.log('Testing PostgreSQL connection as postgres user...\n');
  
  // Test with postgres user (should work with trust)
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    database: 'oco_db',
  });
  
  try {
    await client.connect();
    console.log('✅ Connection as postgres successful!');
    
    // Check if oco_user exists
    const res = await client.query("SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'oco_user';");
    console.log('oco_user exists:', res.rows.length > 0 ? 'Yes' : 'No');
    if (res.rows.length > 0) {
      console.log('oco_user details:', res.rows[0]);
    }
    
    // Try to test oco_user password
    const passRes = await client.query("SELECT rolname FROM pg_roles WHERE rolname = 'oco_user' AND rolpassword IS NOT NULL;");
    console.log('oco_user has password:', passRes.rows.length > 0 ? 'Yes' : 'No');
    
    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Connection as postgres failed:', err.message);
    return false;
  }
}

testPostgresConnection();