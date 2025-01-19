import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Delete all user data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's activities
      await tx.activity.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete members from groups created by the user
      const userGroups = await tx.group.findMany({
        where: { creatorId: session.user.id },
        select: { id: true }
      });

      if (userGroups.length > 0) {
        await tx.groupMember.deleteMany({
          where: {
            groupId: {
              in: userGroups.map(g => g.id)
            }
          }
        });
      }

      // Delete user's own group memberships
      await tx.groupMember.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete groups created by the user
      await tx.group.deleteMany({
        where: { creatorId: session.user.id }
      });

      // Delete user's personal data
      await tx.personalData.deleteMany({
        where: { userId: session.user.id }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: session.user.id }
      });
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 