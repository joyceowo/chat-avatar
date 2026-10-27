/**
 * AvatarOverlay - Manages the visual avatar overlay on the page
 * Follows Single Responsibility Principle: only handles UI rendering
 */

import type { IAvatarOverlay } from '@/common/interfaces';
import { AVATAR_OVERLAY_ID, AVATAR_IMAGE_ID } from '@/common/constants';

export class AvatarOverlay implements IAvatarOverlay {
  private container: HTMLDivElement | null = null;
  private image: HTMLImageElement | null = null;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (document.getElementById(AVATAR_OVERLAY_ID)) {
      return; // Already initialized
    }

    this.createElements();
    this.applyStyles();
    this.attachToDocument();
  }

  private createElements(): void {
    this.container = document.createElement('div');
    this.container.id = AVATAR_OVERLAY_ID;

    this.image = document.createElement('img');
    this.image.id = AVATAR_IMAGE_ID;
    this.image.alt = 'AI Avatar';

    this.container.appendChild(this.image);
  }

  private applyStyles(): void {
    if (!this.container || !this.image) return;

    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '128px',
      height: '128px',
      zIndex: '999999',
      cursor: 'move',
      userSelect: 'none',
      transition: 'opacity 0.3s ease',
      opacity: '1',
    });

    Object.assign(this.image.style, {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      pointerEvents: 'none',
    });
  }

  private attachToDocument(): void {
    if (!this.container) return;
    document.body.appendChild(this.container);
  }

  public show(): void {
    if (this.container) {
      this.container.style.opacity = '1';
      this.container.style.pointerEvents = 'auto';
    }
  }

  public hide(): void {
    if (this.container) {
      this.container.style.opacity = '0';
      this.container.style.pointerEvents = 'none';
    }
  }

  public setImage(imageUrl: string): void {
    if (this.image) {
      this.image.src = imageUrl;
    }
  }

  public setPosition(x: number, y: number): void {
    if (!this.container) return;
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.container.style.right = 'auto';
    this.container.style.bottom = 'auto';
  }

  public enableDragging(): void {
    if (!this.container) return;

    this.container.addEventListener('mousedown', this.handleDragStart);
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);
  }

  public disableDragging(): void {
    if (!this.container) return;

    this.container.removeEventListener('mousedown', this.handleDragStart);
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }

  private handleDragStart = (e: MouseEvent): void => {
    if (!this.container) return;

    this.isDragging = true;
    const rect = this.container.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (this.container) {
      this.container.style.transition = 'none';
    }
  };

  private handleDragMove = (e: MouseEvent): void => {
    if (!this.isDragging || !this.container) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    this.setPosition(x, y);
  };

  private handleDragEnd = (): void => {
    this.isDragging = false;
    if (this.container) {
      this.container.style.transition = 'opacity 0.3s ease';
    }
  };

  public destroy(): void {
    this.disableDragging();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.image = null;
  }
}
