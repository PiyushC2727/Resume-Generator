import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getDbConnection(): Promise<mysql.Pool> {
  if (pool) return pool;

  const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (connectionUri) {
    console.log('[MySQL] Connecting using connection URI...');
    pool = mysql.createPool({
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } else {
    console.log('[MySQL] Connecting using individual environment variables...');
    pool = mysql.createPool({
      host: process.env.MYSQLHOST || 'localhost',
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
      database: process.env.MYSQLDATABASE || 'resume_generator',
      port: Number(process.env.MYSQLPORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  // Initialize DB tables
  try {
    const connection = await pool.getConnection();
    console.log('[MySQL] Connected to MySQL successfully!');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resume_drafts (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        timestamp VARCHAR(255) NOT NULL,
        resume_data JSON NOT NULL
      );
    `);
    console.log('[MySQL] Initialized "resume_drafts" database tables.');
    connection.release();
  } catch (error) {
    console.error('[MySQL Error] Initial initialization query failed:', error);
  }

  return pool;
}
