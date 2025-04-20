import { getCurrentUser } from '@/app/utils/auth';
import { db, user_youtube } from '@/app/utils/dbconnect';
import { eq } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import { NextResponse } from 'next/server';

export async function POST() {
    try {

        const currentUser = await getCurrentUser();

        if(!currentUser){
            return NextResponse.json({ success: false }, { status: 401 });

        }
        await db.delete(user_youtube).where(eq(user_youtube.googleId, currentUser.userId));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}