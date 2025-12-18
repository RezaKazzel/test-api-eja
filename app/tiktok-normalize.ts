import type { TikTokVideoResponse } from "./schema";

// Helper function to check if object has a property
const has = <K extends PropertyKey>(o: object, k: K): o is Record<K, unknown> => k in o;

// Type guard for SSSTik-style results (has video_hd, video_no_watermark, music_info)
function isSSSTik(r: any): r is any {
  return typeof r === 'object' && r !== null && (
    has(r, 'video_hd') || 
    has(r, 'video_no_watermark') || 
    has(r, 'music_info')
  );
}

// Type guard for MusicalDown-style results (has nwm_video_link, download_hd, download)  
function isMusicalDown(r: any): r is any {
  return typeof r === 'object' && r !== null && (
    has(r, 'nwm_video_link') || 
    has(r, 'download_hd') || 
    has(r, 'download')
  );
}

// Safe string extractor
function getString(obj: any, key: string): string | undefined {
  return typeof obj?.[key] === 'string' ? obj[key] : undefined;
}

// Safe number extractor
function getNumber(obj: any, key: string): number | undefined {
  return typeof obj?.[key] === 'number' ? obj[key] : undefined;
}

// Safe array extractor for strings
function getStringArray(obj: any, key: string): string[] | undefined {
  const arr = obj?.[key];
  if (Array.isArray(arr)) {
    const strings = arr.filter((item: any) => typeof item === 'string');
    return strings.length > 0 ? strings : undefined;
  }
  return undefined;
}

// Extract audio URL from various formats
function extractAudioUrl(r: any): string | undefined {
  // @tobyg74/tiktok-api-dl format
  if (r.music?.playUrl && Array.isArray(r.music.playUrl)) {
    const url = r.music.playUrl.find((url: any) => typeof url === 'string');
    if (url) return url;
  }
  
  // Direct string music URL
  if (typeof r.music === 'string') {
    return r.music;
  }
  
  // Music info object with playUrl array
  if (r.music_info?.playUrl && Array.isArray(r.music_info.playUrl)) {
    const url = r.music_info.playUrl.find((url: any) => typeof url === 'string');
    if (url) return url;
  }
  
  // Music info object with play string
  if (typeof r.music_info?.play === 'string') {
    return r.music_info.play;
  }
  
  // Other possible music URL locations
  if (typeof r.music_info?.url === 'string') {
    return r.music_info.url;
  }
  
  return undefined;
}

// Extract author name from various formats
function extractAuthor(r: any): string {
  // Direct author string
  if (typeof r.author === 'string') {
    return r.author;
  }
  
  // Author object with nickname
  if (typeof r.author?.nickname === 'string') {
    return r.author.nickname;
  }
  
  // Author object with uniqueId
  if (typeof r.author?.uniqueId === 'string') {
    return r.author.uniqueId;
  }
  
  // Author object with username
  if (typeof r.author?.username === 'string') {
    return r.author.username;
  }
  
  // Other possible locations
  if (typeof r.authorMeta?.name === 'string') {
    return r.authorMeta.name;
  }
  
  return "Unknown";
}

/**
 * Normalize TikTok API responses from different providers into a consistent format
 */
