import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Delete all records in a specific order to handle foreign key constraints
    await db.$transaction([
      // First, delete activities as they reference users and groups
      db.activity.deleteMany(),
      // Delete group memberships
      db.groupMember.deleteMany(),
      // Delete groups
      db.group.deleteMany(),
      // Delete personal data
      db.personalData.deleteMany(),
      // Finally, delete users
      db.user.deleteMany(),
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'All data has been cleaned up successfully' 
    });
  } catch (error) {
    console.error('Error cleaning up data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clean up data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 