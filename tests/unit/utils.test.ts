/**
 * Unit tests for utility functions
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateSpeakingDuration,
  detectSite,
  debounce,
  throttle,
} from '@/common/utils';

describe('Utils', () => {
  describe('calculateSpeakingDuration', () => {
    it('should calculate duration based on text length', () => {
      const text = 'Hello world';
      const duration = calculateSpeakingDuration(text, 1000, 50);
      const expected = 1000 + text.length * 50;
      expect(duration).toBe(expected);
    });

    it('should return base duration for empty text', () => {
      const duration = calculateSpeakingDuration('', 1000, 50);
      expect(duration).toBe(1000);
    });
  });

  describe('detectSite', () => {
    it('should detect ChatGPT site', () => {
      expect(detectSite('https://chatgpt.com/chat')).toBe('chatgpt');
      expect(detectSite('https://chat.openai.com/')).toBe('chatgpt');
    });

    it('should detect Gemini site', () => {
      expect(detectSite('https://gemini.google.com/')).toBe('gemini');
    });

    it('should return null for unknown sites', () => {
      expect(detectSite('https://example.com')).toBeNull();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });
});
