import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, parseISO } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the date and view type from query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const viewType = url.searchParams.get('viewType') || 'monthly';
    const baseDate = dateParam ? parseISO(dateParam) : new Date();

    // Get start and end dates based on view type
    let start, end;
    if (viewType === 'yearly') {
      start = startOfYear(baseDate);
      end = endOfYear(baseDate);
    } else if (viewType === 'monthly') {
      start = startOfMonth(baseDate);
      end = endOfMonth(baseDate);
    } else {
      start = startOfWeek(baseDate, { weekStartsOn: 1 });
      end = endOfWeek(baseDate, { weekStartsOn: 1 });
    }

    // First check if user is member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: params.groupId,
        userId: session.user.id
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not a member of this group" },
        { status: 403 }
      );
    }

    // Get all activities for the group in the selected period
    const activities = await prisma.activity.findMany({
      where: {
        groupId: params.groupId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            personalData: {
              select: {
                photoUrl: true,
              },
              orderBy: {
                logDate: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Organize activities by date
    const activitiesByDate: Record<string, any> = {};
    
    activities.forEach((activity: any) => {
      const dateKey = format(activity.date, 'yyyy-MM-dd');
      
      if (!activitiesByDate[dateKey]) {
        activitiesByDate[dateKey] = new Map();
      }

      const userMap = activitiesByDate[dateKey];
      const userId = activity.user.id;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId: activity.user.id,
          userName: activity.user.name,
          photoUrl: activity.user.personalData[0]?.photoUrl || null,
          activityCount: 0,
        });
      }
      
      userMap.get(userId).activityCount++;
    });

    // Convert Map to array for each date
    Object.keys(activitiesByDate).forEach((date) => {
      activitiesByDate[date] = Array.from(activitiesByDate[date].values());
    });

    return NextResponse.json({ activities: activitiesByDate });
  } catch (error: any) {
    console.error("Detailed error in activities:", error);
    return NextResponse.json(
      { error: "Error fetching activities", details: error.message },
      { status: 500 }
    );
  }
} 