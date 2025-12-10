# 自動重置機制

## 🎯 功能說明

為了避免頭像卡在某個狀態，新增了 **3 分鐘自動重置機制**：

- **3 分鐘無活動**後，自動回到 Idle 狀態
- **清除所有計時器**，重置內部狀態
- **每次有新回應**時，重置計時器（重新計算 3 分鐘）

---

## 🐛 問題

使用者反饋：**「現在還是會卡住」**

可能的原因：
1. ResponseWatcher 的某些邊緣情況沒有處理好
2. 計時器沒有正確清除
3. 狀態機進入了死鎖狀態

**解決方案**：新增一個安全機制，確保無論發生什麼情況，3 分鐘後都會自動重置。

---

## ✅ 實作細節

### 1. **新增計時器屬性**

**檔案**：`src/avatar/AvatarController.ts`

```typescript
export class AvatarController implements IAvatarController {
  private autoResetTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly AUTO_RESET_DELAY = 3 * 60 * 1000; // 3 minutes in milliseconds
  
  // ...
}
```

---

### 2. **啟動自動重置計時器**

每次狀態改變時，啟動計時器：

```typescript
public setState(state: AvatarState): void {
  // ... existing code ...
  
  // Start auto-reset timer (3 minutes)
  this.startAutoResetTimer();
}
```

每次收到新回應時，重置計時器：

```typescript
public onNewResponse(text: string, emotion?: AvatarState): void {
  // Reset the auto-reset timer on new response
  this.startAutoResetTimer();
  
  // ... existing code ...
}
```

---

### 3. **計時器實作**

```typescript
/**
 * Start auto-reset timer (3 minutes)
 * Automatically returns to idle state after 3 minutes of inactivity
 */
private startAutoResetTimer(): void {
  // Clear existing timer
  if (this.autoResetTimeout) {
    clearTimeout(this.autoResetTimeout);
    this.autoResetTimeout = null;
  }

  // Set new timer
  this.autoResetTimeout = setTimeout(() => {
    console.log('⏰ Auto-reset: 3 minutes of inactivity, returning to idle state');
    this.resetToIdle();
  }, this.AUTO_RESET_DELAY);
}
```

---

### 4. **重置到 Idle**

```typescript
/**
 * Reset to idle state and clear all timers
 */
private resetToIdle(): void {
  // Clear all timers
  if (this.stateTimeout) {
    clearTimeout(this.stateTimeout);
    this.stateTimeout = null;
  }
  if (this.autoResetTimeout) {
    clearTimeout(this.autoResetTimeout);
    this.autoResetTimeout = null;
  }

  // Return to idle
  this.setState(AvatarState.IDLE);
  console.log('🔄 State reset to idle');
}
```

---

### 5. **清理資源**

```typescript
public destroy(): void {
  if (this.stateTimeout) {
    clearTimeout(this.stateTimeout);
  }
  if (this.autoResetTimeout) {
    clearTimeout(this.autoResetTimeout);
  }
  this.stateChangeCallbacks = [];
}
```

---

## 📊 行為說明

### **場景 1: 正常對話**

```
時間 0:00 - 使用者發送訊息
時間 0:05 - AI 回應完成 → 設定為 HAPPY → 啟動 3 分鐘計時器
時間 1:00 - 使用者發送訊息 → 重置計時器
時間 1:10 - AI 回應完成 → 設定為 NEUTRAL → 重置計時器
時間 2:00 - 使用者發送訊息 → 重置計時器
時間 2:15 - AI 回應完成 → 設定為 EXCITED → 重置計時器
...
```

**結果**：只要有活動，計時器就會不斷重置，不會觸發自動重置。

---

### **場景 2: 長時間無活動**

```
時間 0:00 - AI 回應完成 → 設定為 HAPPY → 啟動 3 分鐘計時器
時間 3:00 - 計時器觸發 → 自動重置到 IDLE
```

**結果**：3 分鐘後自動回到 Idle 狀態。

---

### **場景 3: 卡住的情況**

```
時間 0:00 - AI 開始回應
時間 0:10 - ResponseWatcher 卡住，沒有觸發 finalizeResponse
時間 3:00 - 計時器觸發 → 自動重置到 IDLE
```

**結果**：即使 ResponseWatcher 卡住，3 分鐘後也會自動恢復。