export function normalizeTikTokResponse(result: any): TikTokVideoResponse | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  console.log(`[TikTok Normalize] Detected result type: ${isSSSTik(result) ? 'SSSTik' : isMusicalDown(result) ? 'MusicalDown' : 'Generic'}`);

  // Extract video URLs based on provider type
  let download_url = '';
  let hd_download_url: string | undefined;
  let watermark_url: string | undefined;
  let no_watermark_url: string | undefined;

  if (isSSSTik(result)) {
    // SSSTik format
    hd_download_url = getString(result, 'video_hd');
    watermark_url = getString(result, 'video');
    no_watermark_url = getString(result, 'video_no_watermark');
    download_url = hd_download_url || no_watermark_url || watermark_url || '';
  } else if (isMusicalDown(result)) {
    // MusicalDown format
    hd_download_url = getString(result, 'download_hd');
    watermark_url = getString(result, 'download');
    no_watermark_url = getString(result, 'nwm_video_link');
    download_url = hd_download_url || no_watermark_url || watermark_url || '';
  } else {
    // Generic format - try common property names
    // Extract video URLs using safe property access
    const videoObj = (result as any).video;
    const possibleUrls = [
      // @tobyg74/tiktok-api-dl format  
      videoObj?.playAddr?.[0],
      videoObj?.downloadAddr?.[0], 
      typeof videoObj?.playAddr === 'string' ? videoObj.playAddr : undefined,
      typeof videoObj?.downloadAddr === 'string' ? videoObj.downloadAddr : undefined,
      // Other common formats
      getString(result, 'video_hd'),
      getString(result, 'video'),
      getString(result, 'download_hd'),
      getString(result, 'download'),
      getString(result, 'nwm_video_link'),
      getString(result, 'video_no_watermark'),
      getString(result, 'play_addr'),
      getString(result, 'url')
    ].filter(Boolean);
    
    if (possibleUrls.length > 0) {
      download_url = possibleUrls[0]!;
      hd_download_url = possibleUrls.find(url => url?.includes('hd') || url?.includes('high'));
      no_watermark_url = possibleUrls.find(url => url?.includes('nowm') || url?.includes('no_watermark'));
      watermark_url = possibleUrls.find(url => !url?.includes('nowm') && !url?.includes('no_watermark'));
    }
  }

  // If no download URL found, return null
  if (!download_url) {
    console.log('[TikTok Normalize] No download URL found in result');
    return null;
  }

  // Extract metadata
  const title = getString(result, 'title') || 
                getString(result, 'desc') || 
                getString(result, 'description') || 
                "TikTok Video";
                
  const author = extractAuthor(result);
  
  const duration = getNumber(result, 'duration') || 
                   getNumber(result, 'video_duration') || 
                   0;

  // Extract statistics
  const views = getNumber(result, 'play_count') || 
                getNumber(result, 'playCount') || 
                getNumber(result, 'views');
                
  const likes = getNumber(result, 'digg_count') || 
                getNumber(result, 'likeCount') || 
                getNumber(result, 'likes');
                
  const shares = getNumber(result, 'share_count') || 
                 getNumber(result, 'shareCount') || 
                 getNumber(result, 'shares');
                 
  const comments = getNumber(result, 'comment_count') || 
                   getNumber(result, 'commentCount') || 
                   getNumber(result, 'comments');

  const created_at = getString(result, 'create_time') || 
                     getString(result, 'createTime') || 
                     getString(result, 'uploaded_at');

  const description = getString(result, 'desc') || 
                      getString(result, 'description') || 
                      title;

  // Extract thumbnails
  let thumbnails;
  const cover = getString(result, 'cover') || 
                getString(result, 'thumbnail') || 
                getString(result, 'thumb');
  if (cover) {
    thumbnails = {
      static: cover,
      animated: getString(result, 'dynamic_cover') || getString(result, 'animated_cover'),
      cover: getString(result, 'origin_cover') || getString(result, 'original_cover') || cover,
    };
  }

  // Extract audio
  let audio;
  const audioUrl = extractAudioUrl(result);
  if (audioUrl) {
    audio = {
      url: audioUrl,
      title: (result.music_info && typeof result.music_info === 'object' ? result.music_info.title : null) ||
             getString(result, 'music_title') || 
             "Original Audio",
      author: (result.music_info && typeof result.music_info === 'object' ? result.music_info.author : null) ||
              getString(result, 'music_author') || 
              author,
      duration: (result.music_info && typeof result.music_info === 'object' ? result.music_info.duration : null) ||
                getNumber(result, 'music_duration'),
    };
  }

  // Extract images for slideshows
  const images = getStringArray(result, 'images') || 
                 getStringArray(result, 'image_urls') || 
                 getStringArray(result, 'photos');

  return {
    download_url,
    hd_download_url,
    watermark_url,
    no_watermark_url,
    metadata: {
      title,
      author,
      duration,
      views,
      likes,
      shares,
      comments,
      created_at,
      description,
    },
    thumbnails,
    audio,
    images,
  };
}

/**
 * Normalize user profile responses from different providers
 */
export function normalizeUserProfile(result: any): any {
  if (!result || typeof result !== 'object') {
    return null;
  }

  // Handle nested user object
  const userObj = result.user || result;

  return {
    username: getString(userObj, 'uniqueId') || 
              getString(userObj, 'username') || 
              getString(userObj, 'user_name') || 
              "unknown",
    display_name: getString(userObj, 'nickname') || 
                  getString(userObj, 'display_name') || 
                  getString(userObj, 'name') || 
                  "Unknown User",
    bio: getString(userObj, 'signature') || 
         getString(userObj, 'bio') || 
         getString(userObj, 'description') || 
         "",
    followers: getNumber(result.stats, 'followerCount') || 
               getNumber(userObj, 'followerCount') || 
               getNumber(userObj, 'followers'),
    following: getNumber(result.stats, 'followingCount') || 
               getNumber(userObj, 'followingCount') || 
               getNumber(userObj, 'following'),
    likes: getNumber(result.stats, 'heartCount') || 
           getNumber(userObj, 'heartCount') || 
           getNumber(userObj, 'likes'),
    videos: getNumber(result.stats, 'videoCount') || 
            getNumber(userObj, 'videoCount') || 
            getNumber(userObj, 'videos'),
    avatar: getString(userObj, 'avatarLarger') || 
            getString(userObj, 'avatarMedium') || 
            getString(userObj, 'avatar') || 
            getString(userObj, 'profile_pic_url'),
    verified: Boolean(userObj.verified),
  };
}
