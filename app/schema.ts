import { z } from "zod";

// TikTok API Schemas
export const tikTokDownloadRequestSchema = z.object({
  url: z.string().url("Must provide a valid TikTok URL"),
  version: z.enum(["v1", "v2", "v3"]).optional().default("v2"),
  proxy: z.string().url().optional(),
});

export const tikTokBatchDownloadRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10, "Maximum 10 URLs per batch request"),
  version: z.enum(["v1", "v2", "v3"]).optional().default("v2"),
  proxy: z.string().url().optional(),
});

export const tikTokUserRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  include_videos: z.boolean().optional().default(false),
});

export const tikTokMetadataSchema = z.object({
  title: z.string(),
  author: z.string(),
  duration: z.number(),
  views: z.number().optional(),
  likes: z.number().optional(),
  shares: z.number().optional(),
  comments: z.number().optional(),
  created_at: z.string().optional(),
  description: z.string().optional(),
});

export const tikTokThumbnailSchema = z.object({
  static: z.string().url().optional(),
  animated: z.string().url().optional(),
  cover: z.string().url().optional(),
});

export const tikTokAudioSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  author: z.string().optional(),
  duration: z.number().optional(),
});

export const tikTokVideoResponseSchema = z.object({
  download_url: z.string().url(),
  hd_download_url: z.string().url().optional(),
  watermark_url: z.string().url().optional(),
  no_watermark_url: z.string().url().optional(),
  metadata: tikTokMetadataSchema,
  thumbnails: tikTokThumbnailSchema.optional(),
  audio: tikTokAudioSchema.optional(),
  images: z.array(z.string().url()).optional(), // For slideshows
});

export const tikTokUserProfileSchema = z.object({
  username: z.string(),
  display_name: z.string(),
  bio: z.string().optional(),
  followers: z.number().optional(),
  following: z.number().optional(),
  likes: z.number().optional(),
  videos: z.number().optional(),
  avatar: z.string().url().optional(),
  verified: z.boolean().optional(),
  recent_videos: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    title: z.string(),
    views: z.number().optional(),
    created_at: z.string().optional(),
  })).optional(),
});

export const tikTokDownloadResponseSchema = z.object({
  success: z.boolean(),
  video: tikTokVideoResponseSchema.optional(),
  error: z.string().optional(),
  processing_time: z.string().optional(),
});

export const tikTokBatchResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(z.object({
    url: z.string(),
    success: z.boolean(),
    video: tikTokVideoResponseSchema.optional(),
    error: z.string().optional(),
  })),
  total_processed: z.number(),
  processing_time: z.string(),
});

export const tikTokUserResponseSchema = z.object({
  success: z.boolean(),
  user: tikTokUserProfileSchema.optional(),
  error: z.string().optional(),
});

// Export types
export type TikTokDownloadRequest = z.infer<typeof tikTokDownloadRequestSchema>;
export type TikTokBatchDownloadRequest = z.infer<typeof tikTokBatchDownloadRequestSchema>;
export type TikTokUserRequest = z.infer<typeof tikTokUserRequestSchema>;
export type TikTokVideoResponse = z.infer<typeof tikTokVideoResponseSchema>;
export type TikTokDownloadResponse = z.infer<typeof tikTokDownloadResponseSchema>;
export type TikTokBatchResponse = z.infer<typeof tikTokBatchResponseSchema>;
export type TikTokUserResponse = z.infer<typeof tikTokUserResponseSchema>;
export type TikTokMetadata = z.infer<typeof tikTokMetadataSchema>;
export type TikTokUserProfile = z.infer<typeof tikTokUserProfileSchema>;
