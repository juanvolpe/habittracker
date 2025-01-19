import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if the activity exists and belongs to the user
    const activity = await prisma.activity.findUnique({
      where: { id: params.activityId },
      select: { userId: true }
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (activity.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this activity" },
        { status: 403 }
      );
    }

    // Delete the activity
    await prisma.activity.delete({
      where: { id: params.activityId }
    });

    return NextResponse.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { activityId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if the activity exists and belongs to the user
    const existingActivity = await prisma.activity.findUnique({
      where: { id: params.activityId },
      select: { userId: true }
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (existingActivity.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to edit this activity" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { activityType, duration, date } = data;

    // Validate the required fields
    if (!activityType || !duration || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the activity
    const updatedActivity = await prisma.activity.update({
      where: { id: params.activityId },
      data: {
        activityType,
        duration,
        date: new Date(date)
      },
      include: {
        group: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({ activity: updatedActivity });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
} 