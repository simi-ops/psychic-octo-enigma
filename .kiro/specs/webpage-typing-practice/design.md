# Webpage Typing Practice Extension - Design Document

## Overview

This browser extension transforms any webpage content into interactive typing practice sessions with inline typing directly on the original text. The system allows users to select paragraphs and practice typing with real-time feedback, statistics tracking, and personal record management while maintaining full accessibility and cross-browser compatibility.

## Architecture Overview

### Extension Structure
```
src/
├── manifest.json           # Extension manifest (Manifest V3)
├── background/
│   └── background.js       # Service worker for extension lifecycle
├── content/
│   ├── content-script.js   # Main content script orchestration
│   ├── inline-typing.js    # Inline typing functionality
│   ├── stats-popup.js      # Real-time statistics display
│   ├── personal-records.js # Personal records tracking & persistence
│   └── typing-interface.css # Accessible styles for typing interface
├── popup/
│   ├── popup.html          # Extension popup interface
│   ├── popup.css           # Popup styles with accessibility support
│   └── popup.js            # Popup functionality
└── icons/                  # Extension icons (16, 32, 48, 128px)
```

### Design Rationale
- **Manifest V3**: Ensures modern browser compatibility and future-proofing (Requirement 6.1)
- **Modular Architecture**: Separates concerns for maintainability and testing
- **Content Script Approach**: Enables direct webpage interaction while maintaining security
- **Non-Destructive Design**: All modifications can be fully restored (Requirement 6.3)

## Core Components

### 1. Content Script (content-script.js)
**Purpose**: Main orchestration and webpage interaction (Requirements 1, 6)

**Key Functions**:
- `activateSelectionMode()` - Highlight available paragraphs with green outline (Requirement 1.1)
- `processSelectedParagraph()` - Start typing session on selected paragraph (Requirement 1.2)
- `findAllParagraphs()` - Identify suitable text elements for typing practice
- `isParagraphSuitable()` - Validate paragraphs (minimum 20 characters, text content) (Requirement 1.4)
- `deactivateSelectionMode()` - Clean up selection mode indicators

**Design Decisions**:
- Uses event delegation for efficient paragraph click handling
- Implements visual mode indicator for clear user feedback (Requirement 1.3)
- Preserves original webpage layout and formatting (Requirement 6.2)

### 2. InlineTyping Class
**Purpose**: Handles direct typing on original paragraph elements (Requirements 2, 5)

**Key Methods**:
- `startTyping(paragraphElement)` - Initialize typing session with character spans (Requirement 2.3)
- `setupKeyListener()` - Handle keystroke events with accessibility support (Requirement 7.1)
- `validateCharacter(inputKey, expectedChar)` - Real-time character validation (Requirements 2.1, 2.2)
- `handleEscapeKey()` - Session termination and summary display (Requirement 5.1)
- `cleanup()` - Restore original content exactly (Requirement 5.3)

**Features**:
- Converts paragraph text to individual character spans for precise feedback (Requirement 2.3)
- Real-time character validation with visual feedback (Requirements 2.1, 2.2)
- Non-blocking error handling that allows continued typing (Requirement 2.4)
- Escape key handling for session termination (Requirement 5.1)
- Auto-completion detection for full paragraph typing (Requirement 5.2)

### 3. StatsPopup Class
**Purpose**: Display real-time typing statistics and session summary (Requirements 3, 5)

**Key Methods**:
- `show(totalCharacters)` - Display initial floating stats popup (Requirement 3.1)
- `update(completedChars, errorCount)` - Update live statistics with each keystroke (Requirement 3.2)
- `showSummary(finalStats, newRecords)` - Display comprehensive session results (Requirement 5.4)
- `calculateWPM(completedChars, timeElapsed)` - WPM calculation using standard formula (Requirement 3.3)
- `calculateAccuracy(completedChars, errors)` - Accuracy percentage calculation (Requirement 3.4)

**Metrics Calculated**:
- Words Per Minute (WPM): `(completedChars / 5) / (timeElapsed / 60)` (Requirement 3.3)
- Accuracy: `((completedChars - errors) / completedChars) * 100` (Requirement 3.4)
- Progress: `currentPosition / totalCharacters`
- Error count and typing speed trends

**Design Decisions**:
- Floating popup positioned to avoid content interference
- Real-time updates without performance impact
- Accessible markup with ARIA labels (Requirement 7.2)
- High contrast mode compatibility (Requirement 7.3)
- Progress: `currentPosition / totalCharacters`

### 4. PersonalRecords Class
**Purpose**: Track and persist user's typing performance over time (Requirements 4, 6)

