# Design Document

## Overview

The Webpage Typing Practice extension is a browser extension that transforms selected webpage content into interactive typing practice sessions. The extension uses a content script architecture to inject typing functionality directly into webpages while preserving original formatting and layout.

## Architecture

### Extension Structure
- **Manifest V3 Browser Extension**: Modern extension architecture with proper permissions
- **Content Script**: Injected into all webpages to handle text selection and typing interface
- **Background Script**: Manages extension lifecycle and cross-tab communication
- **Popup Interface**: Extension button interface with start/stop controls and settings
- **Context Menu Integration**: Right-click menu options for hint management

### Core Components
1. **Text Selection Handler**: Captures user text selection and prepares it for typing practice
2. **Typing Interface Engine**: Renders the interactive typing overlay with preserved formatting
3. **Input Processing System**: Handles keyboard input, validation, and cursor management
4. **Metrics Calculator**: Tracks typing speed, accuracy, and session statistics
5. **Shortcut Manager**: Processes keyboard shortcuts for navigation and control
6. **UI State Manager**: Manages hint visibility and extension state

## Components and Interfaces

### TextSelectionHandler
```typescript
interface TextSelectionHandler {
  captureSelection(): SelectedText
  validateSelection(selection: Selection): boolean
  extractFormattedContent(selection: Selection): FormattedContent
}

interface SelectedText {
  content: string
  htmlContent: string
  boundingRect: DOMRect
  parentElement: HTMLElement
}
```

### TypingInterface
```typescript
interface TypingInterface {
  initialize(content: FormattedContent, container: HTMLElement): void
  renderTypingOverlay(): HTMLElement
  updateCursor(position: number): void
  highlightProgress(completedChars: number): void
  showError(position: number): void
  cleanup(): void
}

interface FormattedContent {
  text: string
  formatting: FormatNode[]
  skipPositions: number[]
}
```

### InputProcessor
```typescript
interface InputProcessor {
  processKeyInput(event: KeyboardEvent): InputResult
  validateCharacter(input: string, expected: string): boolean
  handleShortcut(shortcut: ShortcutType): void
  getCurrentPosition(): number
}

enum ShortcutType {
  SKIP_CHAR = 'Tab',
  SKIP_PARAGRAPH = 'Shift+Tab',
  EXIT_SESSION = 'Escape'
}
```

### MetricsCalculator
```typescript
interface MetricsCalculator {
  startSession(): void
  recordKeystroke(correct: boolean): void
  recordSkip(reason: SkipReason): void
  calculateWPM(): number
  calculateAccuracy(): number
  getSessionSummary(): SessionMetrics
}

interface SessionMetrics {
  wpm: number
  accuracy: number
  totalCharacters: number
  correctCharacters: number
  timeElapsed: number
  skippedCharacters: number
}
```

## Data Models

### Session State
```typescript
interface TypingSession {
  id: string
  content: FormattedContent
  currentPosition: number
  startTime: Date
  isActive: boolean
  metrics: SessionMetrics
  originalElement: HTMLElement
  overlayElement: HTMLElement
}
```

### Extension Settings
```typescript
interface ExtensionSettings {
  hintsVisible: boolean
  skipDifficultChars: boolean
  highlightColor: string
  errorColor: string
  completedColor: string
}
```

### Popup Interface
```typescript
interface PopupInterface {
  startTypingMode(): void
  stopTypingMode(): void
  getSessionStatus(): SessionStatus
  showSettings(): void
  toggleHints(): void
}

interface SessionStatus {
  isActive: boolean
  isSelectionMode: boolean
  hasActiveSession: boolean
  currentWPM?: number
  currentAccuracy?: number
}
```

### Format Preservation
```typescript
interface FormatNode {
  type: 'text' | 'element'
  content: string
  tagName?: string
  attributes?: Record<string, string>
  styles?: CSSStyleDeclaration
  startIndex: number
  endIndex: number
}
```

## Error Handling

### Input Validation
- Validate text selection before creating typing session
- Handle empty or invalid selections gracefully
- Prevent multiple simultaneous sessions on same page

### DOM Manipulation Safety
- Check for element existence before manipulation
- Handle dynamic content changes during typing sessions
- Restore original state on unexpected errors

### Cross-Browser Compatibility
- Feature detection for browser-specific APIs
- Fallback mechanisms for unsupported features
- Graceful degradation for older browsers

### Error Recovery
```typescript
interface ErrorHandler {
  handleSelectionError(error: SelectionError): void
  handleTypingError(error: TypingError): void
  restoreOriginalState(session: TypingSession): void
  logError(error: Error, context: string): void
}
```

## Testing Strategy

### Unit Testing
- Test individual components in isolation
- Mock DOM interactions and browser APIs
- Validate typing logic and metrics calculations
- Test keyboard shortcut handling

### Integration Testing
- Test content script injection and initialization
- Validate text selection and overlay rendering
- Test cross-component communication
- Verify settings persistence and retrieval

### End-to-End Testing
- Test complete user workflows on sample webpages
- Validate typing sessions across different text formats
- Test keyboard shortcuts and session management
- Verify metrics accuracy and hint visibility

### Browser Compatibility Testing
- Test on Chrome, Firefox, Safari, and Edge
- Validate Manifest V3 compatibility
- Test on various webpage layouts and designs
- Verify performance on complex pages

### Performance Testing
- Measure typing response latency
- Test memory usage during long sessions
- Validate cleanup and resource management
- Test on pages with heavy JavaScript

## Implementation Considerations

### User Interface Design
- **Start/Stop Button**: Primary action button in popup for activating/deactivating typing mode
- **Visual State Indicators**: Clear indication of current mode (inactive, selection mode, active session)
- **Session Status Display**: Show current typing metrics and session information in popup
- **Quick Actions**: Easy access to common functions like showing/hiding hints

### Content Security Policy
- Handle CSP restrictions on target websites
- Use appropriate injection methods for styling
- Avoid inline scripts and styles where possible

### Accessibility
- Maintain keyboard navigation compatibility
- Preserve screen reader functionality
- Ensure sufficient color contrast for highlights
- Support high contrast and dark mode themes

### Performance Optimization
- Minimize DOM manipulation during typing
- Use efficient event handling and debouncing
- Implement lazy loading for complex formatting
- Optimize overlay rendering for smooth experience

### Privacy and Security
- No data collection or external communication
- Local storage only for user preferences
- Secure handling of webpage content
- Respect website permissions and restrictions