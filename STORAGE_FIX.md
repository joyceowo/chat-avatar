# 儲存配額問題修復

## 🐛 問題描述

當嘗試儲存自訂頭像時，出現以下錯誤：

```
Error: Resource::kQuotaBytesPerItem quota exceeded
```

## 🔍 原因分析

Chrome 擴充功能有兩種儲存方式：

### chrome.storage.sync
- **用途**：同步設定到所有登入的 Chrome 瀏覽器
- **總容量限制**：100KB
- **單項限制**：8KB
- **問題**：圖片轉換為 Base64 後通常超過 8KB

### chrome.storage.local
- **用途**：本地儲存，不同步
- **總容量限制**：5MB（無限制模式下可達 10MB）
- **單項限制**：無
- **優點**：足夠儲存多張圖片

## ✅ 解決方案

### 分離儲存策略

1. **一般設定** → `chrome.storage.sync`
   - 啟用/停用
   - LLM 提供者
   - API 金鑰
   - 模型名稱
   - 頭像樣式
   - 目標網站

2. **自訂頭像** → `chrome.storage.local`
   - 7 種情緒狀態的自訂圖片
   - Base64 編碼的圖片資料

### 修改的檔案

1. **src/common/constants.ts**
   - 新增 `STORAGE_KEY_CUSTOM_AVATARS` 常數

2. **src/common/types.ts**
   - 從 `ExtensionConfig` 移除 `customAvatars` 欄位
   - 保留 `CustomAvatarImages` 介面（獨立使用）

3. **src/options/options.ts**
   - `loadSettings()`: 從 `chrome.storage.local` 載入自訂頭像
   - `saveSettings()`: 將自訂頭像儲存到 `chrome.storage.local`

4. **src/content/contentScript.ts**
   - `loadCustomAvatars()`: 從 `chrome.storage.local` 載入自訂頭像

## 📊 儲存容量對比

### 修復前（全部使用 sync）
```
chrome.storage.sync (100KB 限制)
├── 一般設定 (~1KB)
└── 自訂頭像 (~50-500KB) ❌ 超過限制！
```

### 修復後（分離儲存）
```
chrome.storage.sync (100KB 限制)
└── 一般設定 (~1KB) ✅

chrome.storage.local (5MB 限制)
└── 自訂頭像 (~50-500KB) ✅
```

## 🎯 影響

### 優點
✅ 可以儲存大型圖片（最多 5MB）
✅ 不會超過配額限制
✅ 一般設定仍會同步到所有裝置

### 缺點
❌ 自訂頭像不會同步到其他裝置
❌ 需要在每個裝置上分別設定自訂頭像

## 💡 建議

### 圖片大小建議
- **單張圖片**：< 500KB
- **總大小**：< 3.5MB（7 張圖片）
- **格式**：SVG（最小）> PNG > JPG

### 壓縮工具
- [TinyPNG](https://tinypng.com/) - PNG/JPG 壓縮
- [Squoosh](https://squoosh.app/) - 多格式壓縮
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - SVG 優化

## 🧪 測試

### 測試步驟

1. **重新載入擴充功能**
   ```
   chrome://extensions/ → 重新整理
   ```

2. **開啟選項頁面**
   ```
   右鍵點擊擴充功能圖示 → 選項
   ```

3. **上傳測試圖片**
   - 選擇一張圖片（建議 < 500KB）
   - 點擊「Save Settings」
   - 應該看到「Settings saved successfully!」

4. **檢查 Console**
   - 不應該再看到 "quota exceeded" 錯誤

5. **測試效果**
   - 前往 ChatGPT 頁面
   - 重新整理頁面
   - 確認自訂頭像顯示正常

### 預期 Console 輸出

**選項頁面**：
```
Settings saved successfully!
```

**ChatGPT 頁面**：
```
✅ Custom avatars loaded: 1 states
```

## 📝 版本資訊

- **修復版本**：v0.0.2
- **修復日期**：2025-12-10
- **影響範圍**：自訂頭像功能

---

**問題已解決！** ✅

