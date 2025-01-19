import { PrismaClient } from '@prisma/client'

async function cleanupDatabase() {
  // Use the DATABASE_URL from environment for Render's database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  
  try {
    console.log('Starting Render database cleanup...')
    console.log('Using database URL:', process.env.DATABASE_URL)

    // Delete records in the correct order to respect foreign key constraints
    console.log('Deleting activities...')
    await prisma.activity.deleteMany()
    
    console.log('Deleting group members...')
    await prisma.groupMember.deleteMany()
    
    console.log('Deleting groups...')
    await prisma.group.deleteMany()
    
    console.log('Deleting personal data...')
    await prisma.personalData.deleteMany()
    
    console.log('Deleting users...')
    await prisma.user.deleteMany()

    console.log('Render database cleanup completed successfully!')
  } catch (error) {
    console.error('Error during database cleanup:', error)
    console.error('Make sure you have set the correct DATABASE_URL for Render')
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupDatabase() 