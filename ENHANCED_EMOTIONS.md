# 增強情緒系統 - 更新說明

## 🎯 更新概述

本次更新大幅增強了情緒分析系統，從原本的 6 種情緒擴展到 **10 種情緒**，並深化了情緒判斷邏輯。

---

## ✨ 主要變更

### 1. 新增 4 種情緒狀態

| 情緒 | 圖示 | 說明 | 顏色 |
|------|------|------|------|
| **ANGRY** (生氣) | 😠 | 偵測到憤怒、挫折的情緒 | 紅色 (#F44336) |
| **SURPRISED** (驚訝) | 😲 | 偵測到意外、震驚的情緒 | 橙色 (#FF9800) |
| **WORRIED** (擔心) | 😟 | 偵測到擔憂、焦慮的情緒 | 棕色 (#795548) |
| **NEUTRAL** (中性) | 😐 | 偵測到平靜、中性的回應 | 灰色 (#9E9E9E) |

### 2. 深化情緒判斷邏輯

#### **之前**（簡單關鍵字匹配）
```typescript
if (text.includes('happy')) return HAPPY;
if (text.includes('sad')) return SAD;
// ...
```

**問題**：
- 只有簡單的關鍵字匹配
- 無法區分情緒強度
- 中英文支援不完整
- 無法處理混合情緒

#### **現在**（加權評分系統）
```typescript
// 關鍵字分為三個等級，每個等級有不同權重
strong: 權重 3 (如：太好了、非常開心、excellent)
medium: 權重 2 (如：很棒、恭喜、great)
weak: 權重 1 (如：開心、高興、good)

// 特殊模式偵測
多個驚嘆號 (!!) → 興奮 +2, 驚訝 +1
多個問號 (??) → 困惑 +2
多個句號 (...) → 難過 +1, 擔心 +1
```

**優點**：
- ✅ 更準確的情緒偵測
- ✅ 支援情緒強度分析
- ✅ 完整的中英文支援
- ✅ 處理混合情緒（選擇分數最高的）
- ✅ 支援表情符號偵測

---

## 📦 修改的檔案

### 核心檔案

1. **`src/common/types.ts`**
   - 新增 4 種情緒到 `AvatarState` enum
   - 更新 `CustomAvatarImages` 介面

2. **`src/common/constants.ts`**
   - 新增 4 種情緒的圖片映射

3. **`src/adapters/LlmAdapterFactory.ts`**
   - 完全重寫 `analyzeEmotionLocally()` 方法
   - 實作加權評分系統
   - 新增特殊模式偵測
   - 更新 `parseEmotionFromText()` 支援新情緒

4. **`src/options/options.ts`**
   - 更新 `stateLabels` 包含 10 種情緒

### 資源檔案

5. **`public/assets/avatar/angry.svg`** (新增)
6. **`public/assets/avatar/surprised.svg`** (新增)
7. **`public/assets/avatar/worried.svg`** (新增)
8. **`public/assets/avatar/neutral.svg`** (新增)

### 文件

9. **`CUSTOM_AVATARS_GUIDE.md`** - 更新為 10 種情緒
10. **`REMOVE_SPEAKING_STATE.md`** - 更新狀態列表
11. **`EMOTION_ANALYSIS.md`** (新增) - 詳細的情緒分析說明
12. **`EMOTION_TESTING_GUIDE.md`** (新增) - 完整的測試指南

---

## 🧠 情緒分析範例

### 範例 1: 開心 vs 興奮

**輸入 1**：「很棒！」
```
分析：
- "很棒" (中等) = 2 分 (HAPPY)
- "！" (驚嘆號) = 2 分 (EXCITED)
結果：HAPPY (2) vs EXCITED (2) → HAPPY (優先級較高)
```

**輸入 2**：「太棒了！！！」
```
分析：
- "太棒了" (中等) = 2 分 (HAPPY)
- "！！！" (多個驚嘆號) = 2 分 (EXCITED)
結果：HAPPY (2) vs EXCITED (4) → EXCITED
```

### 範例 2: 難過 vs 擔心

**輸入 1**：「我失敗了...」
```
分析：
- "失敗" (微弱) = 1 分 (SAD)
- "..." (多個句號) = 1 分 (SAD) + 1 分 (WORRIED)
結果：SAD (2) vs WORRIED (1) → SAD
```

**輸入 2**：「我很擔心這個問題...」
```
分析：
- "擔心" (中等) = 2 分 (WORRIED)
- "..." (多個句號) = 1 分 (SAD) + 1 分 (WORRIED)
結果：WORRIED (3) vs SAD (1) → WORRIED
```

### 範例 3: 生氣 vs 難過

**輸入 1**：「這太過分了！」
```
分析：
- "太過分了" (強烈) = 3 分 (ANGRY)
- "！" (驚嘆號) = 2 分 (EXCITED)
結果：ANGRY (3) vs EXCITED (2) → ANGRY
```

---

## 🎨 情緒關鍵字總覽

### HAPPY (開心) 😄
- **強烈**：太好了、非常開心、超級開心、真是太棒了、excellent、wonderful、fantastic
- **中等**：很棒、恭喜、成功、完美、優秀、讚、厲害、great、awesome、perfect、amazing
- **微弱**：開心、高興、快樂、喜歡、感謝、謝謝、good、nice、happy、glad、thank

### SAD (難過) 😢
- **強烈**：非常遺憾、太糟糕了、真是失望、徹底失敗、terrible、horrible、devastating
- **中等**：抱歉、遺憾、可惜、失望、難過、傷心、不幸、sorry、unfortunately、sad、disappointed
- **微弱**：失敗、錯誤、問題、壞、差、fail、error、problem、issue、bad、wrong

### EXCITED (興奮) 🎉
- **強烈**：太棒了！、不可思議！、哇！、驚人！、wow!、incredible!、amazing!
- **中等**：太棒了、驚人、不可思議、哇、酷、超級、極了、wow、incredible、fantastic、brilliant
- **微弱**：令人興奮、精彩、絕佳、有趣、exciting、interesting、cool、awesome

### CONFUSED (困惑) 😕
- **強烈**：完全不懂、太複雜了、搞不清楚、totally confused、no idea、completely lost
- **中等**：不確定、困惑、疑問、不太明白、難以理解、uncertain、confused、unclear、not sure
- **微弱**：可能、也許、或許、不清楚、複雜、maybe、perhaps、possibly、difficult、complex

### ANGRY (生氣) 😠
- **強烈**：太過分了、氣死了、受夠了、什麼鬼、outrageous、furious、pissed off
- **中等**：生氣、憤怒、煩、討厭、受不了、太誇張、angry、frustrated、annoyed、ridiculous
- **微弱**：不滿、煩躁、不爽、到底、irritated、upset、bothered

### SURPRISED (驚訝) 😲
- **強烈**：天啊！、不會吧！、真的假的！、震驚！、oh my god!、no way!、shocking!
- **中等**：驚訝、意外、沒想到、竟然、居然、surprised、unexpected、astonishing、shocking
- **微弱**：哦、喔、原來、這樣啊、oh、really、interesting

### WORRIED (擔心) 😟
- **強烈**：非常擔心、很害怕、恐懼、焦慮不安、very worried、terrified、anxious
- **中等**：擔心、害怕、緊張、不安、憂慮、worried、concerned、nervous、afraid
- **微弱**：小心、注意、謹慎、留意、careful、cautious、watch out

### NEUTRAL (中性) 😐
- **強烈**：了解、明白了、知道了、好的、understood、got it、okay、alright
- **中等**：是的、對、沒錯、確實、yes、correct、right、indeed
- **微弱**：嗯、喔、哦、ok、sure、fine

---

## 🧪 測試建議

### 快速測試

1. **開心**：「太好了！這真是太棒了！」
2. **難過**：「真是太遺憾了，我失敗了。」
3. **興奮**：「哇！這太不可思議了！！！」
4. **困惑**：「我不太確定這是什麼意思？？」
5. **生氣**：「這太過分了！我受不了了！」
6. **驚訝**：「天啊！不會吧！真的假的！」
7. **擔心**：「我非常擔心這個問題。」
8. **中性**：「了解，我明白了。」

### 詳細測試

請參考 `EMOTION_TESTING_GUIDE.md` 獲取完整的測試指南。

---

## 📊 統計資訊

- **情緒數量**：6 → 10 (+4)
- **關鍵字總數**：~50 → ~200+ (+300%)
- **支援語言**：中文、英文、表情符號
- **權重等級**：3 級 (強烈、中等、微弱)
- **特殊模式**：3 種 (驚嘆號、問號、句號)

---

## 🚀 下一步

1. **重新載入擴充功能**
2. **測試新的情緒狀態**
3. **上傳自訂頭像** (可選)
4. **調整 LLM 提供者** (可選)

---

**享受更豐富、更準確的情緒表達！** ✨

