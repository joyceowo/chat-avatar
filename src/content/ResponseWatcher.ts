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
  private lastProcessedText = '';
  private isRunning = false;

  constructor(
    private siteAdapter: ISiteAdapter,
    private site: TargetSite
  ) {}

  public start(): void {
    if (this.isRunning) return;

    this.observer = new MutationObserver(
      throttle(this.handleMutations.bind(this), 500)
    );

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.isRunning = true;
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
      if (mutation.type === 'childList') {
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

    // Ignore empty or duplicate responses
    if (!text || text === this.lastProcessedText) {
      return;
    }

    this.lastProcessedText = text;

    const response: AiResponse = {
      text,
      timestamp: Date.now(),
      site: this.site,
    };

    this.notifyCallbacks(response);
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
    this.lastProcessedText = '';
  }
}
