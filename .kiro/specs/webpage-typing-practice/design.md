# Webpage Typing Practice Extension - Design Document

## Architecture Overview

### Extension Structure
```
src/
├── manifest.json           # Extension manifest (Manifest V3)
├── background/
│   └── background.js       # Service worker for extension lifecycle
├── content/
│   ├── content-script.js   # Main content script
│   ├── inline-typing.js    # Inline typing functionality
│   ├── stats-popup.js      # Statistics display
│   ├── personal-records.js # Personal records tracking
│   └── typing-interface.css # Styles for typing interface
├── popup/
│   ├── popup.html          # Extension popup interface
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup functionality
└── icons/                  # Extension icons
```

## Core Components

### 1. InlineTyping Class
**Purpose**: Handles direct typing on original paragraph elements

**Key Methods**:
- `startTyping(paragraphElement)` - Initialize typing session
- `setupKeyListener()` - Handle keystroke events
- `setCursor(position)` - Position cursor at character
- `cleanup()` - Restore original content

**Features**:
- Converts paragraph text to individual character spans
- Real-time character validation and highlighting
- Escape key handling for session termination

### 2. StatsPopup Class
**Purpose**: Display real-time typing statistics and session summary

**Key Methods**:
- `show(totalCharacters)` - Display initial stats popup
- `update(completedChars, errorCount)` - Update live statistics
- `showSummary()` - Display final session results

**Metrics Calculated**:
- Words Per Minute (WPM): `(completedChars / 5) / (timeElapsed / 60)`
- Accuracy: `((completedChars - errors) / completedChars) * 100`
- Progress: `currentPosition / totalCharacters`

### 3. PersonalRecords Class
**Purpose**: Track and persist user's typing performance over time

**Key Methods**:
- `updateRecords(wpm, accuracy)` - Check for new records
- `getRecords()` - Retrieve current records
- `saveRecords()` - Persist to localStorage

**Data Stored**:
- Best WPM achieved
- Best accuracy percentage
- Total sessions completed
- Running average WPM

### 4. Content Script (content-script.js)
**Purpose**: Main orchestration and webpage interaction

**Key Functions**:
- `activateSelectionMode()` - Highlight available paragraphs
- `processSelectedParagraph()` - Start typing session
- `findAllParagraphs()` - Identify suitable text elements
- `isParagraphSuitable()` - Validate paragraph for typing

## User Interaction Flow

### 1. Activation
1. User clicks extension button
2. `activateSelectionMode()` called
3. All suitable paragraphs highlighted with green outline
4. Selection mode indicator appears

### 2. Paragraph Selection
1. User clicks on highlighted paragraph
2. `processSelectedParagraph()` called
3. Selection mode deactivated
4. `InlineTyping.startTyping()` initiated

### 3. Typing Session
1. Paragraph content converted to character spans
2. Stats popup appears showing initial metrics
3. User types, each keystroke validated
4. Real-time feedback: green for correct, red flash for errors
5. Stats updated with each character

### 4. Session Completion
1. Either full paragraph typed or Escape pressed
2. `showSummary()` displays final statistics
3. Personal records updated if new records achieved
4. Original paragraph content restored
5. Session cleanup performed

## Technical Implementation

### Character-Level Processing
```javascript
// Convert paragraph to individual character spans
for (let i = 0; i < text.length; i++) {
  const span = document.createElement('span');
  span.textContent = text[i];
  span.className = 'typing-char';
  paragraph.appendChild(span);
}
```

### Real-Time Validation
```javascript
if (inputKey === expectedChar) {
  span.classList.add('completed');
  position++;
} else {
  span.classList.add('error');
  errorCount++;
}
```

### Statistics Calculation
```javascript
const wpm = (completedChars / 5) / (timeElapsed / 60);
const accuracy = ((completedChars - errors) / completedChars) * 100;
```

## Styling and Visual Feedback

### Character States
- **Default**: Normal text appearance
- **Completed**: Green background (`#c8e6c9`)
- **Error**: Red background with shake animation (`#ffcdd2`)
- **Current**: Cursor positioned at character

### UI Components
- **Stats Popup**: Fixed position top-right, non-intrusive
- **Selection Highlights**: Green outline on hoverable paragraphs
- **Progress Indicators**: Character count and percentage complete

## Data Persistence

### Local Storage Schema
```javascript
{
  "typing-practice-records": {
    "bestWPM": 65,
    "bestAccuracy": 98,
    "totalSessions": 42,
    "averageWPM": 58
  }
}
```

## Performance Considerations

### Memory Management
- Event listeners properly removed on cleanup
- DOM elements restored to original state
- No memory leaks from abandoned sessions

### DOM Efficiency
- Minimal DOM manipulation during typing
- Efficient character span creation
- Clean restoration of original content

### Browser Compatibility
- Manifest V3 for modern browsers
- Cross-browser CSS with fallbacks
- Standard Web APIs only
