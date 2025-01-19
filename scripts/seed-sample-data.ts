import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function seedSampleData() {
  try {
    console.log('Starting to seed sample data...')

    // Create hashed password for all users
    const password = await bcryptjs.hash('password123', 12)

    // Create 5 users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Marco Perez',
          email: 'marco@example.com',
          password
        }
      }),
      prisma.user.create({
        data: {
          name: 'Ana Garcia',
          email: 'ana@example.com',
          password
        }
      }),
      prisma.user.create({
        data: {
          name: 'Carlos Rodriguez',
          email: 'carlos@example.com',
          password
        }
      }),
      prisma.user.create({
        data: {
          name: 'Sofia Martinez',
          email: 'sofia@example.com',
          password
        }
      }),
      prisma.user.create({
        data: {
          name: 'Luis Torres',
          email: 'luis@example.com',
          password
        }
      })
    ])

    console.log('Created users:', users.map(u => u.name).join(', '))

    // Create 3 groups
    const groups = await Promise.all([
      prisma.group.create({
        data: {
          name: 'Morning Runners',
          creatorId: users[0].id, // Marco creates this group
          members: {
            create: [
              { userId: users[0].id, role: 'ADMIN' },  // Marco
              { userId: users[1].id, role: 'MEMBER' }, // Ana
              { userId: users[2].id, role: 'MEMBER' }  // Carlos
            ]
          }
        }
      }),
      prisma.group.create({
        data: {
          name: 'Gym Warriors',
          creatorId: users[3].id, // Sofia creates this group
          members: {
            create: [
              { userId: users[3].id, role: 'ADMIN' },  // Sofia
              { userId: users[4].id, role: 'MEMBER' }, // Luis
              { userId: users[0].id, role: 'MEMBER' }  // Marco
            ]
          }
        }
      }),
      prisma.group.create({
        data: {
          name: 'Yoga Enthusiasts',
          creatorId: users[1].id, // Ana creates this group
          members: {
            create: [
              { userId: users[1].id, role: 'ADMIN' }, // Ana
              { userId: users[3].id, role: 'MEMBER' }, // Sofia
              { userId: users[4].id, role: 'MEMBER' }  // Luis
            ]
          }
        }
      })
    ])

    console.log('Created groups:', groups.map(g => g.name).join(', '))

    // Create activities for each user in their groups
    const activities = await Promise.all([
      // Marco's activities
      prisma.activity.create({
        data: {
          userId: users[0].id,
          groupId: groups[0].id,
          activityType: 'CORRER',
          duration: 30,
          date: new Date('2024-01-15')
        }
      }),
      prisma.activity.create({
        data: {
          userId: users[0].id,
          groupId: groups[1].id,
          activityType: 'GYM',
          duration: 45,
          date: new Date('2024-01-16')
        }
      }),

      // Ana's activities
      prisma.activity.create({
        data: {
          userId: users[1].id,
          groupId: groups[0].id,
          activityType: 'CORRER',
          duration: 25,
          date: new Date('2024-01-15')
        }
      }),
      prisma.activity.create({
        data: {
          userId: users[1].id,
          groupId: groups[2].id,
          activityType: 'PILATES',
          duration: 60,
          date: new Date('2024-01-17')
        }
      }),

      // Carlos's activities
      prisma.activity.create({
        data: {
          userId: users[2].id,
          groupId: groups[0].id,
          activityType: 'CORRER',
          duration: 40,
          date: new Date('2024-01-16')
        }
      }),

      // Sofia's activities
      prisma.activity.create({
        data: {
          userId: users[3].id,
          groupId: groups[1].id,
          activityType: 'GYM',
          duration: 50,
          date: new Date('2024-01-15')
        }
      }),
      prisma.activity.create({
        data: {
          userId: users[3].id,
          groupId: groups[2].id,
          activityType: 'PILATES',
          duration: 55,
          date: new Date('2024-01-17')
        }
      }),

      // Luis's activities
      prisma.activity.create({
        data: {
          userId: users[4].id,
          groupId: groups[1].id,
          activityType: 'GYM',
          duration: 60,
          date: new Date('2024-01-16')
        }
      }),
      prisma.activity.create({
        data: {
          userId: users[4].id,
          groupId: groups[2].id,
          activityType: 'PILATES',
          duration: 45,
          date: new Date('2024-01-17')
        }
      })
    ])

    console.log('Created activities:', activities.length)
    console.log('Sample data seeded successfully!')

  } catch (error) {
    console.error('Error seeding sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedSampleData() 