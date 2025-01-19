import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const groupId = params.groupId;

    // Check if the user is the creator of the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { creatorId: true }
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

    // Delete group and related data in a transaction
    await prisma.$transaction([
      // Delete all activities in the group
      prisma.activity.deleteMany({
        where: { groupId }
      }),
      // Delete all group members
      prisma.groupMember.deleteMany({
        where: { groupId }
      }),
      // Finally delete the group
      prisma.group.delete({
        where: { id: groupId }
      })
    ]);

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
} 