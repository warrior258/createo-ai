import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { GoogleUserInfo, JWTPayload, UserData } from '@/app/types';
import { db, users } from '@/app/utils/dbconnect';
import { eq } from 'drizzle-orm';

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.AUTH_REDIRECT_URI
);

export async function GET(request: NextRequest) {
    try {
        // Get the code from the URL
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        
        if (!code) {
            return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
        }

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user information
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });
        
        const { data } = await oauth2.userinfo.get();
        const userData = data as GoogleUserInfo;
        
        // Create a user object with relevant information
        const user: UserData = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
            verified: userData.verified_email
        };

        // Check if user already exists
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.googleId, user.id))
            .limit(1);

         // If user doesn't exist, create new user
         if (existingUser.length === 0) {
            await db.insert(users).values({
                googleId: user.id,
                email: user.email,
                username: user.name,
                picture: user.picture
            });
        }

        // Create a JWT token for the user session
        // const jwtPayload: JWTPayload = {
        //     userId: user.id,
        //     email: user.email
        // };

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({
            userId: user.id,
            email: user.email
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);

        // Set the token in a cookie
        cookies().set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        // Here you would typically save the user to your database
        // This is just a placeholder - implement according to your database setup
        // await saveUserToDatabase(user);

        // Redirect to the dashboard or home page
        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
        console.error('Error during Google authentication:', error);
        return NextResponse.redirect(new URL('/auth/error?error=authentication_failed', request.url));
    }
}