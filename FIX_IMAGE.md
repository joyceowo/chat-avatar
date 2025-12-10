# 🔧 立即修復圖片顯示問題

## 問題分析
根據診斷結果：
- ✅ 頭像元素已建立
- ✅ 圖片元素存在
- ❌ 圖片 `src` 為空字串
- ❌ `chrome.runtime.getURL` 在 Console 中無法使用（因為在頁面上下文，不是擴充功能上下文）

## 🚀 立即修復方案

### 方案 1: 在 ChatGPT 頁面執行修復腳本

請在 ChatGPT 頁面的 Console 中執行以下腳本：

```javascript
// 修復腳本 - 直接設定圖片 URL
(function() {
  console.log('=== 開始修復圖片 ===');
  
  const img = document.getElementById('ai-avatar-img');
  
  if (!img) {
    console.log('❌ 找不到圖片元素');
    return;
  }
  
  // 從擴充功能 ID 獲取正確的 URL
  // 方法 1: 檢查現有的擴充功能資源
  const scripts = document.querySelectorAll('script[src*="chrome-extension"]');
  let extensionId = null;
  
  if (scripts.length > 0) {
    const src = scripts[0].src;
    const match = src.match(/chrome-extension:\/\/([^\/]+)\//);
    if (match) {
      extensionId = match[1];
      console.log('✅ 找到擴充功能 ID:', extensionId);
    }
  }
  
  if (extensionId) {
    const imageUrl = `chrome-extension://${extensionId}/assets/avatar/idle.svg`;
    console.log('嘗試載入:', imageUrl);
    
    img.onload = () => {
      console.log('✅ 圖片載入成功！');
    };
    
    img.onerror = () => {
      console.log('❌ 圖片載入失敗');
    };
    
    img.src = imageUrl;
  } else {
    console.log('❌ 無法找到擴充功能 ID');
    console.log('請手動執行方案 2');
  }
  
  console.log('=== 修復完成 ===');
})();
```

### 方案 2: 手動設定圖片 URL

1. **找到擴充功能 ID**：
   - 前往 `chrome://extensions/`
   - 找到「AI Avatar Overlay v2」
   - 複製擴充功能 ID（例如：`abcdefghijklmnopqrstuvwxyz123456`）

2. **在 ChatGPT 頁面執行**：
   ```javascript
   // 替換 YOUR_EXTENSION_ID 為實際的 ID
   const img = document.getElementById('ai-avatar-img');
   img.src = 'chrome-extension://YOUR_EXTENSION_ID/assets/avatar/idle.svg';
   ```

---

## 🔍 根本原因

問題出在 `AvatarController` 初始化時調用 `getAssetUrl`，但此時 `chrome.runtime.getURL` 可能還沒準備好或返回空字串。

## 🛠️ 永久修復方案

需要修改源碼，確保圖片 URL 正確設定。我將為您修復這個問題。

---

## ✅ 驗證修復

執行修復腳本後，檢查：

```javascript
const img = document.getElementById('ai-avatar-img');
console.log('Image src:', img.src);
console.log('Image loaded:', img.complete && img.naturalWidth > 0);
```

應該看到：
```
Image src: chrome-extension://[id]/assets/avatar/idle.svg
Image loaded: true
```

---

## 📝 下一步

1. 先使用方案 1 或方案 2 臨時修復
2. 我將修改源碼永久解決此問題
3. 重新建置後就不需要手動修復了

