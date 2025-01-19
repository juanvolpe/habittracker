import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdminDashboard from "./AdminDashboard"

export const runtime = "nodejs"

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch all data
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          activities: true,
          memberships: true,
          createdGroups: true
        }
      }
    }
  })

  const groups = await prisma.group.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          members: true,
          activities: true
        }
      }
    }
  })

  const activities = await prisma.activity.findMany({
    take: 100,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      group: {
        select: {
          name: true
        }
      }
    }
  })

  const groupMembers = await prisma.groupMember.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      group: {
        select: {
          name: true
        }
      }
    }
  })

  return <AdminDashboard 
    users={users} 
    groups={groups} 
    activities={activities} 
    groupMembers={groupMembers}
  />
} 