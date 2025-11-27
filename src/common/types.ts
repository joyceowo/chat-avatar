/**
 * Core domain types for the AI Avatar Overlay extension
 */

/**
 * Avatar state representing current activity
 */
export enum AvatarState {
  IDLE = 'idle',
  THINKING = 'thinking',
  SPEAKING = 'speaking',
  HAPPY = 'happy',
  SAD = 'sad',
  EXCITED = 'excited',
  CONFUSED = 'confused',
}

/**
 * Supported LLM providers for emotion analysis
 */
export enum LlmProvider {
  NONE = 'none',
  GEMINI = 'gemini',
  OPENAI = 'openai',
}

/**
 * Supported target websites
 */
export enum TargetSite {
  CHATGPT = 'chatgpt',
  GEMINI = 'gemini',
}

/**
 * Configuration stored in Chrome storage
 */
export interface ExtensionConfig {
  enabled: boolean;
  llmProvider: LlmProvider;
  apiKey?: string;
  modelName?: string;
  avatarStyle: string;
  targetSites: TargetSite[];
}

/**
 * AI response data extracted from page
 */
export interface AiResponse {
  text: string;
  timestamp: number;
  site: TargetSite;
}

/**
 * Emotion analysis result from LLM
 */
export interface EmotionAnalysis {
  emotion: AvatarState;
  confidence: number;
  reasoning?: string;
}

/**
 * Avatar position on screen
 */
export interface AvatarPosition {
  x: number;
  y: number;
}

/**
 * Message types for communication between content script and background
 */
export enum MessageType {
  ANALYZE_EMOTION = 'ANALYZE_EMOTION',
  EMOTION_RESULT = 'EMOTION_RESULT',
  CONFIG_UPDATED = 'CONFIG_UPDATED',
  GET_CONFIG = 'GET_CONFIG',
}

/**
 * Message structure for extension communication
 */
export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload: T;
}
