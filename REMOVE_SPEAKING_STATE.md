# 移除 SPEAKING 狀態

## 🎯 目的

移除 `SPEAKING` 狀態以簡化狀態管理，避免中間狀態造成的複雜性。

## 📝 變更說明

### 之前的行為（7 種狀態）

```
IDLE → THINKING → SPEAKING → [情緒狀態] → IDLE
```

**問題**：
- SPEAKING 是一個中間狀態，難以控制
- 當沒有偵測到情緒時，會預設使用 SPEAKING
- 造成狀態轉換過於複雜

### 現在的行為（6 種狀態）

```
IDLE → THINKING → [情緒狀態] → 保持
```

**改進**：
- 移除 SPEAKING 中間狀態
- 當沒有偵測到情緒時，**保持當前狀態**
- 狀態轉換更簡單、更可預測

## 🎨 支援的狀態

現在有 10 種狀態：

1. **IDLE** (閒置) - 預設狀態
2. **THINKING** (思考中) - 使用者發送訊息時
3. **HAPPY** (開心) - 偵測到開心情緒
4. **SAD** (難過) - 偵測到難過情緒
5. **EXCITED** (興奮) - 偵測到興奮情緒
6. **CONFUSED** (困惑) - 偵測到困惑情緒
7. **ANGRY** (生氣) - 偵測到生氣情緒
8. **SURPRISED** (驚訝) - 偵測到驚訝情緒
9. **WORRIED** (擔心) - 偵測到擔心情緒
10. **NEUTRAL** (中性) - 偵測到中性情緒

## 🔄 狀態轉換邏輯

### 情境 1: 有情緒分析結果

```
當前狀態: IDLE
AI 回應: "太好了！這真是太棒了！"
情緒分析: HAPPY
結果: IDLE → HAPPY
```

### 情境 2: 沒有情緒分析結果

```
當前狀態: SAD
AI 回應: "好的，我明白了。"
情緒分析: 無
結果: 保持 SAD（不改變）
```

### 情境 3: LLM 未配置

```
當前狀態: EXCITED
AI 回應: "這是一個回應。"
情緒分析: 無（LLM 未配置）
結果: 保持 EXCITED（不改變）
```

## 📦 修改的檔案

### 1. `src/common/types.ts`
- 從 `AvatarState` enum 移除 `SPEAKING`
- 從 `CustomAvatarImages` 移除 `SPEAKING` 欄位

### 2. `src/common/constants.ts`
- 從 `AVATAR_IMAGES` 移除 `SPEAKING` 映射

### 3. `src/avatar/AvatarController.ts`
- 修改 `onNewResponse()` 方法
- 當沒有情緒時，**保持當前狀態**而不是改為 SPEAKING

**之前**：
```typescript
const targetState = emotion || AvatarState.SPEAKING;
this.setState(targetState);
```

**現在**：
```typescript
if (!emotion) {
  console.log('💬 No emotion detected, keeping current state:', this.currentState);
  return;
}
this.setState(emotion);
```

### 4. `src/adapters/LlmAdapterFactory.ts`
- 將所有 `AvatarState.SPEAKING` 改為 `AvatarState.IDLE`
- 包括錯誤處理和預設值

### 5. `src/options/options.ts`
- 從 `stateLabels` 移除 `SPEAKING` 標籤

### 6. `src/content/contentScript.ts`
- 更新日誌訊息
- 當沒有情緒時，不呼叫 `onNewResponse()`

### 7. `tests/unit/AvatarController.test.ts`
- 更新測試案例以反映新行為
- 測試「保持當前狀態」而不是「改為 SPEAKING」

### 8. 文件更新
- `CUSTOM_AVATARS_GUIDE.md` - 更新為 6 種狀態
- `TESTING_CUSTOM_AVATARS.md` - 更新測試步驟

## 🧪 測試重點

### 測試 1: 有情緒分析

1. 前往 ChatGPT 頁面
2. 發送訊息：「請用開心的語氣回答：太好了！」
3. **預期**：頭像變成 HAPPY

### 測試 2: 無情緒分析（LLM 未配置）

1. 確保 LLM Provider 設定為 "None"
2. 前往 ChatGPT 頁面
3. 發送訊息：「你好」
4. **預期**：頭像保持當前狀態（不改變）

### 測試 3: 情緒持久化

1. 發送訊息觸發 HAPPY 狀態
2. 等待 5 秒
3. **預期**：頭像仍然是 HAPPY（不會自動回到 IDLE）

## 📊 Console 日誌變化

### 有情緒時

**之前**：
```
🎭 Avatar state change: {from: 'idle', to: 'speaking', emotion: 'default', ...}
🎭 Avatar state change: {from: 'speaking', to: 'happy', emotion: 'happy', ...}
```

**現在**：
```
🎭 Avatar state change: {from: 'idle', to: 'happy', ...}
```

### 無情緒時

**之前**：
```
💬 Using default SPEAKING state
🎭 Avatar state change: {from: 'sad', to: 'speaking', emotion: 'default', ...}
```

**現在**：
```
💬 No emotion detected, keeping current state
```

## ✅ 優點

1. **簡化狀態管理**：減少一個中間狀態
2. **更可預測**：狀態只在有明確情緒時才改變
3. **減少閃爍**：不會在 SPEAKING 和情緒狀態之間快速切換
4. **更直觀**：使用者更容易理解頭像的行為
5. **減少配置**：只需要 6 張圖片而不是 7 張

## 🔄 遷移指南

如果您已經上傳了 SPEAKING 狀態的自訂圖片：

1. 重新載入擴充功能
2. 開啟選項頁面
3. SPEAKING 狀態的卡片會自動消失
4. 之前上傳的 SPEAKING 圖片會被忽略（不會影響功能）

## 📝 版本資訊

- **版本**：v0.0.2
- **日期**：2025-12-10
- **變更類型**：Breaking Change（移除狀態）

---

**狀態管理現在更簡單了！** ✨

