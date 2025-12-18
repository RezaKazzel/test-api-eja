import { NextRequest, NextResponse } from 'next/server';
import TiktokAPI from "@tobyg74/tiktok-api-dl";
import { ZodError } from "zod";
import { tikTokBatchDownloadRequestSchema, type TikTokBatchResponse } from '../../../schema';
import { normalizeTikTokResponse } from '../../../tiktok-normalize';

const { Downloader } = TiktokAPI;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = tikTokBatchDownloadRequestSchema.parse(body);
    const { urls, version = "v2", proxy } = validatedData;

    console.log(`[TikTok API] Batch downloading ${urls.length} URLs with version: ${version}`);

    // Configure options for the downloader
    const options: any = { version };
    if (proxy) {
      options.proxy = proxy;
    }

    // Process each URL
    const results = [];
    let processedCount = 0;

    for (const url of urls) {
      try {
        console.log(`[TikTok API] Processing URL ${processedCount + 1}/${urls.length}: ${url}`);
        
        const result = await Downloader(url, options);
        processedCount++;

        if (result && result.status === "success") {
          const normalizedVideo = normalizeTikTokResponse(result.result);
          
          if (normalizedVideo) {
            results.push({
              url,
              success: true,
              video: normalizedVideo,
            });
          } else {
            results.push({
              url,
              success: false,
              error: "Failed to parse video data",
            });
          }
        } else {
          results.push({
            url,
            success: false,
            error: result?.message || "Failed to download",
          });
        }
      } catch (urlError) {
        console.error(`[TikTok API] Error processing ${url}:`, urlError);
        results.push({
          url,
          success: false,
          error: urlError instanceof Error ? urlError.message : "Unknown error",
        });
        processedCount++;
      }
    }

    const processingTime = `${(Date.now() - startTime) / 1000}s`;
    console.log(`[TikTok API] Batch processing completed in ${processingTime}`);

    const response: TikTokBatchResponse = {
      success: true,
      results,
      total_processed: processedCount,
      processing_time: processingTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = `${(Date.now() - startTime) / 1000}s`;
    console.error("[TikTok API] Batch download error:", error);

    if (error instanceof ZodError) {
      const errorResponse: TikTokBatchResponse = {
        success: false,
        results: [],
        total_processed: 0,
        processing_time: processingTime,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    } else {
      const errorResponse: TikTokBatchResponse = {
        success: false,
        results: [],
        total_processed: 0,
        processing_time: processingTime,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
  }
}
