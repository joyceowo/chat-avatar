/**
 * Application constants
 */

import type { ExtensionConfig } from './types';
import { AvatarState, LlmProvider, TargetSite } from './types';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  llmProvider: LlmProvider.NONE,
  avatarStyle: 'default',
  targetSites: [TargetSite.CHATGPT, TargetSite.GEMINI],
};

/**
 * Avatar state to image file mapping
 */
export const AVATAR_IMAGES: Record<AvatarState, string> = {
  [AvatarState.IDLE]: 'assets/avatar/idle.svg',
  [AvatarState.THINKING]: 'assets/avatar/thinking.svg',
  [AvatarState.SPEAKING]: 'assets/avatar/speaking.svg',
  [AvatarState.HAPPY]: 'assets/avatar/happy.svg',
  [AvatarState.SAD]: 'assets/avatar/sad.svg',
  [AvatarState.EXCITED]: 'assets/avatar/excited.svg',
  [AvatarState.CONFUSED]: 'assets/avatar/confused.svg',
};

/**
 * Avatar overlay DOM IDs
 */
export const AVATAR_OVERLAY_ID = 'ai-avatar-overlay';
export const AVATAR_IMAGE_ID = 'ai-avatar-img';

/**
 * Speaking duration calculation: minimum duration + per-character duration
 */
export const SPEAKING_BASE_DURATION_MS = 1000;
export const SPEAKING_DURATION_PER_CHAR_MS = 50;

/**
 * Chrome storage keys
 */
export const STORAGE_KEY_CONFIG = 'extensionConfig';

/**
 * Site-specific selectors
 */
export const SITE_SELECTORS = {
  [TargetSite.CHATGPT]: {
    responseContainer: '[data-message-author-role="assistant"]',
    userInputContainer: '[data-message-author-role="user"]',
    textContent: '.markdown',
  },
  [TargetSite.GEMINI]: {
    responseContainer: '.model-response-text',
    userInputContainer: '.user-query',
    textContent: '.message-content',
  },
} as const;
