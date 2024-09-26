interface MediaInfo {
  localThumbnailUri?: string;
  uri: string;
  id: string | number;
  projectId?: number;
  order?: number;
  thumbnailUri?: string;
  animatedImageUri?: string;
  width?: number;
  height?: number;
  canceled?: boolean;
  type?: 'image' | 'video';
  assetId?: string;
  fileName?: string;
  fileSize?: number;
  exif?: Record<string, any>;
  base64?: string;
  duration?: number;
}
