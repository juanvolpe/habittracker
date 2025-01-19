import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log('GroupsAPI: Request received')
    
    const session = await auth()
    console.log('GroupsAPI: Session:', { 
      authenticated: !!session,
      userId: session?.user?.id 
    })

    if (!session?.user?.id) {
      console.log('GroupsAPI: No authenticated user')
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Fetch all groups with membership info
    console.log('GroupsAPI: Fetching all groups...')
    const allGroups = await prisma.group.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
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

    console.log('GroupsAPI: Raw groups found:', JSON.stringify(allGroups, null, 2))

    // Format the response data and add isMember flag
    const formattedGroups = allGroups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      createdBy: {
        name: group.createdBy.name || 'Unknown',
        email: group.createdBy.email
      },
      members: group.members.map(member => ({
        user: {
          name: member.user.name || 'Unknown',
          email: member.user.email
        },
        role: member.role
      })),
      memberCount: group._count.members,
      activityCount: group._count.activities,
      isMember: group.members.some(member => member.user.email === session.user.email),
      isCreator: group.createdBy.email === session.user.email
    }));

    console.log('GroupsAPI: Formatted response:', JSON.stringify({ 
      groups: formattedGroups,
      count: formattedGroups.length
    }, null, 2));

    return NextResponse.json(
      { 
        groups: formattedGroups,
        count: formattedGroups.length
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )
  } catch (error: any) {
    console.error('GroupsAPI: Error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    })

    return NextResponse.json(
      { 
        error: "Failed to fetch groups",
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN"
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ group })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json(
      { error: "Error creating group" },
      { status: 500 }
    )
  }
} 