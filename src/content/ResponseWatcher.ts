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
  private processedElements = new WeakSet<Element>(); // Track elements we've already given up on
  private responseCompletionTimers = new Map<Element, NodeJS.Timeout>(); // Track completion timers for each response
  private lastTextLength = new Map<Element, number>(); // Track last text length for each element

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
      // Retry after 2 seconds if no responses found (max 10 attempts = 20 seconds)
      console.log(`⏳ No responses found yet, retrying in 2s (attempt ${attempt + 1}/10)...`);
      setTimeout(() => this.markExistingResponsesWithRetry(attempt + 1, onComplete), 2000);
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

    // Clear all completion timers
    this.responseCompletionTimers.forEach((timer) => clearTimeout(timer));
    this.responseCompletionTimers.clear();
    this.lastTextLength.clear();

    this.isRunning = false;
  }

  public onResponse(callback: (response: AiResponse) => void): void {
    this.callbacks.push(callback);
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      // Handle new nodes being added
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        this.checkForNewResponses(mutation.addedNodes);
      }

      // Handle text content changes (AI typing in existing element)
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        // Check if the mutation target or its parent is a response element
        let element = mutation.target as Element;

        // If target is a text node, get its parent element
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement as Element;
        }

        if (element && this.siteAdapter.isAiResponseElement(element)) {
          this.processResponseElement(element);
        } else if (element) {
          // Check if any ancestor is a response element
          const selector = this.siteAdapter.getResponseSelector();
          const responseElement = element.closest(selector);
          if (responseElement) {
            this.processResponseElement(responseElement);
          }
        }
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
      // Skip if we've already given up on this element (empty text after retries)
      if (this.processedElements.has(element)) {
        return;
      }

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
        // Give up after 3 retries and mark as processed to avoid re-checking
        this.pendingElements.delete(element);
        this.processedElements.add(element);
      }
      return;
    }

    // If element has text, remove it from processedElements (allow new responses)
    this.processedElements.delete(element);

    // Remove from pending if it was there
    this.pendingElements.delete(element);

    // Check if text is still changing (AI is still typing)
    const lastLength = this.lastTextLength.get(element) || 0;
    const currentLength = text.length;

    // If text length changed, AI is still typing
    if (currentLength !== lastLength) {
      this.lastTextLength.set(element, currentLength);

      // Clear existing completion timer
      const existingTimer = this.responseCompletionTimers.get(element);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Use shorter wait time (800ms) to be more responsive
      // This means: if text stops changing for 800ms, we consider it complete
      const completionTimer = setTimeout(() => {
        // Double-check the text length hasn't changed
        const finalText = this.siteAdapter.extractTextFromElement(element);
        const finalLength = finalText.length;

        if (finalLength === this.lastTextLength.get(element)) {
          console.log('✅ AI response completed, analyzing emotion...');
          this.finalizeResponse(element, finalText);
        }
      }, 800);

      this.responseCompletionTimers.set(element, completionTimer);

      // Log only on first detection
      if (lastLength === 0) {
        console.log('⏳ AI is typing, waiting for completion...');
      }

      return;
    }

    // If we reach here, text hasn't changed - finalize immediately
    this.finalizeResponse(element, text);
  }

  private finalizeResponse(element: Element, text: string): void {
    // Clean up timers and tracking
    const timer = this.responseCompletionTimers.get(element);
    if (timer) {
      clearTimeout(timer);
      this.responseCompletionTimers.delete(element);
    }
    this.lastTextLength.delete(element);

    // Don't add to processedElements - we want to allow new responses in the same element
    // processedElements is only for elements that never get text (to prevent infinite loops)

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

    // Schedule recheck after 1.5 seconds
    this.recheckTimeout = setTimeout(() => {
      if (this.pendingElements.size > 0) {
        const elements = Array.from(this.pendingElements.keys());
        // Don't clear the map, let processResponseElement handle it
        elements.forEach((el) => this.processResponseElement(el));
      }
      // Clear timeout reference
      this.recheckTimeout = null;
    }, 1500);
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
