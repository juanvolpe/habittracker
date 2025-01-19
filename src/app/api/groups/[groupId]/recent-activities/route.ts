import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get recent activities for the group (last 20 activities)
    const activities = await prisma.activity.findMany({
      where: {
        groupId: params.groupId,
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
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return NextResponse.json(
      { error: "Error fetching recent activities" },
      { status: 500 }
    );
  }
} 