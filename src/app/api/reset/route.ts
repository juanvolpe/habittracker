import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Delete all records in a transaction
    await prisma.$transaction([
      // Delete activities first (they reference groups and users)
      prisma.activity.deleteMany({}),
      // Delete group members (they reference groups and users)
      prisma.groupMember.deleteMany({}),
      // Delete groups
      prisma.group.deleteMany({}),
      // Delete personal data
      prisma.personalData.deleteMany({}),
      // Finally delete users
      prisma.user.deleteMany({})
    ]);

    return NextResponse.json({ message: "Database reset successful" });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json(
      { error: "Failed to reset database" },
      { status: 500 }
    );
  }
} 