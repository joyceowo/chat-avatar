import { actionStyles, applyTheme } from '@/common/actionUi';
import { getMessageElement, type ConversationSnapshot } from './ConversationExport';

interface Entry {
  key: string; element: HTMLElement; host: HTMLElement; check: HTMLInputElement;
  outline: string; outlinePriority: string; offset: string; offsetPriority: string;
  padding: string; paddingPriority: string; sizing: string; sizingPriority: string;
}

/** Non-modal selection beside original messages, without inserting controls into native layouts. */
export class ConversationMessagePicker {
  public readonly host: HTMLElement;
  private root: ShadowRoot;
  private entries: Entry[] = [];
  private active = true;
  private spacer: HTMLElement | null = null;
  private frame = 0;
  private observer: MutationObserver;
  private schedule = (): void => { if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.layout(); }); };
  private keydown = (event: KeyboardEvent): void => { if (this.active && event.key === 'Escape') { event.preventDefault(); this.cancel(); } };

  constructor(
    private snapshot: ConversationSnapshot,
    private selected: Set<string>,
    private next: () => void,
    private cancel: () => void,
    private refresh: () => void,
    private navigated: () => void
  ) {
    this.host = document.createElement('div'); this.host.id = 'ai-avatar-message-picker'; this.host.dataset.aiAvatarUi = '';
    applyTheme(this.host); this.root = this.host.attachShadow({ mode: 'open' });
    this.root.innerHTML = `<style>${actionStyles}
      .bar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:2147483644;width:max-content;max-width:calc(100vw - 24px);padding:14px 16px;background:var(--surface);color:var(--fg);box-shadow:0 6px 28px #0005;border-radius:12px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}
      .copy{min-width:180px}.copy strong,.copy small{display:block}.copy small{color:var(--muted);margin-top:3px;font-size:12px}.actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}button{white-space:nowrap}output{font-variant-numeric:tabular-nums}.primary{background:var(--accent);color:var(--surface);border-color:transparent}.primary:hover{background:var(--accent);filter:brightness(.93)}.error{width:100%;color:var(--danger);margin:0;font-size:13px}
      @media(max-width:600px){.bar{width:calc(100vw - 24px);bottom:12px;padding:12px}.copy{min-width:0;width:100%}.actions{gap:6px}.actions button{font-size:13px;padding:6px 9px}}
    </style><section class="bar" role="region" aria-label="匯出訊息選取"><div class="copy"><strong>在原文旁勾選訊息 · <output id="count" aria-live="polite"></output></strong><small>可捲動閱讀完整內容；按 Esc 取消。</small></div><div class="actions"><button type="button" id="answers">只選 AI 回答</button><button type="button" id="clear">取消勾選</button><button type="button" id="refresh">更新訊息</button><button type="button" id="cancel">取消</button><button type="button" id="next" class="primary" disabled>下一步</button></div><p id="error" class="error" role="alert" hidden></p></section>`;
    this.root.getElementById('answers')!.addEventListener('click', () => { selected.clear(); snapshot.messages.filter(message => message.role === 'assistant').forEach(message => selected.add(message.key)); this.update(); });
    this.root.getElementById('clear')!.addEventListener('click', () => { selected.clear(); this.update(); });
    this.root.getElementById('refresh')!.addEventListener('click', refresh);
    this.root.getElementById('cancel')!.addEventListener('click', cancel);
    this.root.getElementById('next')!.addEventListener('click', () => { if (selected.size) next(); });
    snapshot.messages.forEach((message, index) => {
      const element = getMessageElement(message); if (!element?.isConnected) return;
      const host = document.createElement('div'); host.dataset.aiAvatarUi = ''; host.dataset.aiAvatarMessageCheck = '';
      Object.assign(host.style, { position: 'fixed', zIndex: '2147483643', width: '32px', height: '32px' }); applyTheme(host);
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${actionStyles}:host{display:block}label{display:grid;place-items:center;width:32px;height:32px;background:var(--surface);border:1px solid var(--line);border-radius:8px;cursor:pointer}label:focus-within{outline:2px solid var(--accent);outline-offset:2px}input{accent-color:var(--accent);width:17px;height:17px;margin:0;cursor:pointer}</style><label title="勾選這則訊息"><input type="checkbox" aria-label="選取第 ${index + 1} 則${message.role === 'user' ? '使用者訊息' : 'AI 回答'}"></label>`;
      const check = root.querySelector('input')!; check.value = message.key;
      check.addEventListener('change', () => { if (check.checked) selected.add(message.key); else selected.delete(message.key); this.update(); });
      this.entries.push({ key: message.key, element, host, check, outline: element.style.getPropertyValue('outline'), outlinePriority: element.style.getPropertyPriority('outline'), offset: element.style.getPropertyValue('outline-offset'), offsetPriority: element.style.getPropertyPriority('outline-offset'), padding: element.style.getPropertyValue('padding-left'), paddingPriority: element.style.getPropertyPriority('padding-left'), sizing: element.style.getPropertyValue('box-sizing'), sizingPriority: element.style.getPropertyPriority('box-sizing') });
      // Reserve space inside each message so the checkbox never covers its text, even on phones.
      const padding = parseFloat(getComputedStyle(element).paddingLeft) || 0;
      element.style.setProperty('box-sizing', 'border-box'); element.style.setProperty('padding-left', `${padding + 40}px`);
      document.body.append(host);
    });
    document.body.append(this.host);
    const last = this.entries[this.entries.length - 1]?.element;
    if (last) {
      this.spacer = document.createElement('div'); this.spacer.dataset.aiAvatarUi = '';
      Object.assign(this.spacer.style, { width: '1px', flexShrink: '0', pointerEvents: 'none' });
      this.spacer.setAttribute('aria-hidden', 'true');
      (last.closest('article,[data-testid^="conversation-turn-"],model-response') || last).after(this.spacer);
    }
    this.observer = new MutationObserver(() => { if (location.href !== snapshot.url) navigated(); else this.schedule(); });
    this.observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', this.schedule); document.addEventListener('scroll', this.schedule, true); document.addEventListener('keydown', this.keydown);
    this.update(); this.layout();
    (this.entries.find(entry => entry.host.style.display !== 'none')?.check || this.root.getElementById('cancel')!).focus({ preventScroll: true });
  }

  private restore(entry: Entry): void {
    if (entry.outline) entry.element.style.setProperty('outline', entry.outline, entry.outlinePriority); else entry.element.style.removeProperty('outline');
    if (entry.offset) entry.element.style.setProperty('outline-offset', entry.offset, entry.offsetPriority); else entry.element.style.removeProperty('outline-offset');
  }
  private update(): void {
    this.root.getElementById('error')!.hidden = true;
    this.root.getElementById('count')!.textContent = `已選 ${this.selected.size} 則`;
    const next = this.root.getElementById('next') as HTMLButtonElement; next.disabled = !this.selected.size; next.textContent = `下一步（${this.selected.size}）`;
    for (const entry of this.entries) {
      entry.check.checked = this.selected.has(entry.key);
      if (entry.check.checked) { entry.element.style.setProperty('outline', `2px solid ${this.host.dataset.theme === 'dark' ? '#81ce9a' : '#23713b'}`); entry.element.style.setProperty('outline-offset', '5px'); }
      else this.restore(entry);
    }
    this.schedule();
  }
  private layout(): void {
    if (!this.active) { this.entries.forEach(entry => { entry.host.style.display = 'none'; }); return; }
    const barHeight = this.root.querySelector('.bar')!.getBoundingClientRect().height || 80;
    if (this.spacer) this.spacer.style.height = `${barHeight + 32}px`;
    const bottom = window.innerHeight - barHeight - 32;
    for (const entry of this.entries) {
      const rect = entry.element.getBoundingClientRect();
      const visible = this.active && entry.element.isConnected && rect.width > 0 && rect.height > 0 && rect.bottom > 76 && rect.top < bottom;
      entry.host.style.display = visible ? 'block' : 'none';
      if (!visible) continue;
      const left = Math.max(8, Math.min(rect.left + 4, window.innerWidth - 40));
      const top = Math.max(76, Math.min(rect.top + 4, bottom - 32));
      entry.host.style.left = `${left}px`; entry.host.style.top = `${top}px`;
    }
  }
  public setActive(active: boolean): void {
    this.active = active; this.host.hidden = !active; this.layout();
    if (active) (this.entries.find(entry => entry.check.checked && entry.host.style.display !== 'none')?.check || this.entries.find(entry => entry.host.style.display !== 'none')?.check || this.root.getElementById('cancel')!).focus({ preventScroll: true });
  }
  public showError(message: string): void { const error = this.root.getElementById('error')!; error.textContent = message; error.hidden = !message; }
  public destroy(): void {
    this.observer.disconnect(); if (this.frame) cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.schedule); document.removeEventListener('scroll', this.schedule, true); document.removeEventListener('keydown', this.keydown);
    this.entries.forEach(entry => {
      this.restore(entry);
      if (entry.padding) entry.element.style.setProperty('padding-left', entry.padding, entry.paddingPriority); else entry.element.style.removeProperty('padding-left');
      if (entry.sizing) entry.element.style.setProperty('box-sizing', entry.sizing, entry.sizingPriority); else entry.element.style.removeProperty('box-sizing');
      entry.host.remove();
    }); this.spacer?.remove(); this.host.remove();
  }
}
