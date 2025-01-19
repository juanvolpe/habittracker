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
    
    // Check if _prisma_migrations table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('_prisma_migrations table does not exist. Skipping cleanup.');
      return;
    }
    
    // Clean up failed migrations
    const result = await client.query(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20240318000000_add_user_role_enum' AND applied_steps_count = 0;`
    );
    
    console.log('Cleanup completed:', result.rowCount);
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't exit with error if table doesn't exist
    if (error.code !== '42P01') {
      process.exit(1);
    }
    console.log('Continuing deployment...');
  } finally {
    await client.end();
  }
}

cleanupMigrations(); 