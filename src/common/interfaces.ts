/**
 * Core interfaces following SOLID principles
 */

import type { AiResponse, AvatarState, EmotionAnalysis, ExtensionConfig } from './types';

/**
 * Interface for watching and extracting AI responses from DOM
 */
export interface IResponseWatcher {
  start(): void;
  stop(): void;
  onResponse(callback: (response: AiResponse) => void): void;
}

/**
 * Interface for controlling avatar display and state
 */
export interface IAvatarController {
  setState(state: AvatarState): void;
  getState(): AvatarState;
  onStateChange(callback: (state: AvatarState) => void): void;
}

/**
 * Interface for managing avatar overlay UI
 */
export interface IAvatarOverlay {
  show(): void;
  hide(): void;
  setImage(imageUrl: string): void;
  setPosition(x: number, y: number): void;
  enableDragging(): void;
  disableDragging(): void;
}

/**
 * Interface for configuration management
 */
export interface IConfigService {
  get(): Promise<ExtensionConfig>;
  set(config: Partial<ExtensionConfig>): Promise<void>;
  onConfigChange(callback: (config: ExtensionConfig) => void): void;
}

/**
 * Interface for LLM adapters (Strategy pattern)
 */
export interface ILlmAdapter {
  analyzeEmotion(text: string): Promise<EmotionAnalysis>;
  isConfigured(): boolean;
}

/**
 * Interface for site-specific DOM selectors (Strategy pattern)
 */
export interface ISiteAdapter {
  getResponseSelector(): string;
  getUserInputSelector(): string;
  isAiResponseElement(element: Element): boolean;
  extractTextFromElement(element: Element): string;
}

/**
 * Factory interface for creating LLM adapters
 */
export interface ILlmAdapterFactory {
  create(provider: string, config: { apiKey?: string; modelName?: string }): ILlmAdapter;
}

/**
 * Factory interface for creating site adapters
 */
export interface ISiteAdapterFactory {
  create(site: string): ISiteAdapter;
}
