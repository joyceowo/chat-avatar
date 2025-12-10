# 情緒關鍵字調整

## 🎯 問題

使用者反饋：**「蠻常映射到驚訝的」**

經過分析，發現「驚訝」情緒的關鍵字設定過於寬鬆，導致一般對話中的常見詞彙被誤判為驚訝。

---

## 🔍 問題分析

### **之前的 Surprised 關鍵字**

```typescript
surprised: {
  strong: ['天啊！', '不會吧！', '真的假的！', '震驚！', 'oh my god!', 'no way!', 'shocking!', '😱', '🤯'],
  medium: ['驚訝', '意外', '沒想到', '竟然', '居然', 'surprised', 'unexpected', 'astonishing', 'shocking', '😲'],
  weak: ['哦', '喔', '原來', '這樣啊', 'oh', 'really', 'interesting'], // ❌ 問題在這裡！
}
```

**問題**：
- `'哦', '喔', '原來', '這樣啊', 'oh', 'really', 'interesting'` 是**非常常見的詞彙**
- 在一般對話中頻繁出現
- 導致大量誤判

**範例**：
```
AI: "Docker 是一個容器化平台，可以..."
使用者: "哦，原來是這樣啊" 
→ 偵測到 "哦", "原來", "這樣啊" → 😲 SURPRISED (誤判！)

正確應該是：😐 NEUTRAL
```

---

## ✅ 解決方案

### 1. **移除 Surprised 的常見詞彙**

**之前**：
```typescript
weak: ['哦', '喔', '原來', '這樣啊', 'oh', 'really', 'interesting']
```

**現在**：
```typescript
weak: ['咦', '欸', 'whoa', 'huh']
```

**改進**：
- 移除 `'哦', '喔', '原來', '這樣啊', 'oh', 'really', 'interesting'`
- 只保留真正表示驚訝的詞彙：`'咦', '欸', 'whoa', 'huh'`

---

### 2. **將常見詞彙移到 Neutral**

**之前**：
```typescript
neutral: {
  strong: ['了解', '明白了', '知道了', '好的', 'understood', 'got it', 'okay', 'alright'],
  medium: ['是的', '對', '沒錯', '確實', 'yes', 'correct', 'right', 'indeed'],
  weak: ['嗯', '喔', '哦', 'ok', 'sure', 'fine'],
}
```

**現在**：
```typescript
neutral: {
  strong: ['了解', '明白了', '知道了', '好的', '收到', 'understood', 'got it', 'okay', 'alright'],
  medium: ['是的', '對', '沒錯', '確實', '原來', '這樣啊', 'yes', 'correct', 'right', 'indeed', 'i see'],
  weak: ['嗯', '喔', '哦', '嗯嗯', 'ok', 'sure', 'fine', 'oh', 'really', 'interesting'],
}
```

**改進**：
- 新增 `'原來', '這樣啊'` 到 medium
- 新增 `'oh', 'really', 'interesting'` 到 weak
- 這些詞彙更符合「中性」情緒

---

### 3. **強化 Surprised 的明確性**

**之前**：
```typescript
strong: ['天啊！', '不會吧！', '真的假的！', '震驚！', 'oh my god!', 'no way!', 'shocking!', '😱', '🤯'],
medium: ['驚訝', '意外', '沒想到', '竟然', '居然', 'surprised', 'unexpected', 'astonishing', 'shocking', '😲'],
```

**現在**：
```typescript
strong: ['天啊！', '不會吧！', '真的假的！', '震驚！', '嚇到了！', '嚇一跳', 'oh my god!', 'omg!', 'no way!', 'what!', 'shocking!', '😱', '🤯'],
medium: ['驚訝', '意外', '沒想到', '竟然', '居然', '想不到', '出乎意料', 'surprised', 'unexpected', 'astonishing', '😲'],
```

**改進**：
- 新增更明確的驚訝詞彙：`'嚇到了！', '嚇一跳', 'omg!', 'what!'`
- 新增 `'想不到', '出乎意料'` 到 medium
- 確保只有真正驚訝的情況才會觸發

---

### 4. **優化 Excited 關鍵字**

**之前**：
```typescript
excited: {
  strong: ['太棒了！', '不可思議！', '哇！', '驚人！', 'wow!', 'incredible!', 'amazing!', '🎉', '🚀', '🔥'],
  medium: ['太棒了', '驚人', '不可思議', '哇', '酷', '超級', '極了', 'wow', 'incredible', 'fantastic', 'brilliant', '✨'],
  weak: ['令人興奮', '精彩', '絕佳', '有趣', 'exciting', 'interesting', 'cool', 'awesome'],
}
```

**現在**：
```typescript
excited: {
  strong: ['太棒了！', '不可思議！', '哇！', '驚人！', '超讚！', 'wow!', 'incredible!', 'amazing!', '🎉', '🚀', '🔥'],
  medium: ['太棒了', '驚人', '不可思議', '哇', '酷', '超級', '極了', '讚爆', 'wow', 'incredible', 'fantastic', 'brilliant', '✨'],
  weak: ['令人興奮', '精彩', '絕佳', '有趣', '不錯', 'exciting', 'cool', 'awesome', 'great'],
}
```

