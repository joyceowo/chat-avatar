SA：Chrome 擴充功能版「懸浮動圖 Avatar + Web 回應解析」
1. 目標與範圍

目標

實作一個 Chrome 擴充功能，在任何指定網站（例如 ChatGPT / Gemini Web）上，懸浮一個小型動圖 avatar。

擴充功能自動抓取頁面中的「AI 回應文字」，解析後切換 avatar 動作（thinking / speaking / idle / 情緒）。

範圍（MVP）

僅限桌面 Chrome。

不自建後端，只用 Chrome 擴充本身 + 可選呼叫外部 LLM API（如 Gemini 3）做進階解析。

預設只支援一兩個目標站點（例如 chatgpt.com、gemini.google.com），用 DOM 解析回應。

Avatar 動圖為本地資產（WebP/GIF），懸浮在視窗右下角（可拖曳）。

2. 系統架構概觀

架構類型：

純 Chrome Extension（Manifest V3）。

無獨立 Web 伺服器。

元件

Content Script：注入 DOM、顯示 avatar、監聽頁面變化、抓取回應。

Service Worker（Background）：管理設定、可選擇對外呼叫 LLM API。

Options Page：設定使用的目標網站、是否啟用外部 API、API Key 等。

靜態資產：avatar 動圖（idle/thinking/speaking/...）。

3. 模組設計
   3.1 manifest.json

版本：Manifest V3

權限（最小）：

"tabs"：必要時讀取目前網址。

"scripting"：在指定網域注入 content script。

"storage"：儲存使用者設定（是否開啟、API Key、模式）。

如果要呼叫外部 LLM API：在 "host_permissions" 中加入 API 網域。

重要欄位示意：

{
"manifest_version": 3,
"name": "AI Avatar Overlay",
"version": "0.0.1",
"permissions": ["scripting", "storage", "tabs"],
"host_permissions": [
"https://chatgpt.com/*",
"https://gemini.google.com/*",
"https://api.your-llm-provider.com/*"
],
"background": {
"service_worker": "background.js"
},
"content_scripts": [
{
"matches": [
"https://chatgpt.com/*",
"https://gemini.google.com/*"
],
"js": ["contentScript.js"],
"run_at": "document_idle"
}
],
"options_page": "options.html",
"web_accessible_resources": [
{
"resources": [
"assets/avatar/idle.webp",
"assets/avatar/thinking.webp",
"assets/avatar/speaking.webp"
],
"matches": ["<all_urls>"]
}
]
}

3.2 Content Script 模組
3.2.1 AvatarOverlay

職責：

在頁面最上層插入一個 <div id="ai-avatar-overlay">。

使用 position: fixed; z-index: 999999; 懸浮在畫面右下角。

顯示對應動圖：idle/thinking/speaking/...。

支援滑鼠拖曳位置（可選）。

結構示意：

<div id="ai-avatar-overlay">
  <img id="ai-avatar-img" src="chrome-extension://.../assets/avatar/idle.webp" />
</div>


CSS 要求：

固定大小（例如 128×128）

pointer-events：視需求，避免擋住頁面操作時可開關

3.2.2 ResponseWatcher

職責：

利用 MutationObserver 監聽目標網站的 DOM 變化，偵測「AI 回應區塊」新增。

範例策略（ChatGPT / Gemini Web）：

ChatGPT：監看對話區父容器，選出「assistant role」的最新訊息 DOM。

Gemini：監看對話列表區塊，抓最後一個「AI 回應」元素。

流程：

初始化時，建立 MutationObserver 掛在 root 容器（例如主對話區）。

每次偵測到新節點加入：

檢查是否為 AI 回應節點。

取得其純文字內容。

呼叫 AvatarController.onNewResponse(text)。

3.2.3 AvatarController

職責：

控制 avatar 狀態 (idle/thinking/speaking/mood-specific)。

在「送出訊息 -> 等待 AI 回應」這段期間顯示 thinking。

當 ResponseWatcher 告知有新回應文字時：

切換為 speaking，維持一段時間（例如訊息長度對應秒數）。

