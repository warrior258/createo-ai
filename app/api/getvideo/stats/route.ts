import { NextResponse } from "next/server";
import { db, platform_uploads, user_videos } from "@/app/utils/dbconnect";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/utils/auth";
import { Platform } from "@/app/types";

// Helper function to get the month index (0-based)
const getMonthIndex = (date: Date) => new Date(date).getMonth();

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query to get video data (created videos)
    const videos = await db.query.user_videos.findMany({
      where: eq(user_videos.googleId, currentUser.userId)
    });

    // Query to get platform uploads data (YouTube)
    const youtubeUploads = await db.query.platform_uploads.findMany({
      where: eq(platform_uploads.platform, Platform.YouTube)
    });

    // Initialize counters for created and uploaded videos per month
    const monthlyCounts = {
      createVideo: Array(12).fill(0),
      uploadVideo: Array(12).fill(0),
    };

    // Count created videos by month
    videos.forEach((video) => {
      const monthIndex = getMonthIndex(video.created_at!);
      monthlyCounts.createVideo[monthIndex]++;
    });

    // Count uploaded videos (YouTube) by month
    youtubeUploads.forEach((upload) => {
      const monthIndex = getMonthIndex(upload.created_at!);
      monthlyCounts.uploadVideo[monthIndex]++;
    });

    // Prepare the final data for the graph
    const chartData = [
      { month: "January", createVideo: monthlyCounts.createVideo[0], uploadVideo: monthlyCounts.uploadVideo[0] },
      { month: "February", createVideo: monthlyCounts.createVideo[1], uploadVideo: monthlyCounts.uploadVideo[1] },
      { month: "March", createVideo: monthlyCounts.createVideo[2], uploadVideo: monthlyCounts.uploadVideo[2] },
      { month: "April", createVideo: monthlyCounts.createVideo[3], uploadVideo: monthlyCounts.uploadVideo[3] },
      { month: "May", createVideo: monthlyCounts.createVideo[4], uploadVideo: monthlyCounts.uploadVideo[4] },
      { month: "June", createVideo: monthlyCounts.createVideo[5], uploadVideo: monthlyCounts.uploadVideo[5] },
      { month: "July", createVideo: monthlyCounts.createVideo[6], uploadVideo: monthlyCounts.uploadVideo[6] },
      { month: "August", createVideo: monthlyCounts.createVideo[7], uploadVideo: monthlyCounts.uploadVideo[7] },
      { month: "September", createVideo: monthlyCounts.createVideo[8], uploadVideo: monthlyCounts.uploadVideo[8] },
      { month: "October", createVideo: monthlyCounts.createVideo[9], uploadVideo: monthlyCounts.uploadVideo[9] },
      { month: "November", createVideo: monthlyCounts.createVideo[10], uploadVideo: monthlyCounts.uploadVideo[10] },
      { month: "December", createVideo: monthlyCounts.createVideo[11], uploadVideo: monthlyCounts.uploadVideo[11] },
    ];

    // Return the result in the desired format for the graph
    return NextResponse.json({
      status: "success",
      totalVideos: videos.length,
      uploadedVideos: youtubeUploads.length,
      chartData
    });
  } catch (error) {
    console.error("Error fetching graph data", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
