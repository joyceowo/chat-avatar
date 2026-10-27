# AI Avatar Overlay

## 安裝與安妮雅表情包

預設角色維持原本圖像。《間諜家家酒》安妮雅是可自行匯入的表情包，包含 12 張透明 PNG：三種閒置、思考、開心、難過、興奮、困惑、生氣、驚訝、擔心與中性。圖片放在 `public/assets/avatar/anya/`，生成提示詞記錄在 [docs/anya-assets.md](docs/anya-assets.md)。這組圖片為靜態表情，會依狀態切換。

在專案目錄執行：

```powershell
npm ci
npm run build
```

開啟 Chrome 的 `chrome://extensions/`，啟用「開發人員模式」，選擇「載入未封裝項目」，載入專案的 **`dist` 資料夾**。接著重新整理 ChatGPT 或 Gemini 分頁。

預設使用本機情緒分析，不需要 API Key。刪除與匯出按鈕會常駐顯示，不需要點擊或雙擊角色。點 Chrome 工具列的擴充功能圖示，或拼圖選單中的「AI Avatar Overlay v2」，即可直接開啟表情包與角色設定。也可從擴充功能詳細資料開啟「擴充功能選項」。按「恢復原本角色」並儲存，可移除整組自訂表情。

更新程式或圖片後，重新執行 `npm run build`，在擴充功能管理頁按重新載入，再重新整理聊天頁面。

設定頁的「聊天頁面功能」可分別開關問題導覽、下載全部對話、下載單則回答、依日期刪除對話。預設全部開啟，與角色顯示開關分開管理。調整後按該區的「儲存並套用」，已開啟的聊天頁面會立即更新；重新整理或切換聊天也會保留選擇。問題導覽與日期刪除僅適用 ChatGPT；下載功能適用 ChatGPT 與 Gemini。

空白新對話不顯示問題導覽，也不定時重試尋找訊息或讀取提問。送出第一個問題或回答載入後，會由頁面變動自動開始辨識，不必重新整理。

首次開啟支援的聊天網站時，角色會用開心、思考、興奮、擔心等表情帶領簡短教學，介紹目前開啟的功能，並標出實際按鈕位置。可以隨時略過，完成或略過後不會在重新整理時再次自動出現；同時開多個聊天分頁也只會自動顯示一次。教學直接使用原本角色切換表情，旁邊顯示隨角色移動的對話泡泡，不另開教學視窗。雙擊角色即可重新觀看教學，鍵盤聚焦角色後也可按 Enter，或從設定頁的「使用教學」重看。角色旁不放置問號按鈕；拖曳與縮放不會觸發教學；結束時會恢復最新的回應表情。已匯入表情包時，教學會沿用目前表情；未啟用或網站不支援的功能會跳過。教學不會自動下載或刪除內容。

### 頁面操作（0.0.33）

| 操作 | 使用方式 |
| --- | --- |
| 常駐操作按鈕 | 頁面載入後即顯示刪除與匯出按鈕，切換聊天或重新整理後仍會自動掛載。角色的點擊與雙擊不再切換按鈕顯示。 |
| 固定角色位置 | 拖曳角色並放開滑鼠後自動儲存位置，重新整理或開啟同網站的其他聊天時會還原。ChatGPT 與 Gemini 各自記住位置；視窗變小時會限制在可見範圍。調整大小與匯入表情包不會清除位置；「重設設定」可回復預設位置。 |
| 調整角色大小 | 滑鼠移到角色上會出現淡灰色細框與灰色小圓點，拖曳四個角落可等比例縮放 64–320 px，放開後自動儲存。聚焦角落後可用方向鍵每次調整 8 px。設定頁仍可調整大小。 |
| 問題導覽 | 展開時僅清單內容接收滑鼠，空白區域不攔截操作；角色位於導覽上層，仍可拖曳與縮放。使用對話左側現有空白，採 Google 文件大綱風格的純文字清單，以文字色彩標示目前位置；空間不足時收合成浮動導覽，不改動原對話的位置、寬度或 padding。點選可跳到原文。頁面無法辨識提問時，會讀取目前聊天資料，透過訊息 ID 或提問開頭的文字定位；開頭重複時會延長比對，不要求完整文字或「顯示較多」按鈕。已讀到但尚未定位的提問仍會列出並暫停跳轉，背景自動更新位置，不顯示定位狀態提示。讀取失敗會顯示原因，可按「重新讀取提問」。 |
| 下載全部對話 | 右上角「分享」左邊有同高度、對齊的「下載」按鈕；點擊後才顯示 Markdown／HTML／PDF 選單。選擇後會自動讀取目前聊天完整分支，包含較早訊息，不必往上捲動。失敗時顯示原因，不下載局部內容。Gemini 維持輸入框旁下載目前已載入訊息。 |
| 下載單則回答 | 回答下方的原生操作列中，「分享」左側會加入純下載圖示，不顯示文字；滑鼠移上去可見下載提示。沒有分享按鈕時放在操作列最後方，沒有可見操作列時則放在回答內容外側下方，避免被內容裁切。點擊後選擇格式即下載該回答，包含該回答的多個段落；產生中的回答會等完成後才開放下載。支援缺少訊息角色標記的回答版型，切換聊天或網站重繪回答後會自動補回按鈕。 |
| 選擇下載格式 | 格式選單只在點擊下載時出現，記住上次選擇；可用 Esc 或點其他位置關閉。MD 與 HTML 直接下載；PDF 使用 Chrome 列印視窗。 |
| 依日期刪除對話 | 點「最近項目」文字旁的垃圾桶，自動載入清單。選日期 → 勾選對話 → 點「刪除 N 筆」並確認。無須查看帳號或先檢查刪除；目前聊天不可勾選，封存紀錄不列入。重開會沿用快取並更新最新一頁，可按「更新清單」手動更新；「更多選項」提供日期依據與「完整更新清單」。 |

