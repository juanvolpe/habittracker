import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const weights = await prisma.weight.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ weights });
  } catch (error) {
    console.error("Error fetching weights:", error);
    return NextResponse.json(
      { error: "Failed to fetch weights" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { weight, date } = await request.json();

    if (!weight || !date) {
      return NextResponse.json(
        { error: "Weight and date are required" },
        { status: 400 }
      );
    }

    const weightRecord = await prisma.weight.create({
      data: {
        userId: session.user.id,
        weight: weight,
        date: new Date(date)
      }
    });

    return NextResponse.json({ weight: weightRecord });
  } catch (error) {
    console.error("Error logging weight:", error);
    return NextResponse.json(
      { error: "Failed to log weight" },
      { status: 500 }
    );
  }
} 