**改進**：
- 新增 `'超讚！', '讚爆'` 等更明確的興奮詞彙
- 移除 `'interesting'`（移到 neutral）
- 新增 `'不錯', 'great'` 到 weak

---

## 📊 調整對比

### **Surprised (驚訝)**

| 等級 | 之前 | 現在 | 變化 |
|------|------|------|------|
| **Strong** | 9 個關鍵字 | 13 個關鍵字 | +4 (更明確) |
| **Medium** | 10 個關鍵字 | 12 個關鍵字 | +2 (更明確) |
| **Weak** | 7 個關鍵字 | 4 個關鍵字 | -3 (移除常見詞) |

**總結**：移除常見詞彙，新增明確的驚訝詞彙

---

### **Neutral (中性)**

| 等級 | 之前 | 現在 | 變化 |
|------|------|------|------|
| **Strong** | 8 個關鍵字 | 9 個關鍵字 | +1 |
| **Medium** | 8 個關鍵字 | 12 個關鍵字 | +4 (接收常見詞) |
| **Weak** | 6 個關鍵字 | 11 個關鍵字 | +5 (接收常見詞) |

**總結**：接收從 surprised 移過來的常見詞彙

---

### **Excited (興奮)**

| 等級 | 之前 | 現在 | 變化 |
|------|------|------|------|
| **Strong** | 9 個關鍵字 | 10 個關鍵字 | +1 |
| **Medium** | 11 個關鍵字 | 12 個關鍵字 | +1 |
| **Weak** | 8 個關鍵字 | 9 個關鍵字 | +1 |

**總結**：新增更多興奮詞彙，移除 'interesting'

---

## 🧪 測試案例

### **測試 1: 一般對話（應該是 Neutral）**

**輸入**：
```
「哦，原來是這樣啊，我明白了」
```

**之前**：
- 偵測到 "哦", "原來", "這樣啊" → 😲 SURPRISED (誤判)

**現在**：
- 偵測到 "哦", "原來", "這樣啊", "明白了" → 😐 NEUTRAL ✅

---

### **測試 2: 真正的驚訝（應該是 Surprised）**

**輸入**：
```
「天啊！不會吧！真的假的！」
```

**之前**：
- 偵測到 "天啊！", "不會吧！", "真的假的！" → 😲 SURPRISED ✅

**現在**：
- 偵測到 "天啊！", "不會吧！", "真的假的！" → 😲 SURPRISED ✅

---

### **測試 3: 興奮（應該是 Excited）**

**輸入**：
```
「哇！太棒了！這真是太酷了！」
```

**之前**：
- 偵測到 "哇", "太棒了" → 可能是 😲 SURPRISED 或 🎉 EXCITED

**現在**：
- 偵測到 "哇！", "太棒了！", "酷" → 🎉 EXCITED ✅

---

### **測試 4: 輕微驚訝（應該是 Surprised）**

**輸入**：
```
「咦？欸，這個我沒想到」
```

**之前**：
- 偵測到 "沒想到" → 😲 SURPRISED ✅

**現在**：
- 偵測到 "咦", "欸", "沒想到" → 😲 SURPRISED ✅

---

## 📝 完整關鍵字列表

### **Surprised (驚訝)**

```typescript
strong: [
  '天啊！', '不會吧！', '真的假的！', '震驚！', '嚇到了！', '嚇一跳',
  'oh my god!', 'omg!', 'no way!', 'what!', 'shocking!',
  '😱', '🤯'
]

medium: [
  '驚訝', '意外', '沒想到', '竟然', '居然', '想不到', '出乎意料',
  'surprised', 'unexpected', 'astonishing',
  '😲'
]

weak: [
  '咦', '欸', 'whoa', 'huh'
]
```

### **Neutral (中性)**

```typescript
strong: [
  '了解', '明白了', '知道了', '好的', '收到',
  'understood', 'got it', 'okay', 'alright'
]

medium: [
  '是的', '對', '沒錯', '確實', '原來', '這樣啊',
  'yes', 'correct', 'right', 'indeed', 'i see'
]

weak: [
  '嗯', '喔', '哦', '嗯嗯',
  'ok', 'sure', 'fine', 'oh', 'really', 'interesting'
]
```

---

## 🎯 預期效果

### **之前**
```
一般對話：「哦，原來是這樣」
→ 😲 SURPRISED (誤判率高)

真正驚訝：「天啊！不會吧！」
→ 😲 SURPRISED ✅
```

### **現在**
```
一般對話：「哦，原來是這樣」
→ 😐 NEUTRAL ✅ (準確率提升)

真正驚訝：「天啊！不會吧！」
→ 😲 SURPRISED ✅

輕微驚訝：「咦？欸，沒想到」
→ 😲 SURPRISED ✅
```

---

## 📦 修改的檔案

- **`src/adapters/LlmAdapterFactory.ts`** - 調整情緒關鍵字
  - 修改 `surprised` 關鍵字（移除常見詞，新增明確詞）
  - 修改 `neutral` 關鍵字（接收常見詞）
  - 修改 `excited` 關鍵字（優化興奮詞彙）

---

**調整完成！** ✅

現在「驚訝」情緒的誤判率應該會大幅降低，一般對話會更準確地映射到「中性」情緒。

