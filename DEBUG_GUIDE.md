# 🔍 圖片載入問題診斷指南

## 問題：頭像顯示為死圖（Broken Image）

---

## 🚨 立即檢查步驟

### 步驟 1: 重新載入擴充功能

1. 前往 `chrome://extensions/`
2. 找到「AI Avatar Overlay v2」
3. 點擊 **重新整理圖示** 🔄（在擴充功能卡片上）
4. 重新整理 ChatGPT/Gemini 頁面

---

### 步驟 2: 檢查 Console 錯誤

1. 在 ChatGPT 或 Gemini 頁面按 **F12**
2. 切換到 **Console** 標籤
3. 查看是否有紅色錯誤訊息

**常見錯誤訊息：**
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
chrome-extension://[id]/assets/avatar/idle.svg
```

---

### 步驟 3: 檢查 Network 請求

1. 按 **F12** 開啟開發者工具
2. 切換到 **Network** 標籤
3. 重新整理頁面
4. 在過濾器中輸入 `svg` 或 `avatar`
5. 查看圖片請求的狀態

**預期結果：**
- ✅ Status: 200 (成功)
- ❌ Status: 404 (找不到檔案)

---

### 步驟 4: 手動測試圖片 URL

1. 在 ChatGPT 頁面按 **F12**
2. 切換到 **Console** 標籤
3. 輸入以下指令並按 Enter：

```javascript
// 測試圖片 URL
const url = chrome.runtime.getURL('assets/avatar/idle.svg');
console.log('Image URL:', url);

// 測試載入圖片
const img = new Image();
img.onload = () => console.log('✅ Image loaded successfully!');
img.onerror = () => console.log('❌ Image failed to load!');
img.src = url;
```

**預期輸出：**
```
Image URL: chrome-extension://[extension-id]/assets/avatar/idle.svg
✅ Image loaded successfully!
```

---

## 🔧 解決方案

### 解決方案 1: 完全重新建置和載入

```bash
# 1. 清除舊的建置
rm -rf dist

# 2. 重新建置
npm run build

# 3. 在 Chrome 中：
#    - 移除舊的擴充功能
#    - 重新載入 dist/ 目錄
```

---

### 解決方案 2: 檢查檔案權限

```bash
# Windows PowerShell
Get-ChildItem -Path "dist/assets/avatar" -Recurse | Select-Object FullName, Length

# 確認所有 SVG 檔案都存在且大小 > 0
```

---

### 解決方案 3: 修改 manifest.json（如果需要）

如果 `web_accessible_resources` 設定有問題，可以嘗試更明確的設定：

```json
"web_accessible_resources": [
  {
    "resources": [
      "assets/avatar/idle.svg",
      "assets/avatar/thinking.svg",
      "assets/avatar/speaking.svg",
      "assets/avatar/happy.svg",
      "assets/avatar/sad.svg",
      "assets/avatar/excited.svg",
      "assets/avatar/confused.svg"
    ],
    "matches": ["<all_urls>"]
  }
]
```

---

### 解決方案 4: 檢查 Content Script 是否正確注入

在 ChatGPT 頁面的 Console 中執行：

```javascript
// 檢查頭像元素是否存在
const overlay = document.getElementById('ai-avatar-overlay');
console.log('Overlay element:', overlay);

const img = document.getElementById('ai-avatar-img');
console.log('Image element:', img);
console.log('Image src:', img?.src);
```

**預期輸出：**
```
Overlay element: <div id="ai-avatar-overlay">...</div>
Image element: <img id="ai-avatar-img" src="chrome-extension://...">
Image src: chrome-extension://[id]/assets/avatar/idle.svg
```

---

## 🐛 進階除錯

### 檢查擴充功能 ID

1. 前往 `chrome://extensions/`
2. 找到「AI Avatar Overlay v2」
3. 記下擴充功能 ID（例如：`abcdefghijklmnopqrstuvwxyz123456`）
4. 在瀏覽器新分頁輸入：
   ```
   chrome-extension://[你的擴充功能ID]/assets/avatar/idle.svg
   ```
5. 按 Enter

**預期結果：**
- ✅ 顯示 SVG 圖片（綠色圓圈加笑臉）
- ❌ 顯示錯誤頁面

---

### 檢查 Content Script 載入

在 ChatGPT 頁面 Console 執行：

```javascript
// 檢查是否有初始化訊息
console.log('Checking for extension...');

// 嘗試手動建立頭像
const testOverlay = document.createElement('div');
testOverlay.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 128px;
  height: 128px;
  z-index: 999999;
  background: red;
`;
testOverlay.textContent = 'TEST';
document.body.appendChild(testOverlay);

// 如果看到紅色方塊，表示 DOM 操作正常
// 5 秒後移除
setTimeout(() => testOverlay.remove(), 5000);
```

---

## 📋 診斷檢查清單

請依序檢查以下項目：

- [ ] 擴充功能已在 `chrome://extensions/` 中啟用
- [ ] 已點擊重新整理圖示 🔄
- [ ] 已重新整理測試頁面
- [ ] `dist/assets/avatar/idle.svg` 檔案存在
- [ ] Console 中看到「AI Avatar Overlay: Initialized successfully」
- [ ] Console 中沒有紅色錯誤訊息
- [ ] Network 標籤中 SVG 請求狀態為 200
- [ ] 手動測試圖片 URL 成功載入
- [ ] 頭像 DOM 元素存在於頁面中
- [ ] 圖片 src 屬性正確設定

---

## 🎯 最可能的原因

根據經驗，圖片載入失敗通常是以下原因之一：

### 1. **擴充功能未重新載入** (90%)
   - **解決**：在 `chrome://extensions/` 點擊重新整理

### 2. **快取問題** (5%)
   - **解決**：Ctrl + Shift + R 強制重新整理頁面

### 3. **manifest.json 設定問題** (3%)
   - **解決**：檢查 `web_accessible_resources` 設定

### 4. **檔案路徑錯誤** (2%)
   - **解決**：確認檔案確實在 `dist/assets/avatar/` 中

---

## 💡 快速修復腳本

將以下內容貼到 ChatGPT 頁面的 Console 中：

```javascript
// 快速診斷腳本
(function() {
  console.log('=== AI Avatar Overlay 診斷 ===');
  
  // 1. 檢查元素
  const overlay = document.getElementById('ai-avatar-overlay');
  const img = document.getElementById('ai-avatar-img');
  
  console.log('1. Overlay 元素:', overlay ? '✅ 存在' : '❌ 不存在');
  console.log('2. Image 元素:', img ? '✅ 存在' : '❌ 不存在');
  
  if (img) {
    console.log('3. Image src:', img.src);
    console.log('4. Image complete:', img.complete);
    console.log('5. Image naturalWidth:', img.naturalWidth);
    
    if (img.naturalWidth === 0) {
      console.log('❌ 圖片載入失敗！');
      
      // 嘗試重新載入
      const url = chrome.runtime.getURL('assets/avatar/idle.svg');
      console.log('6. 嘗試重新載入:', url);
      img.src = url;
    } else {
      console.log('✅ 圖片載入成功！');
    }
  }
  
  console.log('=== 診斷完成 ===');
})();
```

---

## 📞 需要更多幫助？

如果以上步驟都無法解決問題，請提供以下資訊：

1. Chrome 版本號
2. Console 中的完整錯誤訊息（截圖）
3. Network 標籤中的請求狀態（截圖）
4. 執行診斷腳本的輸出結果

---

**祝您順利解決問題！** 🚀

