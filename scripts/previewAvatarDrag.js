// Manual browser regression fixture: node scripts/previewAvatarDrag.js
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const bundle = await build({
  stdin: { contents: `
    import { AvatarOverlay } from './src/avatar/AvatarOverlay';
    import { PageActions } from './src/content/PageActions';
    import { TargetSite } from './src/common/types';
    globalThis.chrome = { runtime: { getURL: path => '/' + path }, storage: { local: {
      get: async () => ({}), set: async values => { document.getElementById('saved').textContent = '已儲存：' + JSON.stringify(values); }
    } } };
    const avatar = new AvatarOverlay(); avatar.enableDragging(); avatar.setImage('/assets/avatar/anya/happy.png'); avatar.setPosition(350, 440);
    const actions = new PageActions(TargetSite.CHATGPT);
    const check = () => {
      const outline = document.getElementById('ai-avatar-question-outline');
      const role = document.getElementById('ai-avatar-overlay');
      const box = role.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      const list = outline.shadowRoot.querySelector('nav').getBoundingClientRect();
      const blankY = Math.min(outline.getBoundingClientRect().bottom - 12, innerHeight - 120);
      const empty = document.elementFromPoint(300, blankY);
      const pass = hit === role && (blankY <= list.bottom || empty !== outline);
      document.getElementById('result').textContent = (pass ? 'PASS' : 'FAIL') + '：角色可接收滑鼠；導覽空白可穿透';
    };
    document.getElementById('overlap').onclick = () => { avatar.setPosition(350, 90); check(); };
    document.getElementById('many').onclick = () => {
      const main = document.querySelector('main');
      for (let i = 3; i <= 35; i++) main.insertAdjacentHTML('beforeend', '<article data-role="user">測試問題 ' + i + '</article><article data-role="assistant">測試回答</article>');
      new MutationObserver(check).observe(document.getElementById('ai-avatar-question-outline').shadowRoot.querySelector('nav'), { childList: true });
    };
    document.addEventListener('pointerup', () => requestAnimationFrame(check));
    requestAnimationFrame(() => requestAnimationFrame(check));
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json',
});
const html = `<!doctype html><html lang="zh-Hant" class="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>角色拖曳驗證 ${version}</title>
<style>body{margin:0;background:#111;color:#eee;font:16px/1.6 system-ui}aside{position:fixed;inset:0 auto 0 0;width:260px;background:#202020}main{margin-left:660px;padding:64px 24px 0;max-width:600px}article{margin-bottom:20px}header{position:fixed;top:0;left:660px}button{padding:8px}output{display:block}footer{position:fixed;bottom:12px;left:20px;z-index:2147483647;font-size:13px;pointer-events:none}</style>
<aside><h2>本機測試側欄</h2></aside><header><button id="overlap">角色移到清單文字上</button><button id="many">加入長清單</button></header>
<main><article data-role="user">第一個問題</article><article data-role="assistant">測試回答一</article><article data-role="user">第二個問題</article><article data-role="assistant">測試回答二</article></main>
<footer><strong>拖曳回歸驗證 ${version}</strong><output id="result">檢查中</output><output id="saved">尚未拖曳</output></footer><script src="/preview.js"></script></html>`;
createServer(async (request, response) => {
  if (request.url?.startsWith('/assets/avatar/')) {
    const name = request.url.slice('/assets/avatar/'.length);
    if (!/^(anya\/)?[a-z0-9]+\.(png|svg)$/.test(name)) { response.writeHead(404); response.end(); return; }
    try { response.setHeader('Content-Type', name.endsWith('.svg') ? 'image/svg+xml' : 'image/png'); response.end(await readFile(`public/assets/avatar/${name}`)); }
    catch { response.writeHead(404); response.end(); }
    return;
  }
  response.setHeader('Content-Type', request.url === '/preview.js' ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8');
  response.end(request.url === '/preview.js' ? bundle.outputFiles[0].text : html);
}).listen(4180, '127.0.0.1', () => console.log('Avatar drag regression: http://127.0.0.1:4180/c/drag-test'));
