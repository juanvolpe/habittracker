const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Delete all weights first
    await prisma.weight.deleteMany();
    
    // Delete all activities
    await prisma.activity.deleteMany();

    // Delete all group members
    await prisma.groupMember.deleteMany();

    // Delete all groups
    await prisma.group.deleteMany();

    // Delete all personal data
    await prisma.personalData.deleteMany();

    // Delete all users
    await prisma.user.deleteMany();

    console.log('Cleanup completed:', 0);
  } catch (error) {
    console.error('Error cleaning up data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup(); 