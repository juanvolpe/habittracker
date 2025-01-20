import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { weightId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // First verify that the weight entry belongs to the user
    const weight = await prisma.weight.findUnique({
      where: {
        id: params.weightId,
        userId: session.user.id
      }
    });

    if (!weight) {
      return NextResponse.json(
        { error: "Weight entry not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the weight entry
    await prisma.weight.delete({
      where: {
        id: params.weightId
      }
    });

    return NextResponse.json({ message: "Weight entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting weight entry:", error);
    return NextResponse.json(
      { error: "Failed to delete weight entry" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { weightId: string } }
) {
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

    // First verify that the weight entry belongs to the user
    const existingWeight = await prisma.weight.findUnique({
      where: {
        id: params.weightId,
        userId: session.user.id
      }
    });

    if (!existingWeight) {
      return NextResponse.json(
        { error: "Weight entry not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the weight entry
    const updatedWeight = await prisma.weight.update({
      where: {
        id: params.weightId
      },
      data: {
        weight: weight,
        date: new Date(date)
      }
    });

    return NextResponse.json({ weight: updatedWeight });
  } catch (error) {
    console.error("Error updating weight entry:", error);
    return NextResponse.json(
      { error: "Failed to update weight entry" },
      { status: 500 }
    );
  }
} 