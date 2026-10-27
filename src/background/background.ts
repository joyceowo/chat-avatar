/**
 * Background Service Worker - Handles LLM API calls and configuration
 * Orchestrates background services
 */

import { ConfigService } from './ConfigService';
import { LlmAdapterFactory } from '@/adapters/LlmAdapterFactory';
import type { IConfigService, ILlmAdapter } from '@/common/interfaces';
import type { ExtensionMessage, AiResponse, EmotionAnalysis } from '@/common/types';
import { MessageType, LlmProvider } from '@/common/types';

class BackgroundService {
  private configService: IConfigService;
  private llmAdapterFactory: LlmAdapterFactory;
  private currentAdapter: ILlmAdapter | null = null;

  constructor() {
    this.configService = new ConfigService();
    this.llmAdapterFactory = new LlmAdapterFactory();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load initial configuration
    const config = await this.configService.get();
    this.updateLlmAdapter(config.llmProvider, {
      apiKey: config.apiKey,
      modelName: config.modelName,
    });

    // Listen for config changes
    this.configService.onConfigChange((newConfig) => {
      this.updateLlmAdapter(newConfig.llmProvider, {
        apiKey: newConfig.apiKey,
        modelName: newConfig.modelName,
      });
    });

    // Set up message listener
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    console.log('AI Avatar Overlay Background: Initialized');
  }

  private updateLlmAdapter(
    provider: LlmProvider,
    config: { apiKey?: string; modelName?: string }
  ): void {
    this.currentAdapter = this.llmAdapterFactory.create(provider, config);
  }

  private handleMessage(
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean {
    switch (message.type) {
      case MessageType.ANALYZE_EMOTION:
        this.handleEmotionAnalysis(message.payload as AiResponse, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_CONFIG:
        this.handleGetConfig(sendResponse);
        return true;

      default:
        sendResponse({ error: 'Unknown message type' });
        return false;
    }
  }

  private async handleEmotionAnalysis(
    response: AiResponse,
    sendResponse: (response?: unknown) => void
  ): Promise<void> {
    try {
      if (!this.currentAdapter || !this.currentAdapter.isConfigured()) {
        // No LLM configured, return default
        sendResponse({
          emotion: null,
          confidence: 0,
        });
        return;
      }

      const result: EmotionAnalysis = await this.currentAdapter.analyzeEmotion(
        response.text
      );
      sendResponse(result);
    } catch (error) {
      console.error('Emotion analysis error:', error);
      sendResponse({
        emotion: null,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleGetConfig(sendResponse: (response?: unknown) => void): Promise<void> {
    try {
      const config = await this.configService.get();
      sendResponse({ config });
    } catch (error) {
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

// Initialize background service
new BackgroundService();
