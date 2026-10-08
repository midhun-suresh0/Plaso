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
 * Get full image URL using the backend base URL for relative paths.
 */
export function getImageUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('file:') || path.startsWith('blob:')) {
    return path;
  }
  return config.api.baseUrl.replace('/api', '') + (path.startsWith('/') ? path : `/${path}`);
}
