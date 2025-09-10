# Implementation Plan

- [x] 1. Set up browser extension project structure
  - Create manifest.json with Manifest V3 configuration
  - Set up directory structure for content scripts, background scripts, and popup
  - Configure extension permissions for all websites and content script injection
  - _Requirements: 4.1_

- [x] 2. Implement core text selection functionality
  - [x] 2.1 Create TextSelectionHandler class
    - Implement captureSelection() method to get user text selection
    - Add validateSelection() to ensure selection is valid for typing practice
    - Create extractFormattedContent() to preserve HTML formatting
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Implement content script injection and initialization
    - Create content script that loads on all webpages
    - Add extension button click handler to activate text selection mode
    - Implement selection event listeners and validation
    - _Requirements: 1.1, 4.1_

- [x] 3. Build typing interface engine
  - [x] 3.1 Create TypingInterface class with overlay rendering
    - Implement initialize() method to set up typing session
    - Create renderTypingOverlay() to display typing interface over selected text
    - Add updateCursor() and highlightProgress() for visual feedback
    - _Requirements: 1.2, 1.3, 4.2_

  - [x] 3.2 Implement format preservation system
    - Create FormatNode data structure for HTML element preservation
    - Build formatting parser to maintain original text styling
    - Implement overlay positioning to match original text layout
    - _Requirements: 1.3, 4.2, 4.3_

- [x] 4. Create input processing and validation system
  - [x] 4.1 Implement InputProcessor class
    - Create processKeyInput() method for keystroke handling
    - Add validateCharacter() for correct/incorrect typing detection
    - Implement character advancement and error indication logic
    - _Requirements: 1.4, 1.5_

  - [x] 4.2 Add keyboard shortcut handling
    - Implement handleShortcut() method for Tab, Shift-Tab, and Esc keys
    - Create skip character functionality (Tab key)
    - Add skip paragraph functionality (Shift-Tab key)
    - Implement session exit functionality (Esc key)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Build metrics calculation system
  - [x] 5.1 Create MetricsCalculator class
    - Implement startSession() to initialize timing and counters
    - Add recordKeystroke() to track correct/incorrect inputs
    - Create calculateWPM() for real-time words per minute calculation
    - Implement calculateAccuracy() for typing accuracy percentage
    - _Requirements: 3.1, 5.1, 5.2_

  - [x] 5.2 Handle skip tracking and exclusions
    - Implement recordSkip() to track skipped characters
    - Exclude skipped characters from accuracy calculations
    - Create getSessionSummary() for final performance metrics
    - _Requirements: 2.4, 5.3, 5.4_

- [x] 6. Create hints and UI display system
  - [x] 6.1 Implement typing speed and shortcuts display
    - Create floating hints panel showing current WPM
    - Add keyboard shortcuts reference display
    - Implement real-time speed updates during typing
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Add hint visibility controls
    - Implement X button to hide hints panel
    - Create right-click context menu on extension button
    - Add functionality to reopen hints from context menu
    - Store hint visibility preference in extension settings
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 7. Implement session management and cleanup
  - [x] 7.1 Create TypingSession state management
    - Implement session initialization and tracking
    - Add session cleanup and original state restoration
    - Create session end functionality with metrics summary
    - _Requirements: 2.3, 5.4, 5.5_

  - [x] 7.2 Handle multiple sessions and edge cases
    - Prevent multiple simultaneous sessions on same page
    - Implement graceful handling of dynamic content changes
    - Add error recovery and original state restoration
    - _Requirements: 4.4, 4.5_

- [x] 8. Create extension popup and background script
  - [x] 8.1 Implement extension popup interface
    - Create popup HTML with settings and controls
    - Add popup script for user preference management
    - Implement settings persistence using chrome.storage
    - _Requirements: 3.4, 3.5_

  - [x] 8.2 Create background script for extension lifecycle
    - Implement background script for cross-tab communication
    - Add extension installation and update handling
    - Create context menu registration and management
    - _Requirements: 3.4_

- [x] 9. Add comprehensive error handling and validation
  - [x] 9.1 Implement error handling for DOM operations
    - Add validation for element existence before manipulation
    - Create error recovery for unexpected DOM changes
    - Implement graceful degradation for unsupported features
    - _Requirements: 4.4, 4.5_

  - [x] 9.2 Add input validation and edge case handling
    - Validate text selection before creating typing session
    - Handle empty or invalid selections gracefully
    - Add error handling for non-typeable content
    - _Requirements: 1.1, 4.5_