0.0.8 擴充訊息角色辨識，支援不同層級標題、繁簡中文角色名稱、section 版型與多個回答區塊。ChatGPT 分享按鈕尚未載入時，匯出圖示會先出現在右上角，載入後移至分享左側。

本機模擬頁面操作預覽：[角色按鈕與縮放框](docs/avatar-tools-preview.png)、[無框線問題大綱與資料備援](docs/plain-outline-preview.png)、[簡化刪除介面](docs/simple-delete-preview.png)。

ChatGPT「下載全部對話」一律透過目前網站登入狀態，讀取這個已儲存聊天的完整目前分支，包含未在畫面載入的較早訊息；不需要手動捲動。下載內容保留目前分支的使用者提問與公開回答原文，排除其他回答分支、系統、工具訊息與非公開推理。檔案會標示「目前聊天完整分支」與訊息數量。單則回答仍直接擷取畫面中的指定回答；Gemini 的全部下載範圍仍是已載入內容。Markdown 保留原文格式；從網站讀取的 HTML／PDF 使用安全的基本文字、標題與程式碼排版。

完整讀取期間會持續顯示進度提示並暫停重複點擊，最長等候 60 秒。尚未儲存的聊天、仍在產生的回答、登入或連線失敗、分支缺漏等情況會顯示原因並停止，不會改下載局部訊息。可再按下載重試；讀取期間切換聊天會取消匯出。登入憑證不會儲存或匯出。附件與圖片以文字標示，不會下載附件本體。這不是帳號中所有對話的資料匯出。

Markdown 與 HTML 會直接下載檔案。HTML 可離線閱讀，不包含網頁腳本、事件處理器或遠端圖片。PDF 會另開僅含下載內容的列印視窗，請在 Chrome 將目的地選為「另存為 PDF」；可調整紙張與邊界後儲存。若彈出式視窗遭封鎖，允許後重試或改用 HTML。匯出使用點擊下載當時的訊息快照。

日期刪除僅支援登入後的 ChatGPT。首次開啟自動分頁載入完整清單，讀取中仍可調整日期。同一分頁內保留中繼資料快取，重開視窗時自動更新最近 100 筆；較早紀錄沿用快取，完整更新位於「更多選項」。介面不顯示帳號，也沒有查看或確認帳號的步驟。登入狀態變動時會在背景重建清單，重新整理頁面後需首次完整讀取。登入憑證在關閉視窗時清除，不隨快取保留。

起迄當日皆包含在內，使用瀏覽器本機時區。篩選依實際建立／更新時間，支援數值、數字字串與 ISO 日期；清單缺少日期的紀錄及封存紀錄排除。目前聊天會列出但禁止勾選，全選也不會選入。結束日期未自行修改時，重開會更新為今天。預設不勾選任何項目；勾選後直接跳出刪除確認，取消會保留勾選，不發出刪除請求。

