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
          // LLM not configured, use default behavior
          console.log('⚠️ Background service error, using default behavior');
          this.controller?.onNewResponse(response.text);
          return;
        }

        console.log('🧠 Emotion analysis result:', result);

        if (result && result.emotion) {
          // Use analyzed emotion
          console.log('✨ Using emotion:', result.emotion, `(confidence: ${result.confidence || 'N/A'})`);
          this.controller?.onNewResponse(response.text, result.emotion);
        } else {
          // Fallback to default (no emotion parameter = will use SPEAKING)
          console.log('💬 Using default SPEAKING state');
          this.controller?.onNewResponse(response.text);
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

  private handleConfigUpdate(): void {
    // Could reload the extension or update settings
    console.log('Configuration updated');
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
