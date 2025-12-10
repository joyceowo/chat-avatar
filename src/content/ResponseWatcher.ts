/**
 * ResponseWatcher - Observes DOM for new AI responses
 * Uses MutationObserver for efficient DOM monitoring
 */

import type { IResponseWatcher, ISiteAdapter } from '@/common/interfaces';
import type { AiResponse } from '@/common/types';
import { TargetSite } from '@/common/types';
import { throttle } from '@/common/utils';

export class ResponseWatcher implements IResponseWatcher {
  private observer: MutationObserver | null = null;
  private callbacks: Array<(response: AiResponse) => void> = [];
  private processedResponses = new Set<string>();
  private isRunning = false;
  private pendingElements = new Map<Element, number>(); // Track elements and retry count
  private recheckTimeout: NodeJS.Timeout | null = null;

  constructor(
    private siteAdapter: ISiteAdapter,
    private site: TargetSite
  ) {}

  public start(): void {
    if (this.isRunning) return;

    console.log('👀 ResponseWatcher: Starting...');

    // Mark existing responses FIRST before starting observer
    // This prevents treating history as new responses
    this.markExistingResponsesWithRetry(0, () => {
      // Only start observer after marking is complete
      this.observer = new MutationObserver(
        throttle(this.handleMutations.bind(this), 300)
      );

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,      // Watch for text changes
        characterDataOldValue: true,
      });

      this.isRunning = true;
      console.log('✅ ResponseWatcher: Observer started and monitoring');
    });
  }

  private markExistingResponsesWithRetry(attempt: number = 0, onComplete?: () => void): void {
    const selector = this.siteAdapter.getResponseSelector();
    const existingResponses = document.querySelectorAll(selector);

    if (existingResponses.length === 0 && attempt < 10) {
      // Retry after 500ms if no responses found (max 10 attempts = 5 seconds)
      console.log(`⏳ No responses found yet, retrying in 0.5s (attempt ${attempt + 1}/10)...`);
      setTimeout(() => this.markExistingResponsesWithRetry(attempt + 1, onComplete), 500);
      return;
    }

    let lastResponseText: string | null = null;
    let processedCount = 0;

    existingResponses.forEach((element, index) => {
      const text = this.siteAdapter.extractTextFromElement(element);
      if (text && text.length >= 3) {
        const textHash = this.hashText(text);
        this.processedResponses.add(textHash);
        processedCount++;

        // Keep track of the last response
        if (index === existingResponses.length - 1) {
          lastResponseText = text;
        }
      }
    });

    console.log(`📚 Marked ${processedCount} existing responses as processed (found ${existingResponses.length} elements)`);

    // Trigger emotion analysis for the last response to set initial avatar state
    if (lastResponseText) {
      console.log('🎨 Analyzing last response to set initial avatar state...');
      const lastResponse: AiResponse = {
        text: lastResponseText,
        timestamp: Date.now(),
        site: this.site,
      };
      this.notifyCallbacks(lastResponse);
    }

    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isRunning = false;
  }

  public onResponse(callback: (response: AiResponse) => void): void {
    this.callbacks.push(callback);
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        this.checkForNewResponses(mutation.addedNodes);
      }
    }
  }

  private checkForNewResponses(nodes: NodeList): void {
    nodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node as Element;

      // Check if this node or its descendants contain AI responses
      if (this.siteAdapter.isAiResponseElement(element)) {
        this.processResponseElement(element);
      }

      // Also check descendants
      const selector = this.siteAdapter.getResponseSelector();
      const responseElements = element.querySelectorAll(selector);
      responseElements.forEach((el) => this.processResponseElement(el));
    });
  }

  private processResponseElement(element: Element): void {
    const text = this.siteAdapter.extractTextFromElement(element);

    // If text is empty or too short, add to pending and schedule recheck
    if (!text || text.length < 3) {
      const retryCount = this.pendingElements.get(element) || 0;

      // Max 3 retries to avoid infinite loop
      if (retryCount < 3) {
        this.pendingElements.set(element, retryCount + 1);
        // Only log on first attempt to reduce noise
        if (retryCount === 0) {
          console.log(`⏳ Waiting for AI response text...`);
        }
        this.scheduleRecheck();
      } else {
        // Give up after 3 retries (silently, this is normal for UI elements)
        this.pendingElements.delete(element);
      }
      return;
    }

    // Remove from pending if it was there
    this.pendingElements.delete(element);

    // Create a hash of the text to track processed responses
    const textHash = this.hashText(text);

    // Ignore duplicate responses
    if (this.processedResponses.has(textHash)) {
      // Don't log duplicates to reduce noise
      return;
    }

    // Mark as processed
    this.processedResponses.add(textHash);

    // Limit the set size to prevent memory leaks (keep last 100 responses)
    if (this.processedResponses.size > 100) {
      const firstItem = this.processedResponses.values().next().value;
      if (firstItem) {
        this.processedResponses.delete(firstItem);
      }
    }

    const response: AiResponse = {
      text,
      timestamp: Date.now(),
      site: this.site,
    };

    console.log('🤖 NEW AI Response:', {
      site: this.site,
      textLength: text.length,
      preview: text.substring(0, 50) + '...',
      hash: textHash.substring(0, 8),
    });

    this.notifyCallbacks(response);
  }

  private scheduleRecheck(): void {
    // Clear existing timeout
    if (this.recheckTimeout) {
      clearTimeout(this.recheckTimeout);
    }

    // Schedule recheck after 2 seconds (increased from 1 second)
    this.recheckTimeout = setTimeout(() => {
      if (this.pendingElements.size > 0) {
        const elements = Array.from(this.pendingElements.keys());
        // Don't clear the map, let processResponseElement handle it
        elements.forEach((el) => this.processResponseElement(el));
      }
    }, 2000);
  }

  private hashText(text: string): string {
    // Simple hash function for text deduplication
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private notifyCallbacks(response: AiResponse): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(response);
      } catch (error) {
        console.error('Error in response callback:', error);
      }
    });
  }

  public destroy(): void {
    this.stop();
    this.callbacks = [];
    this.processedResponses.clear();
  }
}
