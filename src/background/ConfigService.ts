/**
 * ConfigService - Manages extension configuration in Chrome storage
 * Follows Single Responsibility Principle
 */

import type { IConfigService } from '@/common/interfaces';
import type { ExtensionConfig } from '@/common/types';
import { DEFAULT_CONFIG, STORAGE_KEY_CONFIG } from '@/common/constants';

export class ConfigService implements IConfigService {
  private configChangeCallbacks: Array<(config: ExtensionConfig) => void> = [];

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' || areaName === 'local') {
        if (changes[STORAGE_KEY_CONFIG]) {
          const newConfig = changes[STORAGE_KEY_CONFIG].newValue as ExtensionConfig;
          this.notifyConfigChange(newConfig);
        }
      }
    });
  }

  public async get(): Promise<ExtensionConfig> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(STORAGE_KEY_CONFIG, (result) => {
        const config = result[STORAGE_KEY_CONFIG] as ExtensionConfig | undefined;
        resolve(config || DEFAULT_CONFIG);
      });
    });
  }

  public async set(config: Partial<ExtensionConfig>): Promise<void> {
    const currentConfig = await this.get();
    const newConfig: ExtensionConfig = {
      ...currentConfig,
      ...config,
    };

    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [STORAGE_KEY_CONFIG]: newConfig }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  public onConfigChange(callback: (config: ExtensionConfig) => void): void {
    this.configChangeCallbacks.push(callback);
  }

  private notifyConfigChange(config: ExtensionConfig): void {
    this.configChangeCallbacks.forEach((callback) => {
      try {
        callback(config);
      } catch (error) {
        console.error('Error in config change callback:', error);
      }
    });
  }
}
