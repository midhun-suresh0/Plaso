/**
 * Utility functions for the Plaso mobile app.
 */

import { config } from '../constants/config';

/**
 * Format a timestamp to a human-readable string.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get full image URL using the backend base URL for relative paths,
 * and seamlessly rewrites localhost/127.0.0.1 image URLs so they load on mobile devices.
 */
export function getImageUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;

  const baseHost = config.api.baseUrl.replace(/\/api\/?$/, '');

  // 1. If image URL contains localhost:5000 or 127.0.0.1:5000, rewrite to active backend host
  if (path.includes('localhost:5000') || path.includes('127.0.0.1:5000')) {
    return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, baseHost);
  }

  // 2. If it's already a full external URL (Imgur, Cloudinary, S3, data URI, blob URI)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('file:') || path.startsWith('blob:')) {
    return path;
  }

  // 3. Relative path: prefix with active baseHost
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseHost}${cleanPath}`;
}
