import { createServer } from 'node:http';
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));

const bundle = await build({
  stdin: {
    contents: `import { PageActions } from './src/content/PageActions';
      import { TargetSite } from './src/common/types';
      globalThis.chrome = { storage: { local: { get: async () => ({}), set: async () => {} } } };
      new PageActions(TargetSite.CHATGPT);`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json',
});
const icon = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
const html = `<!doctype html><html lang="zh-Hant" class="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>下載此回答：本機外觀示範 ${version}</title>
<style>
  *{box-sizing:border-box}body{margin:0;background:#000;color:#ddd;font:20px/1.7 system-ui,"Microsoft JhengHei",sans-serif}header{height:48px;display:flex;justify-content:flex-end;padding:8px 24px}button{cursor:pointer}main{max-width:1080px;margin:24px auto;padding:0 28px}.date{text-align:center;color:#aaa;font-size:16px;margin:12px 0 20px}.user{display:flex;justify-content:flex-end;margin:16px 0 48px}.bubble{background:#1b4178;border-radius:28px;padding:12px 22px}.answer p{margin:24px 0}.status{display:inline-flex;border-radius:20px;padding:1px 9px;background:#002314;color:#00c36c;font-size:14px}.actions{display:flex;align-items:center;gap:4px;min-height:44px;max-width:100%;margin-top:12px}.native{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;color:#aaa;border:0;background:transparent;border-radius:8px}.native svg{width:22px;height:22px}.native:last-of-type{background:#181818;font-size:20px}.hint{color:#888;font-size:13px;margin-top:28px}#ai-avatar-question-outline{display:none!important}@media(max-width:650px){main{padding:0 20px}body{font-size:17px}.actions{gap:0}.native{width:32px}}
</style><header><button data-testid="share-chat-button" class="native" aria-label="分享">${icon('M12 15V3m-4 4 4-4 4 4M4 13v7h16v-7')}</button></header><main>
<div class="date">今天 下午12:02</div><div data-role="user" class="user"><div class="bubble">測試</div></div>
<article><div data-message-author-role="assistant" class="answer"><span class="status">✓ 測試成功</span><p>C醬在線，系統正常，嘴砲模組運作良好。</p><p><strong>有事儘管吩咐，程式能 Debug，人生能陪聊。</strong></p><p>萬事俱備，只欠你出題。</p></div>
<div class="actions" role="toolbar" aria-label="回答操作">
<button class="native" data-testid="copy-turn-action-button" aria-label="複製">${icon('M8 8h12v12H8zM4 16V4h12')}</button>
<button class="native" aria-label="讚">${icon('M3 10h4v11H3zM7 10l5-8 2 1v6h6l-2 12H7')}</button>
<button class="native" aria-label="朗讀">${icon('M3 9h4l5-5v16l-5-5H3zM16 8q5 4 0 8')}</button>
<button class="native" aria-label="分享">${icon('M12 15V3m-4 4 4-4 4 4M4 13v7h16v-7')}</button>
<button class="native" aria-label="重新產生">${icon('M20 8V3l-3 3a8 8 0 1 0 3 10M20 3h-5')}</button>
<button class="native" aria-label="更多">···</button></div></article>
<p class="hint">本機外觀示範 · 使用實際擴充功能程式碼 ${version}</p></main><script src="/preview.js"></script></html>`;
if (process.argv.includes('--write')) {
  await writeFile('docs/answer-download-preview.html', html.replace('<script src="/preview.js"></script>', `<script>${bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`));
  console.log('Wrote docs/answer-download-preview.html');
} else createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/preview.js' ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8');
  response.end(request.url === '/preview.js' ? bundle.outputFiles[0].text : html);
}).listen(4179, '127.0.0.1', () => console.log('Answer download preview: http://127.0.0.1:4179'));