**Key Methods**:
- `updateRecords(wpm, accuracy, sessionData)` - Check and update personal records (Requirement 4.1)
- `checkForNewRecords(sessionStats)` - Identify new achievements (Requirement 4.2)
- `getRecords()` - Retrieve current records from persistent storage
- `saveRecords()` - Persist to localStorage with error handling (Requirement 4.3)
- `displayCelebration(newRecords)` - Show achievement notifications (Requirement 4.2)

**Data Stored** (Requirement 4.3):
- Best WPM achieved
- Best accuracy percentage  
- Total sessions completed
- Running average WPM
- Session timestamps for analytics
- Achievement unlock dates

**Design Decisions**:
- localStorage for cross-session persistence (Requirements 4.3, 4.4)
- Graceful error handling for storage failures (Requirement 7.4)
- Celebration animations for new records (Requirement 4.2)
- Data validation to prevent corruption

## User Interaction Flow

### 1. Activation (Requirement 1)
1. User clicks extension button or uses keyboard shortcut (Requirement 7.1)
2. `activateSelectionMode()` called
3. All suitable paragraphs (≥20 characters, text content) highlighted with green outline (Requirements 1.1, 1.4)
4. Selection mode indicator appears with accessible markup (Requirements 1.3, 7.2)
5. Screen reader announces selection mode activation (Requirement 7.2)

### 2. Paragraph Selection (Requirement 1)
1. User clicks on highlighted paragraph or uses keyboard navigation (Requirements 1.2, 7.1)
2. `processSelectedParagraph()` called with accessibility focus management
3. Selection mode deactivated and indicators removed
4. `InlineTyping.startTyping()` initiated with ARIA live region setup

### 3. Typing Session (Requirements 2, 3)
1. Paragraph content converted to individual character spans (Requirement 2.3)
2. Stats popup appears showing initial metrics with ARIA labels (Requirement 3.1)
3. User types, each keystroke validated in real-time (Requirements 2.1, 2.2)
4. Visual feedback: green highlighting for correct, red flash for errors (Requirements 2.1, 2.2)
5. Stats updated with each character without blocking typing (Requirements 2.4, 3.2)
6. Error handling maintains session continuity (Requirement 7.4)

### 4. Session Completion (Requirements 4, 5)
1. Session ends via full paragraph completion or Escape key (Requirements 5.1, 5.2)
2. `showSummary()` displays comprehensive final statistics (Requirement 5.4)
3. Personal records checked and updated for new achievements (Requirements 4.1, 4.2)
4. Celebration displayed for new records with accessible announcements (Requirement 4.2)
5. Original paragraph content restored exactly (Requirement 5.3)
6. Session cleanup performed with proper event listener removal

## Technical Implementation

### Character-Level Processing (Requirement 2.3)
```javascript
// Convert paragraph to individual character spans with accessibility
for (let i = 0; i < text.length; i++) {
  const span = document.createElement('span');
  span.textContent = text[i];
  span.className = 'typing-char';
  span.setAttribute('data-char-index', i);
  span.setAttribute('aria-label', `Character ${i + 1}: ${text[i]}`);
  paragraph.appendChild(span);
}
```

### Real-Time Validation (Requirements 2.1, 2.2, 2.4)
```javascript
// Non-blocking character validation with visual feedback
if (inputKey === expectedChar) {
  span.classList.add('completed');
  span.setAttribute('aria-label', 'Correct');
  position++;
  updateStats(position, errorCount);
} else {
  span.classList.add('error');
  span.setAttribute('aria-label', 'Error');
  errorCount++;
  // Continue typing without blocking (Requirement 2.4)
  triggerErrorAnimation(span);
}
```

### Statistics Calculation (Requirements 3.3, 3.4)
```javascript
// Standard WPM calculation (Requirement 3.3)
const wpm = (completedChars / 5) / (timeElapsed / 60);

// Accuracy percentage (Requirement 3.4)  
const accuracy = ((completedChars - errors) / completedChars) * 100;

// Progress tracking
const progress = (currentPosition / totalCharacters) * 100;
```

### Accessibility Implementation (Requirement 7)
```javascript
// Keyboard navigation support (Requirement 7.1)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && selectionMode) {
    navigateParagraphs(e.shiftKey ? -1 : 1);
    e.preventDefault();
  }
});

// Screen reader announcements (Requirement 7.2)
const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

## Styling and Visual Feedback

### Character States (Requirements 2.1, 2.2, 7.3)
- **Default**: Normal text appearance with focus indicators
- **Completed**: Green background (`#c8e6c9`) with high contrast support (Requirement 7.3)
- **Error**: Red background with shake animation (`#ffcdd2`) and accessible error indication
- **Current**: Visible cursor with keyboard focus styling (Requirement 7.1)

