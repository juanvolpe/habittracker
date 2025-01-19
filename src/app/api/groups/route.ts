import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('showAll') === 'true'

    const groups = await prisma.group.findMany({
      where: showAll ? {} : {
        members: {
          some: {
            userId: session.user.id
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
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    // Transform the data to include isMember flag and creatorId
    const transformedGroups = groups.map(group => ({
      ...group,
      isMember: group.members.some(member => member.userId === session.user.id),
      creatorId: group.creatorId, // Make sure creatorId is included
      members: group.members.map(member => ({
        user: member.user
      }))
    }))

    return NextResponse.json({ groups: transformedGroups })
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
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