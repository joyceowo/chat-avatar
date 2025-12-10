# 🧪 AI Avatar Overlay - 測試指南

## 📋 目錄
1. [建置擴充功能](#1-建置擴充功能)
2. [安裝到 Chrome](#2-安裝到-chrome)
3. [基本功能測試](#3-基本功能測試)
4. [進階功能測試](#4-進階功能測試)
5. [常見問題排除](#5-常見問題排除)

---

## 1. 建置擴充功能

### 步驟 1: 執行建置
```bash
npm run build
```

### 預期結果
```
✓ Built JavaScript files
✓ Copied static files
✅ Build complete!
```

### 驗證建置產物
檢查 `dist/` 目錄應包含：
```
dist/
├── background.js
├── background.js.map
├── contentScript.js
├── contentScript.js.map
├── options.js
├── options.js.map
├── manifest.json
├── options.html
└── assets/
    ├── avatar/
    │   ├── idle.svg
    │   ├── thinking.svg
    │   ├── speaking.svg
    │   ├── happy.svg
    │   ├── sad.svg
    │   ├── excited.svg
    │   └── confused.svg
    └── icon16.png, icon48.png, icon128.png
```

---

## 2. 安裝到 Chrome

### 步驟 1: 開啟擴充功能頁面
1. 開啟 Chrome 瀏覽器
2. 在網址列輸入：`chrome://extensions/`
3. 按 Enter

### 步驟 2: 啟用開發者模式
1. 在右上角找到「開發人員模式」(Developer mode) 開關
2. 點擊開啟（開關變成藍色）

### 步驟 3: 載入擴充功能
1. 點擊左上角的「載入未封裝項目」(Load unpacked) 按鈕
2. 瀏覽到專案的 `dist/` 目錄
3. 選擇 `dist` 資料夾並點擊「選擇資料夾」

### 步驟 4: 驗證安裝
確認擴充功能卡片顯示：
- ✅ 名稱：「AI Avatar Overlay v2」
- ✅ 版本：「0.0.2」
- ✅ 狀態：已啟用（開關為藍色）
- ✅ 無錯誤訊息

---

## 3. 基本功能測試

### 測試 1: ChatGPT 整合測試

#### 步驟：
1. 開啟新分頁，前往 https://chatgpt.com
2. 登入您的 ChatGPT 帳號（如需要）
3. 觀察頁面右下角

#### 預期結果：
- ✅ 應該看到一個 128x128 像素的頭像出現在右下角
- ✅ 頭像顯示「閒置」(idle) 狀態

#### 步驟：
4. 在 ChatGPT 輸入框輸入：「你好，請介紹一下自己」
5. 按 Enter 送出

#### 預期結果：
- ✅ 送出後，頭像應切換到「思考」(thinking) 狀態
- ✅ ChatGPT 開始回應時，頭像切換到「說話」(speaking) 狀態
- ✅ 回應完成後幾秒，頭像回到「閒置」(idle) 狀態

### 測試 2: Google Gemini 整合測試

#### 步驟：
1. 開啟新分頁，前往 https://gemini.google.com
2. 登入您的 Google 帳號（如需要）
3. 觀察頁面右下角

#### 預期結果：
- ✅ 頭像出現在右下角，顯示「閒置」狀態

#### 步驟：
4. 輸入問題：「請解釋什麼是人工智慧」
5. 送出訊息

#### 預期結果：
- ✅ 頭像狀態變化：閒置 → 思考 → 說話 → 閒置

### 測試 3: 拖曳功能測試

#### 步驟：
1. 在 ChatGPT 或 Gemini 頁面上
2. 將滑鼠移到頭像上（游標應變成移動圖示）
3. 按住滑鼠左鍵並拖曳頭像到不同位置
4. 放開滑鼠

#### 預期結果：
- ✅ 頭像可以被拖曳到任意位置
- ✅ 拖曳過程流暢，無延遲
- ✅ 放開後頭像停留在新位置

### 測試 4: 多次對話測試

#### 步驟：
1. 連續發送 3-5 個問題給 AI
2. 觀察每次對話時頭像的反應

#### 預期結果：
- ✅ 每次對話都能正確觸發狀態變化
- ✅ 沒有狀態卡住或不更新的情況
- ✅ 動畫過渡自然流暢

---

## 4. 進階功能測試

### 測試 5: 開發者工具檢查

#### 步驟：
1. 在 ChatGPT 或 Gemini 頁面按 F12 開啟開發者工具
2. 切換到「Console」標籤
3. 重新整理頁面

#### 預期結果：
- ✅ 應該看到：`AI Avatar Overlay: Initialized successfully`
- ❌ 不應該有紅色錯誤訊息
- ⚠️ 可能有黃色警告（console.log），這是正常的

### 測試 6: 擴充功能背景服務

#### 步驟：
1. 回到 `chrome://extensions/`
2. 找到「AI Avatar Overlay v2」
3. 點擊「檢查檢視」→「Service Worker」

#### 預期結果：
- ✅ 開啟背景頁面的開發者工具
- ✅ Console 顯示：`AI Avatar Overlay Background: Initialized`
- ❌ 無錯誤訊息

### 測試 7: 選項頁面測試

#### 步驟：
1. 在 `chrome://extensions/` 頁面
2. 找到「AI Avatar Overlay v2」
3. 點擊「詳細資料」
4. 點擊「擴充功能選項」

#### 預期結果：
- ✅ 開啟選項頁面（options.html）
- ✅ 顯示配置選項（如果已實作）

### 測試 8: 不同文字長度測試

#### 步驟：
1. 發送短問題：「Hi」
2. 觀察頭像「說話」狀態持續時間
3. 發送長問題：「請詳細解釋量子力學的基本原理，包括波粒二象性、不確定性原理等概念」
4. 觀察頭像「說話」狀態持續時間

#### 預期結果：
- ✅ 短回應：頭像說話時間較短（約 2-3 秒）
- ✅ 長回應：頭像說話時間較長（約 5-10 秒）
- ✅ 時間與回應長度成正比

---

## 5. 常見問題排除

### 問題 1: 頭像沒有出現

**可能原因與解決方法：**

1. **檢查擴充功能是否啟用**
   - 前往 `chrome://extensions/`
   - 確認「AI Avatar Overlay v2」開關為藍色（已啟用）

2. **檢查網站是否支援**
   - 目前僅支援：
     - https://chatgpt.com
     - https://chat.openai.com
     - https://gemini.google.com

3. **檢查 Console 錯誤**
   - 按 F12 開啟開發者工具
   - 查看 Console 是否有錯誤訊息
   - 截圖錯誤訊息以便除錯

4. **重新載入擴充功能**
   - 前往 `chrome://extensions/`
   - 點擊擴充功能的重新整理圖示 🔄
   - 重新整理測試頁面

### 問題 2: 頭像圖片無法顯示

**檢查步驟：**

1. **驗證資源檔案**
   ```bash
   # 確認 dist/assets/avatar/ 目錄存在且包含 SVG 檔案
   ls dist/assets/avatar/
   ```

2. **檢查 manifest.json**
   - 開啟 `dist/manifest.json`
   - 確認 `web_accessible_resources` 包含 avatar 資源

3. **查看網路請求**
   - F12 → Network 標籤
   - 重新整理頁面
   - 搜尋 `.svg` 或 `avatar`
   - 檢查是否有 404 錯誤

### 問題 3: 頭像狀態不變化

**除錯步驟：**

1. **檢查 MutationObserver**
   - F12 → Console
   - 輸入：`console.log('Test')`
   - 發送訊息給 AI
   - 觀察是否有新的 console 輸出

2. **檢查 DOM 選擇器**
   - ChatGPT 或 Gemini 可能更新了 DOM 結構
   - 需要更新 `SiteAdapterFactory.ts` 中的選擇器

3. **重新安裝擴充功能**
   - 移除擴充功能
   - 重新執行 `npm run build`
   - 重新載入 unpacked extension

### 問題 4: TypeScript 編譯錯誤

**解決方法：**

```bash
# 清除快取並重新安裝
rm -rf node_modules package-lock.json
npm install

# 重新建置
npm run build
```

### 問題 5: 擴充功能載入失敗

**檢查清單：**

- ✅ 確認選擇的是 `dist/` 目錄，不是專案根目錄
- ✅ 確認 `dist/manifest.json` 存在
- ✅ 確認 manifest.json 格式正確（JSON 語法）
- ✅ 確認所有必要檔案都已建置

---

## 📊 測試檢查清單

使用此清單確保所有功能都已測試：

- [ ] 建置成功無錯誤
- [ ] 擴充功能成功載入到 Chrome
- [ ] ChatGPT 頁面顯示頭像
- [ ] Gemini 頁面顯示頭像
- [ ] 頭像可以拖曳
- [ ] 閒置狀態正常顯示
- [ ] 思考狀態正常顯示
- [ ] 說話狀態正常顯示
- [ ] 狀態自動轉換正常
- [ ] 多次對話都能正確反應
- [ ] Console 無嚴重錯誤
- [ ] 背景服務正常運作

---

## 🎯 效能測試

### 記憶體使用測試

1. 開啟 Chrome 工作管理員（Shift + Esc）
2. 找到擴充功能相關的處理程序
3. 觀察記憶體使用量

**預期結果：**
- Content Script: < 10 MB
- Background Service Worker: < 5 MB

### CPU 使用測試

1. 在 ChatGPT 進行長時間對話（10+ 輪）
2. 觀察 CPU 使用率

**預期結果：**
- 閒置時: < 1% CPU
- 對話時: < 5% CPU

---

## 📝 測試報告範本

```markdown
## 測試報告

**測試日期**: YYYY-MM-DD
**測試者**: [您的名字]
**版本**: 0.0.2

### 測試環境
- Chrome 版本: 
- 作業系統: 
- 測試網站: ChatGPT / Gemini

### 測試結果
- [ ] 基本功能: 通過/失敗
- [ ] 拖曳功能: 通過/失敗
- [ ] 狀態轉換: 通過/失敗
- [ ] 效能表現: 通過/失敗

### 發現的問題
1. [描述問題]
2. [描述問題]

### 建議改進
1. [建議]
2. [建議]
```

---

**祝測試順利！** 🚀