完成後切 idle。

額外：若啟用「情緒解析」，由 background 送回 mood，再映射到不同動圖。

3.2.4 RequestHook（選配）

若不想依賴 DOM，也可在 content script 裡 hook window.fetch / XMLHttpRequest，監聽特定 API 回應（例如 ChatGPT web 的 /backend-api/conversation）。
MVP 建議先不做，先用 DOM + MutationObserver。

3.3 Background / Service Worker 模組
3.3.1 ConfigService

職責：

讀寫 Chrome Storage（同步或本機）。

設定項：

是否啟用擴充功能

是否啟用外部 LLM API 分析

LLM Provider 種類（none | gemini | openai ...）

各 provider API Key / Model name

3.3.2 LlmAdapter（選配）

如果只「讀頁面文字 + 規則式判斷」，可以不做這個模組。
若要用 Gemini 3 幫忙「判斷情緒／分類語氣」，則在 background 實作類似：

GeminiAdapter：

接受 text 參數，呼叫 Gemini API（純 HTTP fetch）。

回傳 mood or state（例如："happy" | "sad" | "angry" | "neutral"）。

background 負責：

接收 content script 傳來的「新回應文本」。

若設定為啟用 LLM：呼叫 Gemini 3 API → 拿到情緒結果 → 用 chrome.tabs.sendMessage 回推給 content script。

3.4 Options Page 模組

職責：

提供簡單 UI：

啟用/停用擴充

選擇 LLM Provider（none/gemini/openai）

輸入各 Provider 的 API Key / model name

選擇 avatar 風格（可選多皮膚）

4. 資料流程（MVP）

使用者開啟 ChatGPT 或 Gemini 網頁。

Chrome 依 content_scripts.matches 注入 contentScript.js。

contentScript.js：

建立 avatar overlay。

設定 MutationObserver 監聽對話 DOM。

使用者在網頁上送出提問（透過原本網站 UI）。

網站開始生成 AI 回應：

DOM 新增「AI 回應」節點。

MutationObserver 偵測到 → 抽出文本。

呼叫 AvatarController.onNewResponse(text)。

如未開啟外部 LLM：

由 content script 本地規則決定主情緒（例如關鍵字 / 長度 / 是否有感謝/警告）。

切換動圖狀態。

如開啟外部 LLM（Gemini 3）：

content script 將 text 傳給 background。

background 透過 GeminiAdapter 呼叫 Gemini 3 API，取得情緒標籤。

background 把情緒標籤回傳 content script。

AvatarController 根據情緒回傳切換對應動作（例如 happy, sad, serious）。

5. 技術棧（Chrome 擴充版本）

平台：Chrome Extension Manifest V3

語言：

JavaScript 或 TypeScript（建議 TS）

前端 / UI：

原生 DOM + CSS（無需框架）

options page 可用任意前端工具（MVP 用原生 HTML 即可）

動圖格式：

WebP / GIF，建議 WebP（檔案小、品質好）

API：

chrome.scripting、chrome.storage、chrome.tabs

若啟用外部 LLM：fetch 呼叫 Gemini 3 / 其他 API

6. 專案結構（範例）
   extension/
   manifest.json
   src/
   contentScript.ts
   background.ts
   avatar/
   avatarOverlay.ts
   avatarController.ts
   responseWatcher.ts
   options/
   options.html
   options.ts
   assets/
   avatar/
   idle.webp
   thinking.webp
   speaking.webp
   happy.webp      # 可選
   sad.webp        # 可選
   dist/               # 打包輸出

7. 最小可執行條件

完成以下後即可實際看到效果：

manifest.json（含 content_scripts + web_accessible_resources）

contentScript：

插入 overlay + idle 動圖

對 ChatGPT DOM 建立 MutationObserver，偵測最新 AI 回應文字

新回應時切換 speaking → 延遲後 idle

assets/avatar 三張基本動圖（idle/thinking/speaking）

進階再加入：

options page（切換是否啟動、選擇站點）

background + Gemini 3 API 情緒標註。