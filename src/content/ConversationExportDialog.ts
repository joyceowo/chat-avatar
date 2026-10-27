import { TargetSite } from '@/common/types';
import { actionStyles, applyTheme } from '@/common/actionUi';
import { captureConversation, exportSnapshot, getMessageElement, type ConversationSnapshot, type ExportFormat } from './ConversationExport';
import { readCurrentConversation } from './ConversationReader';
import { ConversationMessagePicker } from './ConversationMessagePicker';

/** Two-step export: choose messages, then choose the document format. */
export class ConversationExportDialog {
  private root: ShadowRoot;
  private dialog: HTMLDialogElement;
  private snapshot: ConversationSnapshot | null = null;
  private selected = new Set<string>();
  private all = true;
  private anchor: HTMLElement | null = null;
  private reader: AbortController | null = null;
  private picker: ConversationMessagePicker | null = null;

  constructor(private host: HTMLElement, private site: TargetSite, private notify: (message: string) => void) {
    host.dataset.aiAvatarUi = '';
    this.root = host.attachShadow({ mode: 'open' });
    this.root.innerHTML = `<style>${actionStyles}
      dialog{color:var(--fg);background:var(--surface);border:0;border-radius:14px;padding:24px;width:520px;max-width:calc(100vw - 24px);max-height:calc(100dvh - 32px);overflow:auto;box-shadow:0 12px 48px #0005;scrollbar-color:var(--line) transparent}
      dialog::backdrop{background:#0007}header{display:flex;align-items:center;justify-content:space-between;gap:16px}h2{font-size:20px;line-height:1.4;margin:0}p{color:var(--muted);margin:12px 0 20px}button{white-space:nowrap}footer{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:24px}.primary{background:var(--accent);color:var(--surface);border-color:transparent}.primary:hover{filter:brightness(.93);background:var(--accent)}input{accent-color:var(--accent);flex:none;width:16px;height:16px;margin:3px 0 0}
      .list{max-height:45dvh;overflow:auto;scrollbar-color:var(--line) transparent;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.message{display:flex;align-items:flex-start;gap:12px;padding:14px 4px;cursor:pointer}.message+.message{border-top:1px solid var(--line)}.message:hover,.format:hover{background:var(--hover)}.message span{min-width:0;overflow-wrap:anywhere}.message small{display:block;color:var(--muted);margin-top:4px}.selection-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px}.selection-tools output{margin-left:auto;font-size:13px;color:var(--muted)}fieldset{border:0;padding:0;margin:0}legend{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.format{display:flex;gap:12px;padding:14px 0;cursor:pointer}.format+.format{border-top:1px solid var(--line)}.format small{display:block;color:var(--muted);margin-top:3px}.error{color:var(--danger);margin:16px 0 0}.close{border:0;background:transparent;color:var(--muted)}::selection{background:var(--accent);color:var(--surface)}
      dialog[data-stage=selection]{width:820px}.list{max-height:55dvh}.message{display:block}.message-label{display:flex;gap:12px;cursor:pointer}.full{margin:10px 0 0 28px}.full summary{color:var(--muted);cursor:pointer;padding:4px 0}.full-message{color:var(--fg);overflow-wrap:anywhere;line-height:1.75;user-select:text}.full-message p{color:var(--fg);margin:12px 0}.full-message pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:var(--hover);border-radius:6px;font-size:12px}.full-message table{border-collapse:collapse;max-width:100%;table-layout:fixed}.full-message th,.full-message td{border:1px solid var(--line);padding:6px;overflow-wrap:anywhere}.full-message h1{font-size:24px}.full-message h2{font-size:21px}.full-message h3{font-size:18px}.full-message a{color:var(--accent)}
      @media(max-width:480px){dialog{padding:20px}.selection-tools output{width:100%;margin-left:0}.full{margin-left:0}}
    </style><dialog aria-labelledby="export-title" aria-describedby="export-description"><header><h2 id="export-title"></h2><button class="close" id="close" type="button" aria-label="關閉匯出視窗">關閉</button></header><p id="export-description"></p>
      <div id="selection" hidden><div class="selection-tools"><button type="button" id="select-all">全選</button><button type="button" id="clear">取消勾選</button><output id="count" aria-live="polite"></output></div><div class="list" id="messages" role="group" aria-label="選擇要匯出的訊息"></div><footer><button type="button" class="primary" id="next" disabled>匯出</button></footer></div>
      <div id="formats" hidden><fieldset><legend>匯出格式</legend>
        <label class="format"><input type="radio" name="format" value="markdown" checked><span><strong>Markdown</strong><small>.md · 適合筆記與後續編輯</small></span></label>
        <label class="format"><input type="radio" name="format" value="pdf"><span><strong>PDF</strong><small>開啟 Chrome 列印視窗，請選「另存為 PDF」</small></span></label>
        <label class="format"><input type="radio" name="format" value="html"><span><strong>HTML</strong><small>.html · 可用瀏覽器離線閱讀</small></span></label>
      </fieldset><footer><button type="button" id="back">返回勾選</button><button type="button" id="confirm" class="primary">匯出 Markdown</button></footer></div><p id="loading" role="status" hidden>正在讀取目前聊天的訊息…</p><p id="error" class="error" role="alert" hidden></p><button type="button" id="reload" hidden>重新讀取訊息</button></dialog>`;
    this.dialog = this.root.querySelector('dialog')!;
    this.el('close').addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
    this.el('select-all').addEventListener('click', () => { this.snapshot?.messages.forEach(message => this.selected.add(message.key)); this.updateSelection(); });
    this.el('clear').addEventListener('click', () => { this.selected.clear(); this.updateSelection(); });
    this.el('next').addEventListener('click', () => { if (this.selected.size) this.showFormats(); });
    this.el('back').addEventListener('click', () => this.showSelection());
    this.root.querySelectorAll<HTMLInputElement>('input[name=format]').forEach(input => input.addEventListener('change', () => this.updateFormat()));
    this.el('confirm').addEventListener('click', () => this.export());
    this.el('reload').addEventListener('click', () => {
      this.snapshot = captureConversation(this.site); this.selected.clear();
      if (this.snapshot.messages.length) this.present(); else void this.readFallback();
    });
  }

