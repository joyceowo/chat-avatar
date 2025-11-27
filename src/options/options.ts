/**
 * Options Page - Settings UI logic
 */

import type { ExtensionConfig } from '@/common/types';
import { LlmProvider } from '@/common/types';
import { DEFAULT_CONFIG, STORAGE_KEY_CONFIG } from '@/common/constants';

class OptionsPage {
  private elements: {
    enabled: HTMLInputElement;
    avatarStyle: HTMLSelectElement;
    llmProvider: HTMLSelectElement;
    llmConfig: HTMLElement;
    apiKey: HTMLInputElement;
    modelName: HTMLInputElement;
    saveBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    statusMessage: HTMLElement;
  };

  constructor() {
    this.elements = this.getElements();
    this.initialize();
  }

  private getElements(): typeof this.elements {
    return {
      enabled: document.getElementById('enabled') as HTMLInputElement,
      avatarStyle: document.getElementById('avatarStyle') as HTMLSelectElement,
      llmProvider: document.getElementById('llmProvider') as HTMLSelectElement,
      llmConfig: document.getElementById('llmConfig') as HTMLElement,
      apiKey: document.getElementById('apiKey') as HTMLInputElement,
      modelName: document.getElementById('modelName') as HTMLInputElement,
      saveBtn: document.getElementById('saveBtn') as HTMLButtonElement,
      resetBtn: document.getElementById('resetBtn') as HTMLButtonElement,
      statusMessage: document.getElementById('statusMessage') as HTMLElement,
    };
  }

  private async initialize(): Promise<void> {
    await this.loadSettings();
    this.attachEventListeners();
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEY_CONFIG);
      const config: ExtensionConfig = result[STORAGE_KEY_CONFIG] || DEFAULT_CONFIG;

      this.elements.enabled.checked = config.enabled;
      this.elements.avatarStyle.value = config.avatarStyle;
      this.elements.llmProvider.value = config.llmProvider;
      this.elements.apiKey.value = config.apiKey || '';
      this.elements.modelName.value = config.modelName || '';

      this.updateLlmConfigVisibility();
    } catch (error) {
      this.showStatus('Failed to load settings', 'error');
      console.error('Load settings error:', error);
    }
  }

  private attachEventListeners(): void {
    this.elements.saveBtn.addEventListener('click', () => this.saveSettings());
    this.elements.resetBtn.addEventListener('click', () => this.resetSettings());
    this.elements.llmProvider.addEventListener('change', () =>
      this.updateLlmConfigVisibility()
    );
  }

  private updateLlmConfigVisibility(): void {
    const provider = this.elements.llmProvider.value;
    if (provider === LlmProvider.NONE) {
      this.elements.llmConfig.classList.add('hidden');
    } else {
      this.elements.llmConfig.classList.remove('hidden');
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      const config: ExtensionConfig = {
        enabled: this.elements.enabled.checked,
        avatarStyle: this.elements.avatarStyle.value,
        llmProvider: this.elements.llmProvider.value as LlmProvider,
        apiKey: this.elements.apiKey.value.trim() || undefined,
        modelName: this.elements.modelName.value.trim() || undefined,
        targetSites: DEFAULT_CONFIG.targetSites,
      };

      await chrome.storage.sync.set({ [STORAGE_KEY_CONFIG]: config });
      this.showStatus('Settings saved successfully!', 'success');

      // Notify content scripts of config change
      chrome.runtime.sendMessage({
        type: 'CONFIG_UPDATED',
        payload: config,
      });
    } catch (error) {
      this.showStatus('Failed to save settings', 'error');
      console.error('Save settings error:', error);
    }
  }

  private async resetSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEY_CONFIG]: DEFAULT_CONFIG });
      await this.loadSettings();
      this.showStatus('Settings reset to defaults', 'success');
    } catch (error) {
      this.showStatus('Failed to reset settings', 'error');
      console.error('Reset settings error:', error);
    }
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status-message ${type} show`;

    setTimeout(() => {
      this.elements.statusMessage.classList.remove('show');
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new OptionsPage());
} else {
  new OptionsPage();
}
