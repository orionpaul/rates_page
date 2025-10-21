-- Migration: Add 'video' media type support
-- This allows uploading HTML5 video files (.mp4, .webm, .ogg) for maximum browser compatibility
-- Run this in your Supabase SQL editor or database client

-- Update the media table to support 'video' type
ALTER TABLE media
DROP CONSTRAINT IF EXISTS media_type_check;

ALTER TABLE media
ADD CONSTRAINT media_type_check
CHECK (type IN ('youtube', 'image', 'video'));

-- Add comment for documentation
COMMENT ON COLUMN media.type IS 'Media type: youtube (YouTube videos), image (static images), video (HTML5 video files - mp4, webm, ogg)';
