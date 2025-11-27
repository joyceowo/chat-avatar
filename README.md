# AI Avatar Overlay

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

## License

MIT

## Contributing

Pull requests welcome! Please ensure:

1. All tests pass: `npm test`
2. Type checking passes: `npm run type-check`
3. Linting passes: `npm run lint`
4. Code follows existing architecture patterns
