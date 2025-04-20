import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.AUTH_REDIRECT_URI
);

const scopes = [
    'openid',
    'profile',
    'email',
];

export async function GET() {
    try {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: "consent"
        });

        return NextResponse.json({ success: true, url });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}