---

## 🔄 計時器重置觸發點

計時器會在以下情況重置（重新計算 3 分鐘）：

1. **`setState()` 被調用**
   - 任何狀態改變都會重置計時器

2. **`onNewResponse()` 被調用**
   - 收到新的 AI 回應時重置計時器

3. **`setThinking()` 被調用**
   - 使用者發送訊息時（如果有實作）

4. **`setIdle()` 被調用**
   - 手動設定為 Idle 時

---

## 🧪 測試步驟

### **測試 1: 正常對話（不應觸發自動重置）**

1. 開啟 ChatGPT
2. 發送訊息：「你好」
3. 等待 AI 回應完成
4. 觀察頭像狀態（例如 NEUTRAL）
5. 在 3 分鐘內再次發送訊息
6. 確認頭像正常變化，**不會**自動回到 Idle

**預期**：只要有活動，就不會觸發自動重置。

---

### **測試 2: 長時間無活動（應觸發自動重置）**

1. 開啟 ChatGPT
2. 發送訊息：「你好」
3. 等待 AI 回應完成
4. 觀察頭像狀態（例如 NEUTRAL）
5. **不要做任何操作，等待 3 分鐘**
6. 觀察 Console

**預期輸出**：
```
⏰ Auto-reset: 3 minutes of inactivity, returning to idle state
🔄 State reset to idle
🎭 Avatar state change: {from: 'neutral', to: 'idle2', ...}
```

**預期結果**：頭像自動回到 Idle 狀態（IDLE, IDLE2, 或 IDLE3）。

---

### **測試 3: 卡住的情況（應觸發自動重置）**

1. 開啟 ChatGPT
2. 發送一個會導致長回應的訊息
3. 如果系統卡住（Console 顯示 `⏳ AI is typing, waiting for completion...` 但沒有後續）
4. 等待 3 分鐘
5. 觀察 Console

**預期輸出**：
```
⏰ Auto-reset: 3 minutes of inactivity, returning to idle state
🔄 State reset to idle
🎭 Avatar state change: {from: 'thinking', to: 'idle3', ...}
```

**預期結果**：即使卡住，3 分鐘後也會自動恢復到 Idle 狀態。

---

## 📝 Console 日誌

### **正常情況**

```
🎭 Avatar state change: {from: 'idle', to: 'neutral', textLength: 500}
✨ Avatar will stay in this state until next response or page change
(3 分鐘內有新活動，計時器重置)
```

### **自動重置觸發**

```
⏰ Auto-reset: 3 minutes of inactivity, returning to idle state
🔄 State reset to idle
🎭 Avatar state change: {from: 'neutral', to: 'idle2', textLength: 0}
```

---

## 🎯 優點

### 1. **防止卡住**
- 無論發生什麼錯誤，3 分鐘後都會自動恢復
- 不需要使用者手動重新整理頁面

### 2. **自動清理**
- 清除所有計時器
- 重置內部狀態
- 避免記憶體洩漏

### 3. **使用者友善**
- 長時間無活動後，頭像回到 Idle 狀態
- 符合使用者預期

### 4. **除錯友善**
- Console 會顯示自動重置訊息
- 容易追蹤問題

---

## 📦 修改的檔案

- **`src/avatar/AvatarController.ts`**
  - 新增 `autoResetTimeout` 屬性
  - 新增 `AUTO_RESET_DELAY` 常數（3 分鐘）
  - 新增 `startAutoResetTimer()` 方法
  - 新增 `resetToIdle()` 方法
  - 修改 `setState()` - 啟動計時器
  - 修改 `onNewResponse()` - 重置計時器
  - 修改 `destroy()` - 清理計時器

---

## 🔧 調整計時器時間

如果需要調整自動重置時間，修改 `AUTO_RESET_DELAY` 常數：

```typescript
// 1 分鐘
private readonly AUTO_RESET_DELAY = 1 * 60 * 1000;

// 5 分鐘
private readonly AUTO_RESET_DELAY = 5 * 60 * 1000;

// 10 分鐘
private readonly AUTO_RESET_DELAY = 10 * 60 * 1000;
```

---

**功能已完成！** ✅

現在即使系統卡住，3 分鐘後也會自動恢復到 Idle 狀態，確保使用者體驗不受影響。

