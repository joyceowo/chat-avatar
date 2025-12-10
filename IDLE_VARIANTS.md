# Idle 狀態變體功能

## 🎯 功能說明

為了讓使用者更容易從畫面上看到頭像變化，新增了 **3 個 Idle 狀態變體**：
- `IDLE` (😊)
- `IDLE2` (🙂)
- `IDLE3` (😌)

每次設定為 Idle 狀態時，系統會**隨機選擇一個與上次不同的變體**。

---

## 🎨 視覺差異

| 狀態 | 表情符號 | 背景顏色 | 說明 |
|------|---------|---------|------|
| **IDLE** | 😊 | `#4CAF50` (綠色) | 原始 Idle 狀態 |
| **IDLE2** | 🙂 | `#66BB6A` (淺綠色) | Idle 變體 2 |
| **IDLE3** | 😌 | `#81C784` (更淺綠色) | Idle 變體 3 |

---

## 🔧 技術實作

### 1. 新增狀態到 Enum

**檔案**：`src/common/types.ts`

```typescript
export enum AvatarState {
  IDLE = 'idle',
  IDLE2 = 'idle2',      // ← 新增
  IDLE3 = 'idle3',      // ← 新增
  THINKING = 'thinking',
  HAPPY = 'happy',
  // ...
}
```

### 2. 新增圖片映射

**檔案**：`src/common/constants.ts`

```typescript
export const AVATAR_IMAGES: Record<AvatarState, string> = {
  [AvatarState.IDLE]: 'assets/avatar/idle.svg',
  [AvatarState.IDLE2]: 'assets/avatar/idle2.svg',   // ← 新增
  [AvatarState.IDLE3]: 'assets/avatar/idle3.svg',   // ← 新增
  // ...
};
```

### 3. 創建 SVG 檔案

**檔案**：
- `public/assets/avatar/idle.svg` (原有)
- `public/assets/avatar/idle2.svg` (新增)
- `public/assets/avatar/idle3.svg` (新增)

### 4. 實作隨機選擇邏輯

**檔案**：`src/avatar/AvatarController.ts`

```typescript
export class AvatarController implements IAvatarController {
  private lastIdleVariant: AvatarState = AvatarState.IDLE;

  /**
   * Get a random idle variant different from the last one
   */
  private getRandomIdleVariant(): AvatarState {
    const idleVariants = [AvatarState.IDLE, AvatarState.IDLE2, AvatarState.IDLE3];
    
    // Filter out the last used variant
    const availableVariants = idleVariants.filter(v => v !== this.lastIdleVariant);
    
    // Pick a random one from the available variants
    const randomVariant = availableVariants[Math.floor(Math.random() * availableVariants.length)];
    
    this.lastIdleVariant = randomVariant;
    return randomVariant;
  }

  public setState(state: AvatarState): void {
    // If setting to IDLE, randomly choose a variant
    let actualState = state;
    if (state === AvatarState.IDLE) {
      actualState = this.getRandomIdleVariant();
    }
    
    if (this.currentState === actualState) return;
    
    this.currentState = actualState;
    this.updateOverlayImage();
    this.notifyStateChange();
  }
}
```

---

## 📊 行為說明

### **隨機選擇邏輯**

1. **初始化時**：
   ```typescript
   constructor() {
     setTimeout(() => {
       this.setState(this.getRandomIdleVariant()); // 隨機選擇一個
     }, 100);
   }
   ```

2. **每次設定為 IDLE 時**：
   ```typescript
   setState(AvatarState.IDLE) 
   → getRandomIdleVariant()
   → 從 [IDLE, IDLE2, IDLE3] 中排除上次使用的
   → 隨機選擇一個
   → 更新 lastIdleVariant
   ```

3. **確保不重複**：
   ```typescript
   const availableVariants = idleVariants.filter(v => v !== this.lastIdleVariant);
   ```
   - 如果上次是 IDLE，這次只會從 [IDLE2, IDLE3] 中選擇
   - 如果上次是 IDLE2，這次只會從 [IDLE, IDLE3] 中選擇
   - 如果上次是 IDLE3，這次只會從 [IDLE, IDLE2] 中選擇

---

## 🎬 使用場景

### **場景 1: 頁面載入**