  private el(id: string): HTMLElement { return this.root.getElementById(id)!; }
  public open(all: boolean, anchor: HTMLElement): void {
    this.close(false); this.anchor = anchor; this.all = all; this.snapshot = captureConversation(this.site); this.selected.clear();
    this.el('error').hidden = true; this.el('loading').hidden = true; this.el('reload').hidden = true;
    this.root.querySelector<HTMLInputElement>('[value=markdown]')!.checked = true;
    applyTheme(this.host);
    if (all) this.showFormats(false); else this.showSelection(false);
    if (!this.picker && !this.dialog.open) this.dialog.showModal();
    if (all) this.root.querySelector<HTMLInputElement>('[value=markdown]')!.focus();
    else if (!this.picker) (this.root.querySelector<HTMLInputElement>('#messages input') || this.el('close')).focus();
    if (!this.snapshot.messages.length) void this.readFallback();
  }
  private present(): void {
    this.el('loading').hidden = true; this.el('error').hidden = true; this.el('reload').hidden = true;
    if (this.all) this.showFormats(); else this.showSelection();
  }
  private async readFallback(): Promise<void> {
    if (!this.snapshot) return;
    this.el('reload').hidden = true; this.el('error').hidden = true;
    if (this.site !== TargetSite.CHATGPT || !/\/c\/[\w-]+\/?$/.test(location.pathname)) { this.el('reload').hidden = false; return; }
    const url = this.snapshot.url; const controller = new AbortController(); this.reader?.abort(); this.reader = controller;
    this.el('formats').hidden = true; this.el('selection').hidden = true; this.el('loading').hidden = false;
    this.el('export-title').textContent = '讀取目前聊天';
    this.el('export-description').textContent = '頁面結構無法辨識，正在使用目前網站的登入狀態讀取這個聊天；不會讀取其他聊天。';
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const snapshot = await readCurrentConversation(url, controller.signal);
      if (this.reader !== controller || !this.dialog.open) return;
      this.snapshot = snapshot; this.present();
    } catch (error) {
      if (this.reader !== controller || !this.dialog.open) return;
      this.el('loading').hidden = true; this.el('error').hidden = false; this.el('reload').hidden = false;
      this.el('error').textContent = controller.signal.aborted ? '讀取逾時，請檢查連線後重新讀取。' : `無法讀取訊息：${(error as Error).message}`;
    } finally { clearTimeout(timeout); if (this.reader === controller) this.reader = null; }
  }
  private showSelection(focus = true): void {
    if (this.snapshot?.source !== 'conversation' && this.snapshot?.messages.length && this.snapshot.messages.every(message => getMessageElement(message)?.isConnected)) {
      if (this.dialog.open) this.dialog.close();
      if (this.picker) this.picker.setActive(true);
      else this.picker = new ConversationMessagePicker(this.snapshot, this.selected, () => this.showFormats(), () => this.close(), () => this.refreshSelection(), () => { this.close(false); this.notify('聊天已切換，已退出匯出選取模式。'); });
      return;
    }
    this.dialog.dataset.stage = 'selection';
    if (!this.dialog.open) this.dialog.showModal();
    this.el('selection').hidden = false; this.el('formats').hidden = true;
    this.el('export-title').textContent = '匯出單一對話';
    this.el('export-description').textContent = this.snapshot?.source === 'conversation' ? '已從網站讀取目前聊天分支。勾選要匯出的訊息，可複選。' : '勾選此聊天中要匯出的訊息，可複選。清單僅包含開啟視窗時已載入的內容；較早的訊息請先向上捲動載入。';
    const list = this.el('messages'); list.replaceChildren();
    this.snapshot?.messages.forEach((message, index) => {
      const item = document.createElement('article'); item.className = 'message';
      const label = document.createElement('label'); label.className = 'message-label';
      const check = document.createElement('input'); check.type = 'checkbox'; check.value = message.key;
      const text = document.createElement('span'); const role = document.createElement('strong'); const preview = document.createElement('small');
      role.textContent = `${index + 1} · ${message.role === 'user' ? '使用者' : 'AI 回答'}`; preview.textContent = message.preview;
      text.append(role, preview); label.append(check, text);
      const details = document.createElement('details'); details.className = 'full'; details.open = true;
      const summary = document.createElement('summary'); summary.textContent = '完整訊息';
      const full = document.createElement('div'); full.className = 'full-message'; full.innerHTML = message.html;
      const updatePreview = (): void => { preview.hidden = details.open; summary.textContent = details.open ? '收合完整訊息' : '展開完整訊息'; };
      details.addEventListener('toggle', updatePreview); updatePreview();
      details.append(summary, full); item.append(label, details); list.append(item);
      check.addEventListener('change', () => { if (check.checked) this.selected.add(message.key); else this.selected.delete(message.key); this.updateSelection(); });
    });
    if (!this.snapshot?.messages.length) list.textContent = '目前尚未讀到訊息，請等聊天載入後按「重新讀取訊息」。';
    this.updateSelection();
    if (focus) (list.querySelector<HTMLInputElement>('input') || this.el('close')).focus();
  }
  private refreshSelection(): void {
    const previous = new Map(this.snapshot?.messages.filter(message => this.selected.has(message.key)).map(message => [message.key, message.markdown]));
    this.picker?.destroy(); this.picker = null;
    this.snapshot = captureConversation(this.site); this.selected.clear();
    this.snapshot.messages.forEach(message => { if (previous.get(message.key) === message.markdown) this.selected.add(message.key); });
    this.showSelection();
    if (!this.snapshot.messages.length) void this.readFallback();
  }
  private updateSelection(): void {
    this.root.querySelectorAll<HTMLInputElement>('#messages input').forEach(input => { input.checked = this.selected.has(input.value); });
    this.el('count').textContent = `已勾選 ${this.selected.size}／${this.snapshot?.messages.length || 0} 則`;
    (this.el('next') as HTMLButtonElement).disabled = !this.selected.size;
  }
  private showFormats(focus = true): void {
    if (this.picker && this.snapshot) {
      const current = captureConversation(this.site);
      if (current.url !== this.snapshot.url || this.snapshot.messages.some(message => this.selected.has(message.key) && !current.messages.some(fresh => fresh.key === message.key && fresh.markdown === message.markdown))) {
        this.picker.showError('選取的訊息已更新或聊天已切換，請按「更新訊息」重新確認。'); return;
      }
      this.picker.setActive(false);
      if (!this.dialog.open) this.dialog.showModal();
    }
    this.dialog.dataset.stage = 'formats';
    this.el('selection').hidden = true; this.el('formats').hidden = false; this.el('back').hidden = this.all;
    const count = this.all ? this.snapshot?.messages.length || 0 : this.selected.size;
    this.el('export-title').textContent = '選擇匯出格式';
    this.el('export-description').textContent = count ? `${this.all ? '匯出全部' : '匯出已勾選內容'} · ${count} 則訊息。${this.snapshot?.source === 'conversation' ? '已從網站讀取目前聊天分支。' : '範圍限於目前聊天已載入的內容。'}附件與圖片以文字標示。` : '目前尚未讀到訊息，請等聊天載入後按「重新讀取訊息」。';
    (this.el('confirm') as HTMLButtonElement).disabled = count === 0;
    this.updateFormat();
    if (focus) this.root.querySelector<HTMLInputElement>('input[name=format]:checked')?.focus();
  }
  private format(): ExportFormat { return this.root.querySelector<HTMLInputElement>('input[name=format]:checked')!.value as ExportFormat; }
  private updateFormat(): void { this.el('confirm').textContent = ({ markdown: '匯出 Markdown', html: '匯出 HTML', pdf: '開啟 PDF 列印' })[this.format()]; }
  private export(): void {
    if (!this.snapshot) return;
    try {
      if (this.snapshot.url !== location.href) throw new Error('目前聊天已切換，請關閉視窗後重新選擇匯出。');
      const snapshot = { ...this.snapshot, messages: this.snapshot.messages.filter(message => this.all || this.selected.has(message.key)) };
      const format = this.format(); exportSnapshot(snapshot, format);
      this.close(); this.notify(format === 'pdf' ? '已開啟列印視窗，請選「另存為 PDF」。' : `已開始下載 ${format === 'html' ? 'HTML' : 'Markdown'}。`);
    } catch (error) { this.el('error').textContent = (error as Error).message; this.el('error').hidden = false; }
  }
  public close(focus = true): void {
    this.reader?.abort(); this.reader = null;
    const open = this.dialog.open || !!this.picker;
    this.picker?.destroy(); this.picker = null;
    if (this.dialog.open) this.dialog.close();
    this.snapshot = null; this.selected.clear();
    if (focus && open && this.anchor?.isConnected) this.anchor.focus();
  }
  public destroy(): void { this.close(false); this.host.remove(); }
}
