/**
 * AvatarController - Controls avatar state transitions
 * Follows Single Responsibility Principle: manages state logic only
 */

import type { IAvatarController, IAvatarOverlay } from '@/common/interfaces';
import { AvatarState } from '@/common/types';
import { AVATAR_IMAGES } from '@/common/constants';
import { getAssetUrl, calculateSpeakingDuration } from '@/common/utils';

export class AvatarController implements IAvatarController {
  private currentState: AvatarState = AvatarState.IDLE;
  private stateChangeCallbacks: Array<(state: AvatarState) => void> = [];
  private stateTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private overlay: IAvatarOverlay) {
    // Delay initial state to ensure chrome API is ready
    setTimeout(() => {
      this.setState(AvatarState.IDLE);
    }, 100);
  }

  public setState(state: AvatarState): void {
    if (this.currentState === state) return;

    this.currentState = state;
    this.updateOverlayImage();
    this.notifyStateChange();

    // Clear any pending state transitions
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }
  }

  public getState(): AvatarState {
    return this.currentState;
  }

  public onStateChange(callback: (state: AvatarState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Handle new AI response - triggers state transitions
   */
  public onNewResponse(text: string, emotion?: AvatarState): void {
    // If emotion is provided (from LLM analysis), use it
    // Otherwise default to SPEAKING
    const targetState = emotion || AvatarState.SPEAKING;

    console.log('🎭 Avatar state change:', {
      from: this.currentState,
      to: targetState,
      emotion: emotion ? emotion : 'default',
      textLength: text.length,
    });

    // Clear any existing timeout
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }

    this.setState(targetState);

    console.log('✨ Avatar will stay in this state until next response or page change');
  }

  /**
   * Set thinking state (called when user sends a message)
   */
  public setThinking(): void {
    this.setState(AvatarState.THINKING);
  }

  /**
   * Return to idle state
   */
  public setIdle(): void {
    this.setState(AvatarState.IDLE);
  }

  private updateOverlayImage(): void {
    const imagePath = AVATAR_IMAGES[this.currentState];
    const imageUrl = getAssetUrl(imagePath);
    this.overlay.setImage(imageUrl);
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  public destroy(): void {
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
    }
    this.stateChangeCallbacks = [];
  }
}
