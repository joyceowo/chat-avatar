/**
 * Utility functions
 */

import type { ExtensionMessage } from './types';

/**
 * Create a typed extension message
 */
export function createMessage<T>(type: string, payload: T): ExtensionMessage<T> {
  return { type: type as never, payload };
}

/**
 * Get Chrome extension URL for an asset
 */
export function getAssetUrl(path: string): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const url = chrome.runtime.getURL(path);
      if (url) {
        return url;
      }
    }
  } catch (error) {
    console.error('Error getting asset URL:', error);
  }

  // Fallback: return path as-is (will fail but won't crash)
  console.warn(`Failed to get chrome extension URL for: ${path}`);
  return path;
}

/**
 * Calculate speaking duration based on text length
 */
export function calculateSpeakingDuration(text: string, baseMs = 1000, perCharMs = 50): number {
  return baseMs + text.length * perCharMs;
}

/**
 * Detect current site from URL
 */
export function detectSite(url: string): string | null {
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
    return 'chatgpt';
  }
  if (url.includes('gemini.google.com')) {
    return 'gemini';
  }
  return null;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
