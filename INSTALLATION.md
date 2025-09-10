# Installation and Testing Guide

## Installation

### Chrome/Edge Installation
1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" toggle in the top right
4. Click "Load unpacked" button
5. Select the `src` directory from this project
6. The extension should appear in your extensions list

### Firefox Installation
1. Open Firefox browser
2. Navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the `src` directory and select `manifest.json`
6. The extension will be loaded temporarily

## Testing

### Basic Functionality Test
1. Open the included `test-page.html` in your browser
2. Click the extension button in the toolbar
3. Select any text on the page
4. Start typing to practice
5. Verify the typing interface appears with proper highlighting

### Keyboard Shortcuts Test
- **Tab**: Skip current character
- **Shift+Tab**: Skip to next paragraph
- **Esc**: Exit typing session

### Hints Panel Test
1. During a typing session, verify the hints panel appears
2. Click the X button to hide hints
3. Right-click the extension button to show context menu
4. Select "Show Hints Panel" to restore hints

### Cross-Browser Compatibility
Test the extension on:
- ✅ Chrome (latest)
- ✅ Edge (latest)
- ✅ Firefox (latest)

### Performance Testing
1. Test on complex webpages (news sites, documentation)
2. Test with long text selections (>1000 characters)
3. Verify smooth typing response and cursor movement
4. Check memory usage during extended sessions

### Error Handling Test
1. Try selecting invalid content (images, empty areas)
2. Test on pages with heavy JavaScript
3. Verify graceful handling of dynamic content changes
4. Test session recovery after page navigation

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the `src` directory
- Check browser console for error messages
- Verify manifest.json is valid JSON

### Typing Interface Not Appearing
- Check if text selection is valid (minimum 3 characters)
- Ensure selection is not within input fields or textareas
- Verify extension permissions are granted

### Performance Issues
- Test on simpler pages first
- Check for conflicting extensions
- Clear browser cache and reload

### Hints Panel Issues
- Check extension storage permissions
- Reset settings using context menu
- Verify popup functionality

## Development Testing

### Running Unit Tests
```bash
npm install
npm test
```

### Running with Coverage
```bash
npm run test:coverage
```

### Watch Mode for Development
```bash
npm run test:watch
```

## Browser-Specific Notes

### Chrome/Edge
- Full Manifest V3 support
- All features work as expected
- Context menus fully functional

### Firefox
- Manifest V3 support varies by version
- Some storage APIs may behave differently
- Test thoroughly on target Firefox versions

## Known Limitations

1. Cannot practice typing on:
   - Input fields and textareas
   - Images and media content
   - Very short text selections (<3 characters)

2. Performance considerations:
   - Large text selections (>10,000 characters) are blocked
   - Complex pages may have slower response times

3. Browser compatibility:
   - Some advanced features require modern browser versions
   - Manifest V3 support varies across browsers
