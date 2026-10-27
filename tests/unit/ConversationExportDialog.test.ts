import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { ConversationExportDialog } from '@/content/ConversationExportDialog';
import { captureConversation, exportSnapshot, renderConversationHtml } from '@/content/ConversationExport';
import { TargetSite } from '@/common/types';
import { downloadText } from '@/common/download';

vi.mock('@/common/download', () => ({ downloadText: vi.fn() }));
describe('export selection and document formats', () => {
  let exporter: ConversationExportDialog;
  let root: ShadowRoot;
  beforeEach(() => {
    vi.clearAllMocks(); window.location.href = 'https://chatgpt.com/c/export'; document.title = '測試 <對話> - ChatGPT';
    document.body.innerHTML = '<article data-turn="user">問題一</article><article data-turn="assistant"><div class="markdown"><p>回答一</p><pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre></div></article><article data-turn="user">問題二</article><article data-turn="assistant">回答二</article>';
    const host = document.createElement('div'); document.body.append(host);
    exporter = new ConversationExportDialog(host, TargetSite.CHATGPT, vi.fn()); root = host.shadowRoot!;
  });
  afterEach(() => { exporter.destroy(); vi.restoreAllMocks(); });
  const checks = (): HTMLInputElement[] => Array.from(document.querySelectorAll<HTMLElement>('[data-ai-avatar-message-check]')).map(host => host.shadowRoot!.querySelector('input')!);
  const pickerRoot = (): ShadowRoot => document.getElementById('ai-avatar-message-picker')!.shadowRoot!;
  const click = (id: string): void => {
    const picker = document.getElementById('ai-avatar-message-picker');
    if (picker && !picker.hidden && ['next', 'clear', 'answers', 'refresh', 'cancel'].includes(id)) picker.shadowRoot!.getElementById(id)!.click();
    else root.getElementById(id)!.click();
  };
  const choose = (format: string): void => { const input = root.querySelector<HTMLInputElement>(`[value=${format}]`)!; input.checked = true; input.dispatchEvent(new Event('change')); };

  it('exports all loaded messages as offline HTML after choosing the format', () => {
    exporter.open(true, document.body);
    expect(root.getElementById('selection')!.hidden).toBe(true);
    choose('html'); click('confirm');
    const [html, filename, mime] = vi.mocked(downloadText).mock.calls[0];
    expect(html).toContain('<!doctype html>'); expect(html).toContain('問題一'); expect(html).toContain('回答二');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;'); expect(html).toContain('測試 &lt;對話&gt;');
    expect(filename).toBe('測試 _對話_-對話.html'); expect(mime).toBe('text/html;charset=utf-8');
    expect(root.querySelector('dialog')!.open).toBe(false);
  });
  it('keeps selections when returning and exports multiple checked messages in conversation order', () => {
    exporter.open(false, document.body);
    expect(root.querySelector('dialog')!.open).toBe(false);
    checks()[3].click(); checks()[1].click(); click('next'); click('back');
    expect(checks().filter(check => check.checked)).toHaveLength(2);
    click('next'); click('confirm');
    const result = vi.mocked(downloadText).mock.calls[0][0];
    expect(result.indexOf('回答一')).toBeLessThan(result.indexOf('回答二'));
    expect(result).not.toContain('問題一'); expect(result).not.toContain('問題二');
    exporter.open(false, document.body); click('answers'); expect(checks().filter(check => check.checked)).toHaveLength(2); click('clear');
    expect((pickerRoot().getElementById('next') as HTMLButtonElement).disabled).toBe(true);
  });
  it('rejects empty selection and navigation while a format choice is pending', () => {
    expect(() => exportSnapshot({ ...captureConversation(TargetSite.CHATGPT), messages: [] }, 'html')).toThrow('至少');
    exporter.open(true, document.body); window.location.href = 'https://chatgpt.com/c/different'; click('confirm');
    expect(root.getElementById('error')!.textContent).toContain('聊天已切換'); expect(downloadText).not.toHaveBeenCalled();
  });
  it('opens only the exported document for native PDF printing and reports blocked popups', async () => {
    const print = vi.fn(); const write = vi.fn();
    const popup = { opener: window, document: { open: vi.fn(), write, close: vi.fn(), fonts: { ready: Promise.resolve() } }, focus: vi.fn(), print, closed: false };
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    exporter.open(false, document.body); checks()[3].click(); click('next'); choose('pdf'); click('confirm');
    await vi.waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(write.mock.calls[0][0]).toContain('回答二'); expect(write.mock.calls[0][0]).not.toContain('回答一'); expect(popup.opener).toBeNull();
    vi.mocked(window.open).mockReturnValue(null); exporter.open(true, document.body); choose('pdf'); click('confirm');
    expect(root.getElementById('error')!.textContent).toContain('列印視窗被封鎖'); expect(root.querySelector('dialog')!.open).toBe(true);
  });
  it('removes executable content, event handlers and remote media from HTML', () => {
    const element = document.querySelector('article')!;
    element.innerHTML = '<p onclick="bad()">安全<strong>重點</strong></p><a href="javascript:bad()">危險連結</a><a href="https://example.test/a">來源</a><img src="https://example.test/tracker" onerror="bad()" alt="範例"><iframe src="about:blank"></iframe><table><tr><td>表格</td></tr></table>';
    const script = document.createElement('script'); script.type = 'application/json'; script.textContent = 'secret executable'; element.append(script);
    const html = renderConversationHtml(captureConversation(TargetSite.CHATGPT));
    expect(html).not.toMatch(/onclick|onerror|javascript:|<img|<iframe|<script|secret executable|tracker/);
    expect(html).toContain('<strong>重點</strong>'); expect(html).toContain('<td>表格</td>'); expect(html).toContain('[圖片：範例]');
    expect(html).toContain('href="https://example.test/a"');
  });
  it('selects beside the original messages and removes controls and highlights on cancel', () => {
    const original = document.querySelector<HTMLElement>('article')!; original.style.setProperty('outline', '1px dashed orange', 'important');
    exporter.open(false, document.body);
    expect(checks()).toHaveLength(4); expect(original.querySelector('input')).toBeNull();
    const beforeOutline = original.style.outline;
    checks()[0].click(); expect(original.style.outlineWidth).toBe('2px');
    expect(pickerRoot().getElementById('count')!.textContent).toContain('已選 1');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('ai-avatar-message-picker')).toBeNull(); expect(checks()).toHaveLength(0);
    expect(original.style.outline).toBe(beforeOutline); expect(original.style.getPropertyPriority('outline')).toBe('important');
    expect(original.style.paddingLeft).toBe(''); expect(original.style.boxSizing).toBe('');
    expect(downloadText).not.toHaveBeenCalled();
  });
  it('requires rechecking changed messages and can refresh newly loaded original messages', () => {
    exporter.open(false, document.body); checks()[3].click();
    document.querySelectorAll('article')[3].textContent = '回答二已更新';
    click('next'); expect(root.querySelector('dialog')!.open).toBe(false);
    expect(pickerRoot().getElementById('error')!.textContent).toContain('已更新');
    document.body.insertAdjacentHTML('beforeend', '<article data-turn="assistant">剛載入的舊訊息</article>');
    click('refresh'); expect(checks()).toHaveLength(5); expect(checks().some(check => check.checked)).toBe(false);
    checks()[4].click(); click('next'); click('confirm');
    expect(vi.mocked(downloadText).mock.calls[0][0]).toContain('剛載入的舊訊息');
    expect(document.getElementById('ai-avatar-message-picker')).toBeNull();
  });
  it('exits original-message selection when SPA navigation replaces the conversation', async () => {
    exporter.open(false, document.body); checks()[1].click();
    window.location.href = 'https://chatgpt.com/c/another'; document.body.append(document.createElement('main'));
    await vi.waitFor(() => expect(document.getElementById('ai-avatar-message-picker')).toBeNull());
    expect(checks()).toHaveLength(0); expect(downloadText).not.toHaveBeenCalled();
  });
});
