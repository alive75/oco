const { Client } = require('pg');

async function testConnection() {
  console.log('Testing PostgreSQL connection...\n');
  
  // Teste 1: Com senha
  console.log('🔑 Test 1: Connection with password');
  const client1 = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'oco_user',
    password: 'oco_password',
    database: 'oco_db',
  });
  
  try {
    await client1.connect();
    console.log('✅ Connection with password successful!');
    
    const res = await client1.query('SELECT email, name FROM users;');
    console.log('Users found:', res.rows.length);
    console.log('First user:', res.rows[0]);
    
    await client1.end();
    console.log('✅ All tests passed! PostgreSQL is working correctly.\n');
    return true;
  } catch (err) {
    console.error('❌ Connection with password failed:', err.message);
    console.log('Error code:', err.code);
    console.log('Error details:', err.detail || 'No details');
  }
  
  // Teste 2: Sem senha
  console.log('\n🔓 Test 2: Connection without password');
  const client2 = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'oco_user',
    database: 'oco_db',
  });
  
  try {
    await client2.connect();
    console.log('✅ Connection without password successful!');
    
    const res = await client2.query('SELECT email, name FROM users;');
    console.log('Users found:', res.rows.length);
    
    await client2.end();
  } catch (err2) {
    console.error('❌ Connection without password failed:', err2.message);
  }
  
  return false;
}

testConnection().then(success => {
  if (!success) {
    console.log('\n🚨 Connection tests failed. Check PostgreSQL configuration.');
    process.exit(1);
  }
});