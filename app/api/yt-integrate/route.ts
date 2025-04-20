import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db, user_youtube } from '@/app/utils/dbconnect';
import { eq } from 'drizzle-orm';
import { GoogleTokens, JWTPayload, StoredTokens } from '@/app/types';
import { getCurrentUser } from '@/app/utils/auth';


const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.YT_REDIRECT_URI
);

const scopes = [
    'https://www.googleapis.com/auth/youtube',
];

export async function GET() {
    try {

        const currentUser = await getCurrentUser();
        if (!currentUser?.userId) {
            return NextResponse.json(
                { success: false, error: "Not authenticated" },
                { status: 401 }
            );
        }

        const tokens = await getStoredTokens(currentUser.userId);
        if (!tokens) {
            return NextResponse.json(
                { success: false, error: "No YouTube integration found" },
                { status: 404 }
            );
        }

        const freshTokens = await refreshTokensIfNeeded(tokens, currentUser.userId);
        oauth2Client.setCredentials(freshTokens);

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const response = await youtube.channels.list({
          part: ['snippet', 'statistics'],
          mine: true
        });
    
        const channel = response.data.items?.[0];
        if (!channel) {
          return NextResponse.json(
            { success: true, channel: null },
            { status: 200 }
          );
        }
    
        return NextResponse.json({
          success: true,
          channel: {
            id: channel.id,
            title: channel.snippet?.title,
            thumbnail: channel.snippet?.thumbnails?.high?.url,
            subscribers: channel.statistics?.subscriberCount,
            views: channel.statistics?.viewCount
          }
        });

    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

async function getStoredTokens(userId: string) {
    const result = await db.query.user_youtube.findFirst({
        where: (userYoutube) => eq(userYoutube.googleId, userId)
    });

    return result;
}

async function refreshTokensIfNeeded(tokens: StoredTokens, googleId: string): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date?: number;
  }> {
    // Check if refresh token is expired or will expire soon (within 5 minutes)
    const now = new Date();
    const refreshExpiryDate = new Date(tokens.refresh_expiry);
    const shouldRefresh = refreshExpiryDate < new Date(now.getTime() + 5 * 60 * 1000);
  
    if (!shouldRefresh) {
      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken
      };
    }
  
    try {
      oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken
      });
  
      const { credentials } = await oauth2Client.refreshAccessToken() as { credentials: GoogleTokens };
      
      // Calculate new refresh token expiration (use provided value or default to 7 days)
      const newRefreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
      // Update in database
      await db.update(user_youtube)
        .set({
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || tokens.refreshToken, // Keep old if not provided
          refresh_expiry: newRefreshExpiry
        })
        .where(eq(user_youtube.googleId, googleId));
  
      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || tokens.refreshToken,
        expiry_date: credentials.expiry_date
      };
  
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      throw new Error('Token refresh failed');
    }
  }
  