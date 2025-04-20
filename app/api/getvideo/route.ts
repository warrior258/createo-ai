import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db, platform_uploads, user_videos } from "@/app/utils/dbconnect";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/utils/auth";
import { Platform } from "@/app/types";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {

    const currentUser = await getCurrentUser();
    if (!currentUser?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch videos from Cloudinary
    // const result = await cloudinary.api.resources({
    //   type: "upload",
    //   resource_type: "video", // Fetch only videos
    //   prefix: "remotion-videos",
    //   max_results: 10, // Limit the number of results
    // });

    // console.log(result)

    // // Extract video details
    // const videos = result.resources.map((video: any) => ({
    //   asset_id: video.asset_id,
    //   public_id: video.public_id,
    //   url: video.secure_url,
    //   format: video.format,
    //   dimensions: `${video.width} x ${video.height}`,
    //   bytes: video.bytes,
    //   created_at: video.created_at,
    // }));

    // const videos = await db.select()
    // .from(user_videos)
    // .leftJoin(platform_uploads, eq(user_videos.id, platform_uploads.video_id))
    // .where(eq(user_videos.googleId, currentUser.userId));

    const videos = await db.query.user_videos.findMany({
      where: eq(user_videos.googleId, currentUser.userId),
      with: {
        platform_uploads: {
          where: eq(platform_uploads.platform, Platform.YouTube) // currently only getting the yt videos 
        }
      },
    });
    

    return NextResponse.json({ status: "success", videos });
  } catch (error) {
    console.error("Error fetching videos", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}