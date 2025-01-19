import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('GET Activities - Session:', { 
      exists: !!session, 
      userId: session?.user?.id,
      isAuthenticated: !!session?.user 
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch only the user's activities
    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(
      { 
        activities,
        count: activities.length
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  } catch (error: any) {
    console.error('Activities API Error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch activities",
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('POST Activity - Session:', { 
      exists: !!session, 
      userId: session?.user?.id,
      isAuthenticated: !!session?.user 
    });

    if (!session?.user?.id) {
      console.log('Authentication failed:', { session });
      return NextResponse.json(
        { error: "Not authenticated", details: "No valid session found" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: "Invalid request body", details: "Failed to parse JSON" },
        { status: 400 }
      );
    }

    const { activityType, duration, date, groupId } = body;

    if (!activityType || !duration || !date || !groupId) {
      console.log('Missing required fields:', { activityType, duration, date, groupId });
      return NextResponse.json(
        { error: "Missing required fields", details: { activityType, duration, date, groupId } },
        { status: 400 }
      );
    }

    // Verify group membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id
        }
      }
    });

    if (!membership) {
      console.log('User not member of group:', { userId: session.user.id, groupId });
      return NextResponse.json(
        { error: "User is not a member of this group" },
        { status: 403 }
      );
    }

    try {
      const activity = await prisma.activity.create({
        data: {
          activityType,
          duration: Number(duration),
          date: new Date(date),
          userId: session.user.id,
          groupId
        },
        include: {
          group: {
            select: {
              name: true
            }
          }
        }
      });

      console.log('Activity logged successfully:', {
        activityId: activity.id,
        groupId: activity.groupId,
        groupName: activity.group?.name
      });

      return NextResponse.json({ 
        message: "Activity logged successfully", 
        activity,
        groupDetails: {
          id: activity.groupId,
          name: activity.group?.name
        }
      });
    } catch (e: any) {
      console.error('Failed to create activity:', e);
      return NextResponse.json(
        { error: "Failed to create activity", details: e.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error logging activity:", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: "Error logging activity",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
} 