```
1. 擴充功能初始化
2. AvatarController 建構
3. 隨機選擇 IDLE 變體（例如 IDLE2）
4. 顯示 🙂
```

### **場景 2: 對話結束**

```
1. AI 回應完成
2. 情緒分析：無明確情緒
3. 設定為 IDLE
4. 隨機選擇變體（與上次不同）
5. 例如：上次 IDLE2 → 這次 IDLE 或 IDLE3
```

### **場景 3: 多次對話**

```
第一次對話：
- 回應完成 → IDLE → 隨機選擇 IDLE3 → 顯示 😌

第二次對話：
- 回應完成 → IDLE → 隨機選擇 IDLE (排除 IDLE3) → 顯示 😊

第三次對話：
- 回應完成 → IDLE → 隨機選擇 IDLE2 (排除 IDLE) → 顯示 🙂
```

---

## 🎨 選項頁面

選項頁面現在顯示 **13 個狀態卡片**（原本 10 個 + 3 個 Idle 變體）：

1. Idle (閒置)
2. **Idle 2 (閒置變體2)** ← 新增
3. **Idle 3 (閒置變體3)** ← 新增
4. Thinking (思考中)
5. Happy (開心)
6. Sad (難過)
7. Excited (興奮)
8. Confused (困惑)
9. Angry (生氣)
10. Surprised (驚訝)
11. Worried (擔心)
12. Neutral (中性)

使用者可以為每個變體上傳不同的自訂圖片。

---

## 🧪 測試步驟

### 1. 重新載入擴充功能

- 前往 `chrome://extensions/`
- 點擊重新整理圖示 🔄

### 2. 測試初始載入

1. 開啟 ChatGPT
2. 觀察初始頭像
3. 重新整理頁面多次
4. 確認每次顯示不同的 Idle 變體

### 3. 測試對話變化

1. 發送訊息：「你好」
2. 等待 AI 回應完成
3. 觀察頭像變化（應該是 Idle 變體之一）
4. 再次發送訊息：「謝謝」
5. 觀察頭像變化（應該是不同的 Idle 變體）

### 4. 檢查 Console

```
🎭 Avatar state change: {from: 'idle', to: 'idle2', ...}
🎭 Avatar state change: {from: 'idle2', to: 'idle3', ...}
🎭 Avatar state change: {from: 'idle3', to: 'idle', ...}
```

---

## 📝 相關檔案

### **新增檔案**
- `public/assets/avatar/idle2.svg` - Idle 變體 2 圖片
- `public/assets/avatar/idle3.svg` - Idle 變體 3 圖片

### **修改檔案**
- `src/common/types.ts` - 新增 IDLE2, IDLE3 到 enum 和介面
- `src/common/constants.ts` - 新增圖片映射
- `src/avatar/AvatarController.ts` - 實作隨機選擇邏輯
- `src/options/options.ts` - 新增狀態標籤

---

## 💡 設計考量

### **為什麼只有 Idle 有變體？**

1. **Idle 最常出現**：
   - 頁面載入時
   - 對話結束時
   - 無明確情緒時

2. **其他情緒已經有明確差異**：
   - Happy (😄) vs Sad (😢) 已經很明顯
   - 不需要額外變體

3. **避免複雜度**：
   - 如果每個情緒都有 3 個變體
   - 總共需要 10 × 3 = 30 個狀態
   - 過於複雜

### **為什麼確保不重複？**

1. **視覺回饋**：
   - 使用者可以明確看到「有變化」
   - 即使情緒相同，頭像也會改變

2. **避免單調**：
   - 如果連續 3 次都是同一個變體
   - 使用者可能以為系統卡住了

---

## 🎯 預期效果

### **之前**
```
對話 1 → IDLE → 😊
對話 2 → IDLE → 😊 (看起來沒變化)
對話 3 → IDLE → 😊 (看起來沒變化)
```

### **現在**
```
對話 1 → IDLE → 隨機選擇 → 😊
對話 2 → IDLE → 隨機選擇 (排除 😊) → 🙂
對話 3 → IDLE → 隨機選擇 (排除 🙂) → 😌
```

**結果**：使用者可以清楚看到每次對話後頭像都有變化！✨

---

**功能已完成！** 🎉

現在每次設定為 Idle 狀態時，頭像都會隨機變化，讓使用者更容易看到系統正在運作。

