import { NextRequest, NextResponse } from "next/server";
import TiktokAPI from "@tobyg74/tiktok-api-dl";
import { type TikTokUserResponse } from "../../../../schema";
import { normalizeUserProfile } from "../../../../tiktok-normalize";

const { StalkUser, GetUserPosts } = TiktokAPI;

export async function GET(req: NextRequest, context: any) {
  const startTime = Date.now();

  try {
    const { username } = context.params; // ✅ ambil param dari context
    const { searchParams } = new URL(req.url);
    const include_videos = searchParams.get("include_videos") === "true";

    console.log(`[TikTok API] Fetching user profile: ${username}`);

    // Get user profile
    const userResult = await StalkUser(username);

    let recentVideos: any[] = [];
    if (include_videos && userResult?.status === "success") {
      try {
        const postsResult = await GetUserPosts(username, { postLimit: 5 });
        if (
          postsResult?.status === "success" &&
          Array.isArray(postsResult.result)
        ) {
          recentVideos = postsResult.result.slice(0, 5).map((video: any) => ({
            id: video.video_id || video.id || Math.random().toString(36),
            url: video.play_addr || video.video_url || video.url,
            title: video.desc || video.title || "TikTok Video",
            views: video.statistics?.play_count || video.play_count,
            created_at: video.create_time || video.createTime,
          }));
        }
      } catch (postsError) {
        console.warn("[TikTok API] Failed to fetch user posts:", postsError);
      }
    }

    const processingTime = `${(Date.now() - startTime) / 1000}s`;

    if (userResult && userResult.status === "success") {
      const normalizedUser = normalizeUserProfile(userResult.result);

      const response: TikTokUserResponse = {
        success: true,
        user: {
          ...normalizedUser,
          recent_videos: recentVideos.length > 0 ? recentVideos : undefined,
        },
      };
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: userResult?.message || "Failed to fetch user profile",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("[TikTok API] User profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
