import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch only the user's activities
    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id // Only get activities for the current user
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
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { activityType, duration, date, groupId } = await request.json();

    console.log('Activity being logged:', {
      userId: session.user.id,
      groupId,
      activityType,
      duration,
      date: new Date(date)
    });

    if (!activityType || !duration || !date || !groupId) {
      console.log('Missing required fields:', { activityType, duration, date, groupId });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        activityType,
        duration,
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
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: "Error logging activity" },
      { status: 500 }
    );
  }
} 