### UI Components (Requirements 3.1, 7.2, 7.3)
- **Stats Popup**: Fixed position top-right, non-intrusive with ARIA labels (Requirement 7.2)
- **Selection Highlights**: Green outline on hoverable paragraphs with keyboard focus support
- **Progress Indicators**: Character count and percentage with screen reader compatibility
- **Mode Indicators**: Clear visual feedback for selection mode state (Requirement 1.3)

### Accessibility Styling (Requirement 7)
```css
/* High contrast mode support (Requirement 7.3) */
@media (prefers-contrast: high) {
  .typing-char.completed { background: #000; color: #fff; }
  .typing-char.error { background: #ff0000; color: #fff; }
}

/* Screen reader only content (Requirement 7.2) */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}

/* Keyboard focus indicators (Requirement 7.1) */
.paragraph-selectable:focus {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}
```

## Data Models

### Personal Records Schema (Requirements 4.3, 4.4)
```javascript
{
  "typing-practice-records": {
    "bestWPM": 65,
    "bestAccuracy": 98,
    "totalSessions": 42,
    "averageWPM": 58,
    "sessionHistory": [
      {
        "date": "2024-01-15T10:30:00Z",
        "wpm": 62,
        "accuracy": 96,
        "errors": 3,
        "textLength": 150
      }
    ],
    "achievements": {
      "firstSession": "2024-01-01T09:00:00Z",
      "bestWPMDate": "2024-01-15T10:30:00Z",
      "bestAccuracyDate": "2024-01-10T14:20:00Z"
    }
  }
}
```

### Session Data Model
```javascript
{
  "sessionId": "uuid-v4",
  "startTime": Date,
  "endTime": Date,
  "textContent": String,
  "totalCharacters": Number,
  "completedCharacters": Number,
  "errorCount": Number,
  "wpm": Number,
  "accuracy": Number,
  "newRecords": Array
}
```

## Error Handling

### Graceful Degradation (Requirement 7.4)
- **Storage Failures**: Fallback to session-only records if localStorage unavailable
- **DOM Manipulation Errors**: Safe restoration of original content on any failure
- **Extension Context Loss**: Automatic cleanup and user notification
- **Invalid Text Content**: Skip problematic paragraphs with user feedback

### Error Recovery Strategies
```javascript
// Safe paragraph processing with error boundaries
try {
  processSelectedParagraph(element);
} catch (error) {
  console.warn('Paragraph processing failed:', error);
  restoreOriginalContent();
  showUserFriendlyError('Unable to start typing session on this text.');
}

// Robust localStorage operations
const saveRecords = (records) => {
  try {
    localStorage.setItem('typing-practice-records', JSON.stringify(records));
  } catch (error) {
    console.warn('Failed to save records:', error);
    // Continue with session-only mode
    showNotification('Records will not be saved this session.');
  }
};
```

## Testing Strategy

### Unit Testing Coverage
- Character validation logic (Requirements 2.1, 2.2)
- Statistics calculation accuracy (Requirements 3.3, 3.4)
- Personal records management (Requirements 4.1, 4.2)
- Accessibility helper functions (Requirement 7)

### Integration Testing
- End-to-end typing session flow (Requirements 1-5)
- Cross-browser compatibility verification (Requirement 6.1)
- Accessibility compliance testing (Requirement 7)
- Performance impact measurement (Requirement 6.4)

### Accessibility Testing
- Screen reader compatibility (NVDA, JAWS, VoiceOver) (Requirement 7.2)
- Keyboard-only navigation testing (Requirement 7.1)
- High contrast mode verification (Requirement 7.3)
- Color blindness accessibility validation

## Performance Considerations

### Memory Management (Requirement 6.4)
- Event listeners properly removed on cleanup
- DOM elements restored to original state
- No memory leaks from abandoned sessions
- Efficient garbage collection of character spans

### DOM Efficiency
- Minimal DOM manipulation during typing
- Efficient character span creation and removal
- Clean restoration of original content (Requirement 5.3)
- Optimized event handling for real-time updates

### Browser Compatibility (Requirement 6.1)
- Manifest V3 for modern browsers (Chrome, Firefox, Edge)
- Cross-browser CSS with accessibility fallbacks
- Standard Web APIs only for maximum compatibility
- Progressive enhancement for advanced features
