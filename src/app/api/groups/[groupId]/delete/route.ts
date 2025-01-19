import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    // Check if the group exists and if the user is the creator
    const group = await prisma.group.findUnique({
      where: {
        id: params.groupId,
      },
      select: {
        creatorId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group creator can delete the group" },
        { status: 403 }
      );
    }

    // Delete all related records first
    await prisma.$transaction([
      // Delete all group members
      prisma.groupMember.deleteMany({
        where: {
          groupId: params.groupId,
        },
      }),
      // Delete all activities
      prisma.activity.deleteMany({
        where: {
          groupId: params.groupId,
        },
      }),
      // Finally delete the group
      prisma.group.delete({
        where: {
          id: params.groupId,
        },
      }),
    ]);

    return NextResponse.json({ message: "Group successfully deleted" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Error deleting group" },
      { status: 500 }
    );
  }
} 