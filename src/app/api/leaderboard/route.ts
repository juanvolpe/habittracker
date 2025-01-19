import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get timeRange from query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'monthly';

    // Calculate date range
    const now = new Date();
    let startDate, endDate;

    if (timeRange === 'monthly') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    }

    // Fetch activities within the date range and group by user
    const leaderboard = await prisma.activity.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        duration: true
      },
      _count: {
        _all: true
      }
    });

    // Fetch user details for each leaderboard entry
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await prisma.user.findUnique({
          where: { id: entry.userId },
          select: {
            name: true,
            email: true
          }
        });

        return {
          userId: entry.userId,
          userName: user?.name,
          userEmail: user?.email || 'unknown',
          totalDuration: entry._sum.duration || 0,
          totalActivities: entry._count._all
        };
      })
    );

    // Sort by total duration in descending order
    const sortedLeaderboard = leaderboardWithUsers.sort(
      (a, b) => b.totalDuration - a.totalDuration
    );

    return NextResponse.json(
      { 
        leaderboard: sortedLeaderboard,
        timeRange,
        period: {
          start: startDate,
          end: endDate
        }
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
    console.error('Leaderboard API Error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch leaderboard",
        details: error.message
      },
      { status: 500 }
    );
  }
} 