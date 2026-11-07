require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('Connecting to PostgreSQL database...');
  const client = await pool.connect();
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    console.log('Running schema creation...');
    await client.query(schemaSql);
    console.log('Schema created successfully.');

    console.log('Inserting initial seed resources...');
    await client.query(seedSql);
    console.log('Seed data inserted successfully.');

    const res = await client.query('SELECT COUNT(*) AS total FROM resources');
    console.log(`Database initialization complete! Total resources in database: ${res.rows[0].total}`);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
