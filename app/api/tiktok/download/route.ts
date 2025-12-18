import { NextRequest, NextResponse } from 'next/server';
import TiktokAPI from "@tobyg74/tiktok-api-dl";
import { ZodError } from "zod";
import { tikTokDownloadRequestSchema, type TikTokDownloadResponse } from '../../../schema';
import { normalizeTikTokResponse } from '../../../tiktok-normalize';

const { Downloader } = TiktokAPI;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = tikTokDownloadRequestSchema.parse(body);
    const { url, version = "v2", proxy } = validatedData;

    console.log(`[TikTok API] Downloading from URL: ${url} with version: ${version}`);

    // Configure options for the downloader
    const options: any = { version };
    if (proxy) {
      options.proxy = proxy;
    }

    // Call the TikTok downloader
    const result = await Downloader(url, options);
    const processingTime = `${(Date.now() - startTime) / 1000}s`;

    console.log(`[TikTok API] Download completed in ${processingTime}`);

    // Transform the result to match our schema
    if (result && result.status === "success") {
      const normalizedVideo = normalizeTikTokResponse(result.result);
      
      if (normalizedVideo) {
        const response: TikTokDownloadResponse = {
          success: true,
          video: normalizedVideo,
          processing_time: processingTime,
        };
        return NextResponse.json(response);
      } else {
        const errorResponse: TikTokDownloadResponse = {
          success: false,
          error: "Failed to parse TikTok video data",
          processing_time: processingTime,
        };
        return NextResponse.json(errorResponse, { status: 422 });
      }
    } else {
      const errorResponse: TikTokDownloadResponse = {
        success: false,
        error: result?.message || "Failed to download TikTok content",
        processing_time: processingTime,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
  } catch (error) {
    const processingTime = `${(Date.now() - startTime) / 1000}s`;
    console.error("[TikTok API] Error:", error);

    if (error instanceof ZodError) {
      const errorResponse: TikTokDownloadResponse = {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`,
        processing_time: processingTime,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    } else {
      const errorResponse: TikTokDownloadResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        processing_time: processingTime,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
  }
}
