// init_admin.js
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const {
  DATABASE_URL = 'postgres://appuser:secretpassword@db:5432/appdb',
  ADMIN_USER = 'admin',
  ADMIN_PASS = 'Willow2019$'
} = process.env;

async function init() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const res = await client.query('SELECT id FROM users WHERE username=$1', [ADMIN_USER]);
  if (res.rowCount === 0) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(ADMIN_PASS, salt);
    await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [ADMIN_USER, hash]);
    console.log(`Created admin user ${ADMIN_USER}`);
  } else {
    console.log('Admin user already exists');
  }

  await client.end();
}

init().catch(err => {
  console.error('Init error', err);
  process.exit(1);
});
