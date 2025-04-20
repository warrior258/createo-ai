import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Clear the auth token cookie
    cookies().delete('auth_token');
    
    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}