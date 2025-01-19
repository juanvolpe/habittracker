const { Client } = require('pg');

async function cleanupMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for some PostgreSQL hosting providers
    }
  });
  
  try {
    await client.connect();
    
    // Clean up failed migrations
    const result = await client.query(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20240318000000_add_user_role_enum' AND applied_steps_count = 0;`
    );
    
    console.log('Cleanup completed:', result.rowCount);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanupMigrations(); 