- [x] 10. Implement styling and visual feedback
  - [x] 10.1 Create CSS for typing interface
    - Design highlight colors for completed characters
    - Add error indication styling for incorrect input
    - Create cursor positioning and animation styles
    - _Requirements: 1.4, 1.5_

  - [x] 10.2 Add responsive design and accessibility
    - Implement responsive overlay positioning
    - Add high contrast and dark mode support
    - Ensure keyboard navigation compatibility
    - _Requirements: 4.2, 4.4_

- [x] 11. Write comprehensive tests
  - [x] 11.1 Create unit tests for core components
    - Test TextSelectionHandler functionality
    - Test InputProcessor keystroke validation
    - Test MetricsCalculator accuracy and WPM calculations
    - _Requirements: All requirements validation_

  - [x] 11.2 Add integration tests for user workflows
    - Test complete typing session workflow
    - Test keyboard shortcuts and session management
    - Test format preservation across different content types
    - _Requirements: 1.1-1.5, 2.1-2.4, 3.1-3.5_

- [x] 12. Final integration and polish
  - [x] 12.1 Integrate all components into working extension
    - Wire together all modules and ensure proper communication
    - Test complete user workflows end-to-end
    - Optimize performance and memory usage
    - _Requirements: All requirements_

  - [x] 12.2 Cross-browser compatibility and final testing
    - Test extension on Chrome, Firefox, and Edge
    - Validate Manifest V3 compatibility across browsers
    - Perform final testing on various webpage layouts
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 13. Create extension icons and assets
  - [x] 13.1 Design and create extension icons
    - Create 16x16, 32x32, 48x48, and 128x128 pixel icons
    - Design icons that clearly represent typing practice functionality
    - Ensure icons work well in both light and dark browser themes
    - _Requirements: 4.1_

  - [x] 13.2 Add icon files to extension package
    - Save icon files in src/icons/ directory
    - Update manifest.json to reference correct icon paths
    - Test icon display in browser extension management
    - _Requirements: 4.1_

- [x] 14. Enhance popup interface with start/stop controls
  - [x] 14.1 Update popup HTML with start/stop button
    - Add prominent start/stop typing mode button
    - Create session status display section
    - Add visual indicators for different states (inactive, selection mode, active session)
    - Update popup layout to accommodate new controls
    - _Requirements: 1.1, 4.1_

  - [x] 14.2 Implement start/stop functionality in popup script
    - Add event handlers for start/stop button clicks
    - Implement session status checking and display updates
    - Add real-time session metrics display in popup
    - Create state management for button text and styling
    - _Requirements: 1.1, 3.1, 4.1_

  - [x] 14.3 Update popup styling for improved user experience
    - Style start/stop button with clear visual states
    - Add session status indicators and metrics display
    - Implement responsive design for different popup sizes
    - Add loading states and transition animations
    - _Requirements: 4.2_

  - [x] 14.4 Enhance background script for popup communication
    - Update message handling for start/stop actions
    - Add session status broadcasting to popup
    - Implement proper state synchronization between popup and content script
    - Add error handling for popup-content script communication
    - _Requirements: 3.4, 4.1_

- [x] 15. Complete missing test coverage
  - [x] 15.1 Add unit tests for TypingInterface class
    - Test overlay rendering and positioning
    - Test cursor movement and character highlighting
    - Test format preservation during typing
    - _Requirements: 1.2, 1.3, 4.2_

  - [x] 15.2 Add unit tests for InputProcessor class
    - Test keyboard shortcut handling (Tab, Shift-Tab, Esc)
    - Test character validation and error detection
    - Test skip functionality and position advancement
    - _Requirements: 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

  - [x] 15.3 Add unit tests for TypingSession class
    - Test session initialization and cleanup
    - Test error recovery and state validation
    - Test dynamic content change handling
    - _Requirements: 2.3, 4.4, 4.5, 5.4, 5.5_

  - [x] 15.4 Add unit tests for HintsUI class
    - Test hints panel creation and styling
    - Test real-time metrics updates
    - Test visibility controls and settings persistence
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 15.5 Add unit tests for SettingsManager class
    - Test settings loading and saving
    - Test settings validation and defaults
    - Test storage change listeners
    - _Requirements: 3.5_

  - [x] 15.6 Add unit tests for popup interface
    - Test start/stop button functionality
    - Test session status display updates
    - Test popup-content script communication
    - Test settings controls and persistence
    - _Requirements: 1.1, 3.4, 4.1_