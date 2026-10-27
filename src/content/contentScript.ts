/**
 * Content Script - Main entry point for the extension
 * Orchestrates all components following Dependency Injection pattern
 */

import { AvatarOverlay } from '@/avatar/AvatarOverlay';
import { AvatarController } from '@/avatar/AvatarController';
import { ResponseWatcher } from './ResponseWatcher';
import { SiteAdapterFactory } from '@/adapters/SiteAdapterFactory';
import { detectSite } from '@/common/utils';
import { TargetSite, MessageType, AvatarState } from '@/common/types';
import type { AiResponse, ExtensionMessage, EmotionAnalysis } from '@/common/types';
import { STORAGE_KEY_CUSTOM_AVATARS } from '@/common/constants';

class ContentScriptApp {
  private overlay: AvatarOverlay | null = null;
  private controller: AvatarController | null = null;
  private watcher: ResponseWatcher | null = null;
  private siteAdapterFactory: SiteAdapterFactory;
  private currentSite: string | null = null;

  constructor() {
    this.siteAdapterFactory = new SiteAdapterFactory();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Detect current site
    this.currentSite = detectSite(window.location.href);
    if (!this.currentSite) {
      console.warn('AI Avatar Overlay: Unsupported site');
      return;
    }

    try {
      // Initialize components
      this.overlay = new AvatarOverlay();
      this.controller = new AvatarController(this.overlay);

      // Load custom avatars from config
      await this.loadCustomAvatars();

      // Enable dragging
      this.overlay.enableDragging();

      // Set up response watcher
      const siteAdapter = this.siteAdapterFactory.create(this.currentSite);
      this.watcher = new ResponseWatcher(siteAdapter, this.currentSite as TargetSite);

      // Listen for AI responses
      this.watcher.onResponse((response) => this.handleAiResponse(response));

      // Start the watcher immediately
      // It will handle marking existing responses internally
      this.watcher.start();

      console.log('AI Avatar Overlay: Initialized successfully');

      // Listen for messages from background
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    } catch (error) {
      console.error('AI Avatar Overlay: Initialization failed', error);
    }
  }

  private async loadCustomAvatars(): Promise<void> {
    try {
      // Load custom avatars from local storage (larger quota)
      const result = await chrome.storage.local.get(STORAGE_KEY_CUSTOM_AVATARS);
      const customAvatars = result[STORAGE_KEY_CUSTOM_AVATARS];

      if (customAvatars && this.controller) {
        this.controller.setCustomAvatars(customAvatars);
        console.log('✅ Custom avatars loaded:', Object.keys(customAvatars).length, 'states');
      }
    } catch (error) {
      console.error('Failed to load custom avatars:', error);
    }
  }

  private handleAiResponse(response: AiResponse): void {
    if (!this.controller) return;

    console.log('📨 Handling AI response in contentScript');

    // Check if LLM emotion analysis is enabled
    this.checkEmotionAnalysis(response);
  }

  private async checkEmotionAnalysis(response: AiResponse): Promise<void> {
    try {
      // Request emotion analysis from background
      const message: ExtensionMessage<AiResponse> = {
        type: MessageType.ANALYZE_EMOTION,
        payload: response,
      };

      chrome.runtime.sendMessage(message, (result) => {
        if (chrome.runtime.lastError) {
          // LLM not configured, keep current state
          console.log('⚠️ Background service error, keeping current state');
          return;
        }

        console.log('🧠 Emotion analysis result:', result);

        if (result && result.emotion) {
          // Use analyzed emotion
          console.log('✨ Using emotion:', result.emotion, `(confidence: ${result.confidence || 'N/A'})`);
          this.controller?.onNewResponse(response.text, result.emotion);
        } else {
          // No emotion detected, keep current state
          console.log('💬 No emotion detected, keeping current state');
        }
      });
    } catch (error) {
      // Fallback to default behavior
      this.controller?.onNewResponse(response.text);
    }
  }

  private handleMessage(
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean {
    switch (message.type) {
      case MessageType.EMOTION_RESULT: {
        const result = message.payload as EmotionAnalysis;
        // This could be used for future enhancements
        console.log('Emotion analysis result:', result);
        sendResponse({ success: true });
        break;
      }
      case MessageType.CONFIG_UPDATED:
        // Reload or update configuration
        this.handleConfigUpdate();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
    return true; // Keep message channel open for async response
  }

  private async handleConfigUpdate(): Promise<void> {
    // Reload custom avatars when config is updated
    console.log('Configuration updated, reloading custom avatars...');
    await this.loadCustomAvatars();
  }

  public destroy(): void {
    this.watcher?.destroy();
    this.controller?.destroy();
    this.overlay?.destroy();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContentScriptApp());
} else {
  new ContentScriptApp();
}
