import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const { groupId } = params;

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
      include: {
        group: {
          select: {
            creatorId: true
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 400 }
      );
    }

    // Don't allow creator to leave
    if (membership.group.creatorId === session.user.id) {
      return NextResponse.json(
        { error: "Group creator cannot leave the group" },
        { status: 400 }
      );
    }

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json(
      { message: "Successfully left group" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 }
    );
  }
} 