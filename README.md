# Webpage Typing Practice Extension
## Instant Typing Practice
A browser extension that transforms any webpage content into interactive typing practice sessions while preserving the original formatting.

## Features

- Select text on any webpage for typing practice
- Preserve original formatting and layout
- Real-time typing speed and accuracy metrics
- Floating hints panel with WPM, accuracy, and shortcuts
- Keyboard shortcuts for navigation and control
- Hint visibility controls (X button, context menu, popup)
- Settings persistence across sessions
- Cross-browser compatibility (Chrome, Firefox, Edge)

## Project Structure

```
src/
├── manifest.json           # Extension manifest (Manifest V3)
├── background/
│   └── background.js       # Background script for extension lifecycle
├── content/
│   ├── content-script.js   # Main content script injected into webpages
│   ├── settings-manager.js # Extension settings persistence
│   ├── metrics-calculator.js # Typing metrics calculation
│   ├── hints-ui.js         # Floating hints panel UI
│   └── typing-interface.css # Styles for typing interface
├── popup/
│   ├── popup.html          # Extension popup interface
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup functionality
└── icons/
    └── README.md           # Icon requirements and specifications
```

## Development

This extension uses Manifest V3 and is compatible with modern browsers.

## Installation

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `src` directory
4. The extension will appear in your browser toolbar

## Usage

1. Click the extension button to activate text selection mode
2. Select text on any webpage
3. Start typing to practice with the selected text
4. Use keyboard shortcuts:
   - Tab: Skip current character
   - Shift+Tab: Skip to next paragraph
   - Esc: End typing session

### Hints Panel Controls

The floating hints panel shows your current typing speed, accuracy, and available shortcuts. You can control its visibility in several ways:

- **X Button**: Click the X button on the hints panel to hide it
- **Context Menu**: Right-click the extension button for quick show/hide options
- **Popup Interface**: Use the extension popup to toggle hints visibility
- **Settings Persistence**: Your hint visibility preference is automatically saved

### Context Menu Options

Right-click the extension button to access:
- Show Hints Panel
- Hide Hints Panel  
- Reset Settings
