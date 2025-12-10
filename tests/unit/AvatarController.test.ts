/**
 * Unit tests for AvatarController
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AvatarController } from '@/avatar/AvatarController';
import type { IAvatarOverlay } from '@/common/interfaces';
import { AvatarState } from '@/common/types';

describe('AvatarController', () => {
  let mockOverlay: IAvatarOverlay;
  let controller: AvatarController;

  beforeEach(() => {
    mockOverlay = {
      show: vi.fn(),
      hide: vi.fn(),
      setImage: vi.fn(),
      setPosition: vi.fn(),
      enableDragging: vi.fn(),
      disableDragging: vi.fn(),
    };

    controller = new AvatarController(mockOverlay);
  });

  afterEach(() => {
    controller.destroy();
  });

  describe('setState', () => {
    it('should set state and update overlay image', () => {
      controller.setState(AvatarState.THINKING);
      expect(controller.getState()).toBe(AvatarState.THINKING);
      expect(mockOverlay.setImage).toHaveBeenCalled();
    });

    it('should not update if state is the same', () => {
      controller.setState(AvatarState.IDLE);
      const callCount = (mockOverlay.setImage as ReturnType<typeof vi.fn>).mock.calls.length;
      controller.setState(AvatarState.IDLE);
      expect((mockOverlay.setImage as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });

    it('should trigger state change callbacks', () => {
      const callback = vi.fn();
      controller.onStateChange(callback);
      controller.setState(AvatarState.HAPPY);
      expect(callback).toHaveBeenCalledWith(AvatarState.HAPPY);
    });
  });

  describe('onNewResponse', () => {
    it('should keep current state when no emotion provided', () => {
      vi.useFakeTimers();
      const initialState = controller.getState();
      controller.onNewResponse('Hello world');
      expect(controller.getState()).toBe(initialState);
      vi.useRealTimers();
    });

    it('should use provided emotion state', () => {
      vi.useFakeTimers();
      controller.onNewResponse('Great news!', AvatarState.HAPPY);
      expect(controller.getState()).toBe(AvatarState.HAPPY);
      vi.useRealTimers();
    });

    it('should stay in emotion state (no auto-return to idle)', () => {
      vi.useFakeTimers();
      controller.onNewResponse('Test', AvatarState.SAD);
      expect(controller.getState()).toBe(AvatarState.SAD);

      vi.advanceTimersByTime(5000);
      expect(controller.getState()).toBe(AvatarState.SAD);
      vi.useRealTimers();
    });
  });

  describe('setThinking', () => {
    it('should set thinking state', () => {
      controller.setThinking();
      expect(controller.getState()).toBe(AvatarState.THINKING);
    });
  });

  describe('setIdle', () => {
    it('should set idle state', () => {
      controller.setState(AvatarState.HAPPY);
      controller.setIdle();
      expect(controller.getState()).toBe(AvatarState.IDLE);
    });
  });
});
