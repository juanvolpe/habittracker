import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const personalData = await prisma.personalData.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        logDate: 'desc',
      },
    });

    return NextResponse.json({ personalData });
  } catch (error) {
    console.error("Error fetching personal data:", error);
    return NextResponse.json(
      { error: "Error fetching personal data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { photoUrl } = await req.json();

    const personalData = await prisma.personalData.create({
      data: {
        userId: session.user.id,
        photoUrl,
        logDate: new Date(),
      },
    });

    return NextResponse.json({ personalData });
  } catch (error) {
    console.error("Error updating personal data:", error);
    return NextResponse.json(
      { error: "Error updating personal data" },
      { status: 500 }
    );
  }
} 