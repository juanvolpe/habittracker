import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

// Force Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    console.log('RegisterAPI: Request received');
    
    // Parse request body
    let data;
    try {
      data = await request.json();
      console.log('RegisterAPI: Request data parsed:', {
        email: data.email,
        hasPassword: !!data.password,
        hasName: !!data.name
      });
    } catch (error) {
      console.error('RegisterAPI: Failed to parse request body:', error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.email || !data.password || !data.name) {
      console.error('RegisterAPI: Missing required fields:', {
        hasEmail: !!data.email,
        hasPassword: !!data.password,
        hasName: !!data.name
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    console.log('RegisterAPI: Checking for existing user...');
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      console.log('RegisterAPI: User already exists:', { email: data.email });
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log('RegisterAPI: Hashing password...');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.log('RegisterAPI: Password hashed successfully');

    // Create user with UserRole enum
    console.log('RegisterAPI: Creating new user...');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: UserRole.USER
      }
    });

    console.log('RegisterAPI: User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    console.error('RegisterAPI: Error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      prismaError: error instanceof Error ? error.toString() : undefined
    });

    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Error creating user",
        details: {
          message: error.message,
          code: error.code,
          name: error.name
        }
      },
      { status: 500 }
    );
  }
} 