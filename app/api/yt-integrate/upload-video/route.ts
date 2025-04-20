// app/api/youtube/upload/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCurrentUser } from '@/app/utils/auth';
import { db, platform_uploads, user_youtube } from '@/app/utils/dbconnect';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { eq } from 'drizzle-orm';
import { Platform } from '@/app/types';
import axios from "axios"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.YT_REDIRECT_URI
);

export async function POST(req: Request) {
  try {
    const { videoId, publicVideoId, title, description, privacyStatus = 'private' } = await req.json();
    
    // 1. Verify user authentication
    const currentUser = await getCurrentUser();
    if (!currentUser?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get YouTube tokens from database
    const tokens = await db.query.user_youtube.findFirst({
      where: (userYoutube, { eq }) => eq(userYoutube.googleId, currentUser.userId)
    });

    if (!tokens?.accessToken || !tokens.refreshToken) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 });
    }

    // 4. Set credentials and upload to YouTube
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });


    try {
        const refreshTokenExpired = new Date(tokens.refresh_expiry) < new Date();
        if(refreshTokenExpired){
          return NextResponse.json(
            { error: 'Failed to refresh YouTube access' }, 
            { status: 401 }
          );
        }

        const { credentials } = await oauth2Client.refreshAccessToken();

        if(!credentials.access_token){
          return NextResponse.json(
            { error: 'Failed to refresh YouTube access' }, 
            { status: 401 }
          );
        }

        console.log("refreshed", credentials.access_token, credentials.refresh_token);

        if(tokens.accessToken !== credentials.access_token){
          await db.update(user_youtube)
            .set({ 
              accessToken: credentials.access_token
            })
            .where(eq(user_youtube.googleId, currentUser.userId));
        }

    } catch (error) {
      console.error('Token refresh error:', error);
      return NextResponse.json(
        { error: 'Failed to refresh YouTube access' }, 
        { status: 401 }
      );
    }


    // 3. Get video from Cloudinary
    const videoBuffer = await fetchFromCloudinary(publicVideoId);
    if (!videoBuffer) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log("Video fetched from cloudnary");


    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    const videoStream = Readable.from(videoBuffer);

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags: [],
          categoryId: "22" // For people and blogs
        },
        status: {
          privacyStatus,
          embeddable: true,
          license: "youtube",
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: videoStream,
      },
    });

    if(response.data.id){
      await db.insert(platform_uploads).values({
        platform: Platform.YouTube,
        platform_video_id: response.data.id.toString(),
        url: `https://youtu.be/${response.data.id}`,
        video_id: videoId
      });
    }


    return NextResponse.json({
      success: true,
      videoId: response.data.id,
      url: `https://youtu.be/${response.data.id}`
    });

  } catch (error) {
    console.error('YouTube upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' }, 
      { status: 500 }
    );
  }
}

async function fetchFromCloudinary(publicId: string): Promise<Buffer | null> {
  try {
    const videoUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'mp4',
    });

    const response = await fetch(videoUrl);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching video from Cloudinary:', error);
    return null;
  }
}

async function manualRefresh(refreshToken: string) {
  const res = await axios.post('https://oauth2.googleapis.com/token', null, {
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return res.data; // contains access_token, expires_in, maybe refresh_token
}