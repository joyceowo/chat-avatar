# 測試自訂頭像功能

## 🧪 測試步驟

### 步驟 1: 重新載入擴充功能

1. 前往 `chrome://extensions/`
2. 找到「AI Avatar Overlay v2」
3. 點擊重新整理圖示 🔄

### 步驟 2: 開啟選項頁面

1. 在擴充功能卡片上點擊「詳細資料」
2. 點擊「擴充功能選項」
3. 或直接右鍵點擊擴充功能圖示 → 選項

### 步驟 3: 測試圖片上傳

#### 測試 A: 上傳單一圖片

1. 在「Custom Avatar Images」區塊找到「Happy (開心)」卡片
2. 點擊「Choose Image」按鈕
3. 選擇一張圖片（建議使用 PNG 或 SVG）
4. 確認圖片顯示在預覽區
5. 點擊「Save Settings」
6. 應該看到「Settings saved successfully!」訊息

#### 測試 B: 上傳多張圖片

1. 為不同的情緒狀態上傳不同的圖片
2. 例如：
   - Happy: 😄 表情圖片
   - Sad: 😢 表情圖片
   - Excited: 🎉 表情圖片
3. 點擊「Save Settings」

#### 測試 C: 重置圖片

1. 點擊某個已上傳圖片的「Reset to Default」按鈕
2. 確認預覽區顯示預設圖片（半透明）
3. 點擊「Save Settings」

### 步驟 4: 測試實際效果

1. 前往 ChatGPT 頁面 (https://chat.openai.com)
2. 重新整理頁面 (`Ctrl + Shift + R`)
3. 觀察右下角的頭像

#### 預期行為：

**初始狀態**：
- 如果有歷史對話，頭像應該顯示最後一筆回應的情緒
- 如果沒有歷史對話，頭像顯示 Idle 狀態
- **如果您上傳了自訂圖片，應該顯示您的自訂圖片**

**發送訊息測試**：

發送測試訊息：
```
請用開心的語氣回答：太好了！這真是太棒了！
```

**預期結果**：
1. AI 開始回應時，頭像可能短暫顯示 Thinking 或 Speaking 狀態
2. 回應完成後，頭像應該變成 Happy 狀態
3. **如果您為 Happy 狀態上傳了自訂圖片，應該顯示您的圖片**

### 步驟 5: 測試配置更新

1. 保持 ChatGPT 頁面開啟
2. 回到選項頁面
3. 上傳或更改某個情緒狀態的圖片
4. 點擊「Save Settings」
5. 回到 ChatGPT 頁面
6. 重新整理頁面
7. 確認新的圖片已生效

## 📊 測試檢查清單

- [ ] 選項頁面正確顯示 7 個情緒狀態卡片
- [ ] 每個卡片都有預覽區、上傳按鈕、重置按鈕
- [ ] 可以成功上傳圖片
- [ ] 上傳後預覽區立即顯示圖片
- [ ] 點擊「Save Settings」後顯示成功訊息
- [ ] 重置按鈕可以恢復預設圖片
- [ ] ChatGPT 頁面顯示自訂頭像
- [ ] 情緒變化時正確切換自訂圖片
- [ ] 更新配置後重新整理頁面可以看到新圖片

## 🐛 常見問題排查

### 問題 1: 上傳圖片後沒有顯示

**檢查**：
1. 開啟 Console (`F12`)
2. 查看是否有錯誤訊息
3. 確認圖片格式是否支援（PNG, JPG, SVG, GIF）
4. 確認圖片大小是否小於 1MB

### 問題 2: 儲存後沒有生效

**檢查**：
1. 確認點擊了「Save Settings」按鈕
2. 確認看到「Settings saved successfully!」訊息
3. 重新整理 ChatGPT 頁面
4. 開啟 Console 查看是否有「✅ Custom avatars loaded」訊息

### 問題 3: 圖片顯示模糊

**解決方案**：
1. 使用更高解析度的圖片（建議 128x128 或更大）
2. 使用 SVG 格式以獲得最佳品質
3. 確保圖片是正方形（1:1 比例）

## 🔍 Console 日誌檢查

### 選項頁面 Console

開啟選項頁面時應該看到：
```
(無特殊訊息，除非有錯誤)
```

上傳圖片時應該看到：
```
happy avatar updated
```

儲存設定時應該看到：
```
Settings saved successfully!
```

### ChatGPT 頁面 Console

頁面載入時應該看到：
```
👀 ResponseWatcher: Starting...
⏳ No responses found yet, retrying in 0.5s (attempt 1/10)...
AI Avatar Overlay: Initialized successfully
✅ Custom avatars loaded
📚 Marked X existing responses as processed
🎨 Analyzing last response to set initial avatar state...
```

## 📝 測試報告範本

```
測試日期：2025-12-10
測試環境：Chrome 版本 XXX

✅ 功能測試
- [ ] 選項頁面顯示正常
- [ ] 圖片上傳功能正常
- [ ] 圖片預覽功能正常
- [ ] 儲存功能正常
- [ ] 重置功能正常

✅ 整合測試
- [ ] ChatGPT 頁面顯示自訂頭像
- [ ] 情緒變化正確切換圖片
- [ ] 配置更新即時生效

❌ 發現的問題
1. (描述問題)
2. (描述問題)

💡 改進建議
1. (建議)
2. (建議)
```

---

**祝測試順利！** 🚀