刪除依確認時勾選的對話 ID 執行，不再因標題自動改名、日期精度或其他時間欄位不同而誤判。詳情有提供所選日期依據時，仍確認其位於範圍內；詳情省略日期時沿用已確認的清單日期。對話已移出日期範圍、封存、回傳 ID 不符、切換頁面或連線異常時，會說明原因並停止後續項目。可按「停止」或關閉視窗中止剩餘項目，目前已送出的操作會先完成。已刪除的紀錄無法復原，刪除前請匯出需要保留的內容。原生操作說明：[OpenAI 說明中心](https://help.openai.com/en/articles/8809935-deleting-and-archiving-chats-in-chatgpt)。

日期功能使用 ChatGPT 網站內部介面（session、conversations 與 conversation），依賴網站目前的登入與回應格式；並非 OpenAI 公開 API。介面不相容時會顯示錯誤並停止，不會根據側邊欄排序猜日期。登入憑證只保留在記憶體，不寫入擴充功能儲存空間或匯出檔案。單次最多完整讀取 100 個分頁，超過限制會停止，不提供不完整清單供刪除。

### 一次匯入表情包

1. 開啟設定頁，按「一次匯入檔案」，選擇整組圖片或單一 `.avatar-pack.json` 表情包。安妮雅圖片可從 `public/assets/avatar/anya/` 一次選取，也可選擇建置產生的 `dist/packs/anya.avatar-pack.json`。
2. 預覽確認後按「儲存設定」套用，已開啟的聊天頁面會同步更新。
3. 自訂角色可一次選取多張圖片，檔名需使用 `idle`、`idle2`、`idle3`、`thinking`、`happy`、`sad`、`excited`、`confused`、`angry`、`surprised`、`worried`、`neutral` 加副檔名。匯入會替換整組自訂表情，缺少的狀態使用原本角色。

每張圖片上限 1 MB，整包內嵌圖片資料上限 8 MB；僅接受內嵌圖片，不接受遠端網址。匯入錯誤會保留原本預覽。用「匯出目前表情包」下載 `avatar-images.zip`，內含目前預覽中的全部 12 張圖片，保留 PNG、JPG、GIF、WebP 或 SVG 原始格式與透明背景；未自訂的狀態會補上原本角色圖片，不包含 JSON。解壓後可一次選取圖片重新匯入。按「恢復原本角色」並儲存可回復預設。

A Chrome extension that displays an animated avatar overlay on AI chat websites (ChatGPT, Gemini). The avatar responds to AI interactions with different animations and optional emotion analysis.

## Features

- 🎭 **Animated Avatar Overlay**: Floating avatar with multiple states (idle, thinking, speaking, happy, sad, excited, confused)
- 🔄 **Automatic Response Detection**: Uses MutationObserver to detect new AI responses
- 🎨 **Multiple Site Support**: Works with ChatGPT and Gemini (extensible to other sites)
- 🧠 **Optional Emotion Analysis**: Integrate with Gemini or OpenAI APIs for advanced emotion detection
- 🎯 **Clean Architecture**: Built with SOLID principles and design patterns
- ✅ **Well-Tested**: Comprehensive unit tests with Vitest
- 🎨 **Draggable UI**: Repositionable avatar overlay

## Architecture

### Design Patterns

- **Factory Pattern**: `SiteAdapterFactory`, `LlmAdapterFactory` for creating site/LLM-specific adapters
- **Strategy Pattern**: `ISiteAdapter`, `ILlmAdapter` interfaces for swappable implementations
- **Observer Pattern**: State change callbacks and MutationObserver for DOM monitoring
- **Dependency Injection**: Constructor injection for better testability

### Module Structure

```
src/
├── common/           # Shared types, interfaces, constants
│   ├── types.ts      # Core domain types
│   ├── interfaces.ts # SOLID interfaces
│   ├── constants.ts  # Configuration constants
│   └── utils.ts      # Utility functions
├── avatar/           # Avatar UI and control
│   ├── AvatarOverlay.ts    # Visual overlay management
│   └── AvatarController.ts # State management
├── content/          # Content script layer
│   ├── contentScript.ts    # Main entry point
│   └── ResponseWatcher.ts  # DOM observation
├── background/       # Service worker layer
│   ├── background.ts       # Main service worker
│   └── ConfigService.ts    # Configuration management
├── adapters/         # Strategy implementations
│   ├── SiteAdapterFactory.ts # Site-specific DOM adapters
│   └── LlmAdapterFactory.ts  # LLM API adapters
└── options/          # Options page
    ├── options.html
    └── options.ts
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build extension
npm run build

# Development build with watch
npm run dev
```

### Building

```bash
npm run build
```

The extension will be built to the `dist/` directory.

### Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

## Testing

`npm test` 包含表情包驗證、整包匯入與儲存、常駐操作按鈕與拖曳縮放、頁面按鈕掛載、訊息複選、Markdown／HTML 匯出、PDF 列印呼叫、聊天切換與彈出視窗封鎖處理，以及日期區間、分頁讀取、刪除確認與中止的模擬測試。執行 `npm run build` 後，可再執行 `npm run verify:build`，確認實際建置檔、12 張表情包、跨頁設定套用、恢復原本角色、兩站匯出與日期預覽刪除流程。這些驗證不會連線或刪除真實 ChatGPT 帳號的資料。

The project uses Vitest for unit testing with comprehensive coverage:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

- `tests/unit/` - Unit tests for individual modules
- `tests/setup.ts` - Chrome API mocks for testing

## Configuration

Access the options page via the extension icon to configure:

- **Enable/Disable**: Toggle the avatar overlay
- **Avatar Style**: Choose between different avatar themes
- **LLM Provider**: Select emotion analysis provider (None, Gemini, OpenAI)
- **API Key**: Enter your LLM API key for emotion analysis

## Architecture Principles

### SOLID Principles

1. **Single Responsibility**: Each class has one clear purpose
   - `AvatarOverlay`: Only handles UI rendering
   - `AvatarController`: Only manages state
   - `ResponseWatcher`: Only observes DOM changes

2. **Open/Closed**: Extensible without modification
   - Add new sites via `ISiteAdapter`
   - Add new LLM providers via `ILlmAdapter`

3. **Liskov Substitution**: All adapters are interchangeable
   - Any `ISiteAdapter` works with `ResponseWatcher`
   - Any `ILlmAdapter` works with `BackgroundService`

4. **Interface Segregation**: Focused interfaces
   - Separate interfaces for overlay, controller, watcher, config

5. **Dependency Inversion**: Depend on abstractions
   - All modules depend on interfaces, not concrete classes

### Clean Code Practices

- **Type Safety**: Full TypeScript coverage
- **No Magic Numbers**: All constants defined in `constants.ts`
- **Error Handling**: Comprehensive error handling with fallbacks
- **Performance**: Throttled DOM observers, debounced callbacks
- **Testability**: Dependency injection, mocked Chrome APIs

## Extension Capabilities

### Supported Sites

- ChatGPT (chatgpt.com, chat.openai.com)
- Google Gemini (gemini.google.com)

### Avatar States

- **Idle**: Default resting state
- **Thinking**: When waiting for AI response
- **Speaking**: During AI response
- **Happy**: Positive emotion detected
- **Sad**: Negative emotion detected
- **Excited**: Enthusiastic response
- **Confused**: Uncertain or questioning response

## Future Enhancements

- [ ] More avatar themes and customization
- [ ] Support for additional AI chat sites
- [ ] Custom avatar upload
- [ ] Voice synthesis integration
- [ ] Advanced emotion detection algorithms
- [ ] Analytics and usage tracking

## Disclaimer / 免責聲明

This extension is an **unofficial**, independently developed project and is **not affiliated with, endorsed by, or associated with** OpenAI (ChatGPT), Google (Gemini), or any other AI service provider.

- The extension interacts with third-party websites by observing DOM changes. These websites may update their structure at any time, which could cause the extension to stop working without notice.
- Use of LLM API features (Gemini, OpenAI) requires your own API key and is subject to the respective provider's terms of service and pricing.
- The extension does **not** collect, transmit, or store any personal data. All settings are stored locally via Chrome Storage.
- The authors are **not responsible** for any issues arising from the use of this extension, including but not limited to account restrictions, data loss, or unexpected behavior.

**Use at your own risk.**

---

本擴充功能為**非官方**的獨立開發專案，與 OpenAI（ChatGPT）、Google（Gemini）或任何其他 AI 服務提供商**無任何關聯、背書或合作關係**。

- 本擴充功能透過觀察 DOM 變化與第三方網站互動。這些網站可能隨時更新其結構，導致擴充功能在無預警的情況下停止運作。
- 使用 LLM API 功能（Gemini、OpenAI）需要您自行提供 API 金鑰，並受相關服務提供商的使用條款與定價約束。
- 本擴充功能**不會**蒐集、傳輸或儲存任何個人資料。所有設定皆透過 Chrome Storage 儲存於本機。
- 作者**不對**因使用本擴充功能所產生的任何問題負責，包括但不限於帳號限制、資料遺失或非預期行為。

**使用風險自負。**

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Pull requests are welcome! Please ensure:

1. All tests pass: `npm test`
2. Type checking passes: `npm run type-check`
3. Linting passes: `npm run lint`
4. Code follows existing architecture patterns
