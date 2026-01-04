const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_2yqacA9bLVRl@ep-wandering-smoke-ahholl77-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function deleteAll() {
  try {
    await pool.query('DELETE FROM settings');
    console.log('Settings deleted');
    await pool.query('DELETE FROM messages');
    console.log('Messages deleted');
    await pool.query('DELETE FROM users');
    console.log('Users deleted');
    console.log('All data deleted successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

deleteAll();
