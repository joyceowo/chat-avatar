/**
 * Options Page - Settings UI logic
 */

import type { ExtensionConfig, CustomAvatarImages } from '@/common/types';
import { LlmProvider, AvatarState } from '@/common/types';
import { DEFAULT_CONFIG, STORAGE_KEY_CONFIG, STORAGE_KEY_CUSTOM_AVATARS, AVATAR_IMAGES } from '@/common/constants';

class OptionsPage {
  private elements: {
    enabled: HTMLInputElement;
    avatarStyle: HTMLSelectElement;
    avatarGrid: HTMLElement;
    llmProvider: HTMLSelectElement;
    llmConfig: HTMLElement;
    apiKey: HTMLInputElement;
    modelName: HTMLInputElement;
    saveBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    statusMessage: HTMLElement;
  };

  private customAvatars: CustomAvatarImages = {};

  constructor() {
    this.elements = this.getElements();
    this.initialize();
  }

  private getElements(): typeof this.elements {
    return {
      enabled: document.getElementById('enabled') as HTMLInputElement,
      avatarStyle: document.getElementById('avatarStyle') as HTMLSelectElement,
      avatarGrid: document.getElementById('avatarGrid') as HTMLElement,
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
    this.renderAvatarGrid();
    await this.loadSettings();
    this.attachEventListeners();
  }

  private renderAvatarGrid(): void {
    const avatarStates = Object.values(AvatarState);
    const stateLabels: Record<AvatarState, string> = {
      [AvatarState.IDLE]: 'Idle (閒置)',
      [AvatarState.IDLE2]: 'Idle 2 (閒置變體2)',
      [AvatarState.IDLE3]: 'Idle 3 (閒置變體3)',
      [AvatarState.THINKING]: 'Thinking (思考中)',
      [AvatarState.HAPPY]: 'Happy (開心)',
      [AvatarState.SAD]: 'Sad (難過)',
      [AvatarState.EXCITED]: 'Excited (興奮)',
      [AvatarState.CONFUSED]: 'Confused (困惑)',
      [AvatarState.ANGRY]: 'Angry (生氣)',
      [AvatarState.SURPRISED]: 'Surprised (驚訝)',
      [AvatarState.WORRIED]: 'Worried (擔心)',
      [AvatarState.NEUTRAL]: 'Neutral (中性)',
    };

    this.elements.avatarGrid.innerHTML = avatarStates
      .map(
        (state) => `
        <div class="avatar-item" data-state="${state}">
          <div class="avatar-item-header">
            <span class="avatar-item-title">${stateLabels[state]}</span>
          </div>
          <div class="avatar-preview" id="preview-${state}">
            <div class="avatar-preview-placeholder">No custom image</div>
          </div>
          <div class="file-input-wrapper">
            <input type="file" id="file-${state}" accept="image/*" data-state="${state}">
            <label for="file-${state}" class="file-input-label">Choose Image</label>
          </div>
          <button class="btn-reset-avatar" data-state="${state}">Reset to Default</button>
        </div>
      `
      )
      .join('');

    // Attach event listeners for file inputs and reset buttons
    avatarStates.forEach((state) => {
      const fileInput = document.getElementById(`file-${state}`) as HTMLInputElement;
      const resetBtn = this.elements.avatarGrid.querySelector(
        `.btn-reset-avatar[data-state="${state}"]`
      ) as HTMLButtonElement;

      fileInput.addEventListener('change', (e) => this.handleFileUpload(e, state));
      resetBtn.addEventListener('click', () => this.resetAvatar(state));
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      // Load config from sync storage
      const configResult = await chrome.storage.sync.get(STORAGE_KEY_CONFIG);
      const config: ExtensionConfig = configResult[STORAGE_KEY_CONFIG] || DEFAULT_CONFIG;

      this.elements.enabled.checked = config.enabled;
      this.elements.avatarStyle.value = config.avatarStyle;
      this.elements.llmProvider.value = config.llmProvider;
      this.elements.apiKey.value = config.apiKey || '';
      this.elements.modelName.value = config.modelName || '';

      // Load custom avatars from local storage (larger quota)
      const avatarsResult = await chrome.storage.local.get(STORAGE_KEY_CUSTOM_AVATARS);
      this.customAvatars = avatarsResult[STORAGE_KEY_CUSTOM_AVATARS] || {};

      // Update avatar previews
      this.updateAvatarPreviews();
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

  private handleFileUpload(event: Event, state: AvatarState): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showStatus('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      this.showStatus('Image size must be less than 1MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.customAvatars[state] = dataUrl;
      this.updateAvatarPreview(state, dataUrl);
      this.showStatus(`${state} avatar updated`, 'success');
    };
    reader.onerror = () => {
      this.showStatus('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  }

  private resetAvatar(state: AvatarState): void {
    delete this.customAvatars[state];
    this.updateAvatarPreview(state, null);
    this.showStatus(`${state} avatar reset to default`, 'success');
  }

  private updateAvatarPreviews(): void {
    Object.values(AvatarState).forEach((state) => {
      const customUrl = this.customAvatars[state];
      this.updateAvatarPreview(state, customUrl || null);
    });
  }

  private updateAvatarPreview(state: AvatarState, imageUrl: string | null): void {
    const preview = document.getElementById(`preview-${state}`);
    if (!preview) return;

    if (imageUrl) {
      preview.innerHTML = `<img src="${imageUrl}" alt="${state}">`;
    } else {
      // Show default avatar
      const defaultUrl = chrome.runtime.getURL(AVATAR_IMAGES[state]);
      preview.innerHTML = `<img src="${defaultUrl}" alt="${state}" style="opacity: 0.5;">`;
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      // Save config to sync storage (without custom avatars)
      const config: ExtensionConfig = {
        enabled: this.elements.enabled.checked,
        avatarStyle: this.elements.avatarStyle.value,
        llmProvider: this.elements.llmProvider.value as LlmProvider,
        apiKey: this.elements.apiKey.value.trim() || undefined,
        modelName: this.elements.modelName.value.trim() || undefined,
        targetSites: DEFAULT_CONFIG.targetSites,
      };

      await chrome.storage.sync.set({ [STORAGE_KEY_CONFIG]: config });

      // Save custom avatars to local storage (larger quota - 5MB)
      if (Object.keys(this.customAvatars).length > 0) {
        await chrome.storage.local.set({ [STORAGE_KEY_CUSTOM_AVATARS]: this.customAvatars });
      } else {
        // Remove custom avatars if empty
        await chrome.storage.local.remove(STORAGE_KEY_CUSTOM_AVATARS);
      }

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
