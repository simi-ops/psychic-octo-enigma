/**
 * TypingSession class - manages typing session state, lifecycle, and cleanup
 * Implements requirements 2.3, 5.4, 5.5, 4.4, 4.5 for session management
 */
class TypingSession {
  constructor() {
    this.id = null;
    this.isActive = false;
    this.startTime = null;
    this.endTime = null;
    
    // Session components
    this.textSelectionHandler = null;
    this.typingInterface = null;
    this.inputProcessor = null;
    this.metricsCalculator = null;
    this.hintsUI = null;
    this.settingsManager = null;
    
    // Session data
    this.selectedText = null;
    this.formattedContent = null;
    this.currentPosition = 0;
    this.originalState = null;
    
    // Error handling and recovery
    this.errorRecoveryData = null;
    this.cleanupCallbacks = [];
    
    // Multiple session prevention
    this.sessionLock = false;
    
    // Dynamic content change detection
    this.contentObserver = null;
    this.originalContentHash = null;
  }

  /**
   * Initializes a new typing session
   * @param {Object} selectedText - Selected text object from TextSelectionHandler
   * @param {Object} formattedContent - Formatted content with styling information
   * @param {Object} components - Required components (textSelectionHandler, etc.)
   * @returns {Promise<boolean>} True if session initialized successfully
   */
  async initialize(selectedText, formattedContent, components) {
    try {
      // Prevent multiple simultaneous sessions (Requirement 4.4)
      if (this.sessionLock || this.isActive) {
        console.warn('Cannot initialize session: another session is already active');
        return false;
      }

      // Check for existing active sessions on the page
      if (this.hasActiveSessionOnPage()) {
        console.warn('Cannot initialize session: another typing session is active on this page');
        return false;
      }

      this.sessionLock = true;
      
      // Generate unique session ID
      this.id = this.generateSessionId();
      
      // Store session data
      this.selectedText = selectedText;
      this.formattedContent = formattedContent;
      this.startTime = new Date();
      
      // Store components
      this.textSelectionHandler = components.textSelectionHandler;
      this.settingsManager = components.settingsManager;
      
      // Capture original state for restoration (Requirement 2.3)
      this.captureOriginalState();
      
      // Initialize metrics calculator
      this.metricsCalculator = new MetricsCalculator();
      this.metricsCalculator.startSession();
      
      // Initialize typing interface
      this.typingInterface = new TypingInterface();
      this.typingInterface.initialize(formattedContent, selectedText.container || selectedText.parentElement, selectedText);
      
      // Initialize input processor
      this.inputProcessor = new InputProcessor(this.typingInterface);
      
      // Initialize hints UI with settings
      this.hintsUI = new HintsUI();
      this.hintsUI.initialize(this.metricsCalculator);
      
      // Apply saved settings
      await this.applySettings();
      
      // Set up dynamic content monitoring (Requirement 4.5)
      this.setupContentMonitoring();
      
      // Set up error recovery
      this.setupErrorRecovery();
      
      // Set up page visibility monitoring
      this.setupVisibilityMonitoring();
      
      // Set up page unload monitoring
      this.setupUnloadMonitoring();
      
      // Mark session as active
      this.isActive = true;
      this.sessionLock = false;
      
      // Register global session reference
      this.registerGlobalSession();
      
      console.log('TypingSession initialized successfully:', {
        id: this.id,
        textLength: selectedText.content.length,
        hasFormatting: formattedContent.formatting.length > 0,
        skipPositions: formattedContent.skipPositions.length
      });
      
      return true;
      
    } catch (error) {
      console.error('Error initializing typing session:', error);
      this.sessionLock = false;
      await this.cleanup();
      return false;
    }
  }

  /**
   * Ends the typing session and provides metrics summary
   * @param {string} reason - Reason for ending session ('completed', 'cancelled', 'error')
   * @returns {Promise<Object>} Session summary with metrics
   */
  async endSession(reason = 'completed') {
    if (!this.isActive) {
      console.warn('Cannot end session: no active session');
      return null;
    }

    try {
      this.endTime = new Date();
      
      // Get final metrics summary (Requirement 5.4)
      const sessionSummary = this.getSessionSummary(reason);
      
      // Log session completion
      console.log('Typing session ended:', {
        id: this.id,
        reason: reason,
        duration: sessionSummary.timeElapsed,
        wpm: sessionSummary.wpm,
        accuracy: sessionSummary.accuracy
      });
      
      // Show session summary to user (Requirement 5.5)
      this.displaySessionSummary(sessionSummary);
      
      // Cleanup session
      await this.cleanup();
      
      return sessionSummary;
      
    } catch (error) {
      console.error('Error ending typing session:', error);
      await this.cleanup();
      return null;
    }
  }

  /**
   * Captures the original state of the page for restoration
   */
  captureOriginalState() {
    try {
      this.originalState = {
        selection: {
          range: this.formattedContent.originalRange ? this.formattedContent.originalRange.cloneRange() : null,
          text: this.selectedText.content
        },
        document: {
          activeElement: document.activeElement,
          scrollPosition: {
            x: window.scrollX || document.documentElement.scrollLeft,
            y: window.scrollY || document.documentElement.scrollTop
          }
        },
        styles: {
          bodyStyle: document.body.style.cssText,
          cursor: document.body.style.cursor
        }
      };
      
      // Create content hash for change detection
      this.originalContentHash = this.createContentHash();
      
    } catch (error) {
      console.warn('Could not capture original state:', error);
      this.originalState = null;
    }
  }

  /**
   * Restores the original state of the page
   */
  async restoreOriginalState() {
    if (!this.originalState) {
      console.warn('No original state to restore');
      return;
    }

    try {
      // Restore document styles
      if (this.originalState.styles) {
        document.body.style.cssText = this.originalState.styles.bodyStyle || '';
        document.body.style.cursor = this.originalState.styles.cursor || '';
      }
      
      // Restore scroll position
      if (this.originalState.document.scrollPosition) {
        window.scrollTo(
          this.originalState.document.scrollPosition.x,
          this.originalState.document.scrollPosition.y
        );
      }
      
      // Clear any selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      
      // Restore focus if possible
      if (this.originalState.document.activeElement && 
          this.originalState.document.activeElement.focus) {
        try {
          this.originalState.document.activeElement.focus();
        } catch (e) {
          // Focus restoration might fail, ignore
        }
      }
      
      console.log('Original state restored successfully');
      
    } catch (error) {
      console.warn('Error restoring original state:', error);
    }
  }

  /**
   * Sets up monitoring for dynamic content changes
   */
  setupContentMonitoring() {
    if (!this.selectedText || !this.selectedText.parentElement) {
      return;
    }

    try {
      // Create mutation observer to detect content changes
      this.contentObserver = new MutationObserver((mutations) => {
        this.handleContentChanges(mutations);
      });
      
      // Start observing the parent element and its subtree
      this.contentObserver.observe(this.selectedText.parentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false
      });
      
    } catch (error) {
      console.warn('Could not set up content monitoring:', error);
    }
  }

  /**
   * Handles dynamic content changes during typing session
   * @param {Array} mutations - Array of MutationRecord objects
   */
  handleContentChanges(mutations) {
    if (!this.isActive) {
      return;
    }

    try {
      // Check if changes affect our typing area
      const hasRelevantChanges = mutations.some(mutation => {
        return this.isRelevantContentChange(mutation);
      });

      if (hasRelevantChanges) {
        console.warn('Dynamic content changes detected during typing session');
        
        // Create new content hash
        const newContentHash = this.createContentHash();
        
        if (newContentHash !== this.originalContentHash) {
          // Content has changed significantly, handle gracefully
          this.handleSignificantContentChange();
        }
      }
      
    } catch (error) {
      console.warn('Error handling content changes:', error);
    }
  }

  /**
   * Determines if a mutation is relevant to the typing session
   * @param {MutationRecord} mutation - Mutation record
   * @returns {boolean} True if mutation affects typing area
   */
  isRelevantContentChange(mutation) {
    if (!this.selectedText || !this.selectedText.parentElement) {
      return false;
    }

    const target = mutation.target;
    const parentElement = this.selectedText.parentElement;
    
    // Check if mutation affects our parent element or its ancestors
    let current = target;
    while (current && current !== document.body) {
      if (current === parentElement) {
        return true;
      }
      current = current.parentElement;
    }
    
    return false;
  }

  /**
   * Handles significant content changes that affect the typing session
   */
  async handleSignificantContentChange() {
    console.warn('Significant content change detected, ending session gracefully');
    
    // Show warning to user
    this.showContentChangeWarning();
    
    // End session with appropriate reason
    await this.endSession('content_changed');
  }

  /**
   * Shows warning about content changes
   */
  showContentChangeWarning() {
    const warningEl = document.createElement('div');
    warningEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff9800;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      z-index: 10002;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    warningEl.innerHTML = `
      <strong>Content Changed</strong><br>
      The webpage content has changed during your typing session.<br>
      The session has been ended to prevent conflicts.
    `;
    
    document.body.appendChild(warningEl);
    
    // Remove warning after 4 seconds
    setTimeout(() => {
      if (warningEl.parentNode) {
        warningEl.parentNode.removeChild(warningEl);
      }
    }, 4000);
  }

  /**
   * Creates a hash of the current content for change detection
   * @returns {string} Content hash
   */
  createContentHash() {
    if (!this.selectedText || !this.selectedText.parentElement) {
      return '';
    }

    try {
      const content = this.selectedText.parentElement.textContent || '';
      return this.simpleHash(content);
    } catch (error) {
      return '';
    }
  }

  /**
   * Simple hash function for content comparison
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  }

  /**
   * Sets up error recovery mechanisms
   */
  setupErrorRecovery() {
    // Store error recovery data
    this.errorRecoveryData = {
      sessionId: this.id,
      startTime: this.startTime,
      selectedText: this.selectedText,
      formattedContent: this.formattedContent,
      originalState: this.originalState
    };
    
    // Set up global error handler for this session
    const errorHandler = (event) => {
      if (this.isActive) {
        console.error('Unhandled error in typing session:', event.error);
        this.handleSessionError(event.error);
      }
    };
    
    window.addEventListener('error', errorHandler);
    
    // Store for cleanup
    this.cleanupCallbacks.push(() => {
      window.removeEventListener('error', errorHandler);
    });
  }

  /**
   * Handles session errors and attempts recovery
   * @param {Error} error - Error that occurred
   */
  async handleSessionError(error) {
    console.error('Session error occurred:', error);
    
    try {
      // Attempt to save current progress
      const currentMetrics = this.metricsCalculator ? 
        this.metricsCalculator.getSessionSummary() : null;
      
      if (currentMetrics) {
        console.log('Saving progress before error recovery:', currentMetrics);
      }
      
      // Show error message to user
      this.showErrorMessage('An error occurred during your typing session. The session will be restored.');
      
      // End session with error reason
      await this.endSession('error');
      
    } catch (recoveryError) {
      console.error('Error during session recovery:', recoveryError);
      // Force cleanup if recovery fails
      await this.forceCleanup();
    }
  }

  /**
   * Shows error message to user
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    const errorEl = document.createElement('div');
    errorEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f44336;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      z-index: 10002;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    errorEl.textContent = message;
    
    document.body.appendChild(errorEl);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 5000);
  }

  /**
   * Applies saved settings to the session
   */
  async applySettings() {
    if (!this.settingsManager) {
      return;
    }

    try {
      const hintsVisible = this.settingsManager.getHintsVisibility();
      const updateFrequency = this.settingsManager.getUpdateFrequency();
      
      // Apply hints visibility
      if (this.hintsUI) {
        if (hintsVisible) {
          this.hintsUI.show();
        } else {
          this.hintsUI.hide();
        }
        
        this.hintsUI.setUpdateFrequency(updateFrequency);
      }
      
    } catch (error) {
      console.warn('Error applying settings:', error);
    }
  }

  /**
   * Gets comprehensive session summary with metrics
   * @param {string} endReason - Reason for session end
   * @returns {Object} Session summary object
   */
  getSessionSummary(endReason = 'completed') {
    const endTime = this.endTime || new Date();
    const timeElapsed = Math.max(1, Math.floor((endTime - this.startTime) / 1000)); // At least 1 second
    
    // Get metrics from calculator
    let metrics = {
      wpm: 0,
      accuracy: 0,
      totalCharacters: 0,
      correctCharacters: 0,
      skippedCharacters: 0,
      errorCount: 0
    };
    
    if (this.metricsCalculator) {
      const calculatorMetrics = this.metricsCalculator.getSessionSummary();
      metrics = { ...metrics, ...calculatorMetrics };
    }
    
    // Get current position from typing interface
    const currentPosition = this.typingInterface ? 
      this.typingInterface.getCurrentPosition() : 0;
    
    const totalTextLength = this.selectedText ? this.selectedText.content.length : 0;
    const completionPercentage = totalTextLength > 0 ? 
      Math.round((currentPosition / totalTextLength) * 100) : 0;
    
    return {
      // Session info
      sessionId: this.id,
      startTime: this.startTime,
      endTime: endTime,
      timeElapsed: timeElapsed,
      endReason: endReason,
      
      // Content info
      totalCharacters: totalTextLength,
      completedCharacters: currentPosition,
      completionPercentage: completionPercentage,
      
      // Performance metrics
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      correctCharacters: metrics.correctCharacters,
      skippedCharacters: metrics.skippedCharacters,
      errorCount: metrics.errorCount,
      
      // Additional stats
      averageWPM: timeElapsed > 0 ? Math.round((currentPosition / 5) / (timeElapsed / 60)) : 0,
      charactersPerSecond: timeElapsed > 0 ? Math.round(currentPosition / timeElapsed) : 0
    };
  }

  /**
   * Displays session summary to user
   * @param {Object} summary - Session summary object
   */
  displaySessionSummary(summary) {
    const summaryEl = document.createElement('div');
    summaryEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #4CAF50;
      border-radius: 12px;
      padding: 24px;
      font-family: Arial, sans-serif;
      z-index: 10002;
      max-width: 500px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      text-align: center;
    `;
    
    const endReasonText = {
      'completed': 'Session Completed!',
      'cancelled': 'Session Cancelled',
      'error': 'Session Ended (Error)',
      'content_changed': 'Session Ended (Content Changed)'
    };
    
    summaryEl.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #4CAF50;">
        ${endReasonText[summary.endReason] || 'Session Ended'}
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${summary.wpm}</div>
          <div style="font-size: 14px; color: #666;">Words per Minute</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #FF9800;">${summary.accuracy}%</div>
          <div style="font-size: 14px; color: #666;">Accuracy</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold; color: #9C27B0;">${summary.completionPercentage}%</div>
          <div style="font-size: 14px; color: #666;">Completed</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold; color: #607D8B;">${summary.timeElapsed}s</div>
          <div style="font-size: 14px; color: #666;">Duration</div>
        </div>
      </div>
      <div style="font-size: 14px; color: #666; margin-bottom: 16px;">
        ${summary.completedCharacters} of ${summary.totalCharacters} characters
        ${summary.skippedCharacters > 0 ? `(${summary.skippedCharacters} skipped)` : ''}
      </div>
      <button id="close-summary" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
      ">Close</button>
    `;
    
    document.body.appendChild(summaryEl);
    
    // Handle close button
    const closeButton = summaryEl.querySelector('#close-summary');
    closeButton.addEventListener('click', () => {
      if (summaryEl.parentNode) {
        summaryEl.parentNode.removeChild(summaryEl);
      }
    });
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (summaryEl.parentNode) {
        summaryEl.parentNode.removeChild(summaryEl);
      }
    }, 10000);
  }

  /**
   * Checks if there's already an active session on the page
   * @returns {boolean} True if active session exists
   */
  hasActiveSessionOnPage() {
    // Check for existing overlay
    const existingOverlay = document.getElementById('typing-practice-overlay');
    if (existingOverlay) {
      return true;
    }
    
    // Check for existing hints panel
    const existingHints = document.querySelector('.typing-hints-panel');
    if (existingHints) {
      return true;
    }
    
    // Check global session registry
    if (window.typingPracticeActiveSession && 
        window.typingPracticeActiveSession !== this) {
      return true;
    }
    
    // Check for any typing-related elements that might indicate an active session
    const typingElements = document.querySelectorAll('[id^="typing-practice-"], [class*="typing-"]');
    if (typingElements.length > 0) {
      // Verify these elements are actually from an active session
      for (const element of typingElements) {
        if (element.style.display !== 'none' && element.offsetParent !== null) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Registers this session globally to prevent multiple sessions
   */
  registerGlobalSession() {
    window.typingPracticeActiveSession = this;
  }

  /**
   * Unregisters this session from global registry
   */
  unregisterGlobalSession() {
    if (window.typingPracticeActiveSession === this) {
      window.typingPracticeActiveSession = null;
    }
  }

  /**
   * Forces cleanup of any existing sessions on the page
   * Used when multiple sessions are detected to prevent conflicts
   */
  static async forceCleanupExistingSessions() {
    console.log('Force cleaning up any existing typing sessions...');
    
    try {
      // Clean up global session reference
      if (window.typingPracticeActiveSession) {
        const existingSession = window.typingPracticeActiveSession;
        if (existingSession && typeof existingSession.cleanup === 'function') {
          await existingSession.cleanup();
        }
        window.typingPracticeActiveSession = null;
      }
      
      // Remove any remaining DOM elements
      const elementsToRemove = [
        '#typing-practice-overlay',
        '#typing-practice-styles',
        '.typing-hints-panel',
        '.typing-practice-selection-indicator',
        '[id^="typing-practice-"]',
        '[class*="typing-practice"]'
      ];
      
      elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      });
      
      // Reset body styles that might have been modified
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Clear any selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      
      console.log('Force cleanup of existing sessions completed');
      
    } catch (error) {
      console.error('Error during force cleanup of existing sessions:', error);
    }
  }

  /**
   * Validates the current session state and recovers from inconsistencies
   * @returns {boolean} True if session is valid and consistent
   */
  validateSessionState() {
    if (!this.isActive) {
      return false;
    }

    try {
      // Check if required DOM elements still exist
      const overlay = document.getElementById('typing-practice-overlay');
      if (!overlay) {
        console.warn('Session overlay missing, session may be corrupted');
        return false;
      }

      // Check if original content still exists (skip if typing interface is active)
      if (this.selectedText && this.selectedText.parentElement && !this.typingInterface?.isActive()) {
        if (!document.contains(this.selectedText.parentElement)) {
          console.warn('Original content element no longer exists in DOM');
          return false;
        }
      }

      // Check if session components are still functional
      if (this.typingInterface && !this.typingInterface.isInitialized) {
        console.warn('Typing interface is no longer initialized');
        return false;
      }

      // Validate content hasn't changed significantly
      if (this.originalContentHash) {
        const currentHash = this.createContentHash();
        if (currentHash !== this.originalContentHash) {
          console.warn('Content has changed since session started');
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Error validating session state:', error);
      return false;
    }
  }

  /**
   * Attempts to recover from session state inconsistencies
   * @returns {boolean} True if recovery was successful
   */
  async attemptSessionRecovery() {
    console.log('Attempting session recovery...');

    try {
      // First, validate what we can recover
      const canRecover = this.assessRecoveryPossibility();
      
      if (!canRecover) {
        console.log('Session cannot be recovered, ending session');
        await this.endSession('recovery_failed');
        return false;
      }

      // Try to restore missing components
      if (!document.getElementById('typing-practice-overlay') && this.typingInterface) {
        console.log('Attempting to restore typing interface...');
        this.typingInterface.renderTypingOverlay();
      }

      if (!document.querySelector('.typing-hints-panel') && this.hintsUI && this.metricsCalculator) {
        console.log('Attempting to restore hints UI...');
        this.hintsUI.initialize(this.metricsCalculator);
        
        // Apply saved visibility setting
        const hintsVisible = this.settingsManager ? 
          this.settingsManager.getHintsVisibility() : true;
        
        if (hintsVisible) {
          this.hintsUI.show();
        }
      }

      // Re-validate after recovery attempt
      const isValid = this.validateSessionState();
      
      if (isValid) {
        console.log('Session recovery successful');
        return true;
      } else {
        console.log('Session recovery failed, ending session');
        await this.endSession('recovery_failed');
        return false;
      }

    } catch (error) {
      console.error('Error during session recovery:', error);
      await this.endSession('recovery_error');
      return false;
    }
  }

  /**
   * Assesses whether session recovery is possible
   * @returns {boolean} True if recovery might be possible
   */
  assessRecoveryPossibility() {
    // Check if we have minimum required data
    if (!this.selectedText || !this.formattedContent) {
      return false;
    }

    // Check if original content element still exists
    if (this.selectedText.parentElement && 
        !document.contains(this.selectedText.parentElement)) {
      return false;
    }

    // Check if we have essential components
    if (!this.metricsCalculator) {
      return false;
    }

    return true;
  }

  /**
   * Handles page visibility changes (tab switching, minimizing)
   */
  handleVisibilityChange() {
    if (!this.isActive) {
      return;
    }

    if (document.hidden) {
      // Page became hidden, pause metrics if needed
      if (this.metricsCalculator && typeof this.metricsCalculator.pauseSession === 'function') {
        this.metricsCalculator.pauseSession();
      }
      console.log('Typing session paused due to page visibility change');
    } else {
      // Page became visible again, resume metrics
      if (this.metricsCalculator && typeof this.metricsCalculator.resumeSession === 'function') {
        this.metricsCalculator.resumeSession();
      }
      
      // Validate session state after returning to page
      const isValid = this.validateSessionState();
      if (!isValid) {
        console.warn('Session state invalid after visibility change, attempting recovery');
        this.attemptSessionRecovery();
      } else {
        console.log('Typing session resumed after page visibility change');
      }
    }
  }

  /**
   * Sets up page visibility change monitoring
   */
  setupVisibilityMonitoring() {
    const visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', visibilityHandler);
    
    // Store for cleanup
    this.cleanupCallbacks.push(() => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    });
  }

  /**
   * Handles page unload events to ensure proper cleanup
   */
  handlePageUnload() {
    if (this.isActive) {
      console.log('Page unloading, performing emergency cleanup');
      
      // Perform synchronous cleanup for critical elements
      try {
        // Save current progress if possible
        if (this.metricsCalculator) {
          const metrics = this.metricsCalculator.getSessionSummary();
          console.log('Final session metrics before unload:', metrics);
        }
        
        // Remove DOM elements
        const overlay = document.getElementById('typing-practice-overlay');
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        
        // Clear global references
        this.unregisterGlobalSession();
        
      } catch (error) {
        console.error('Error during page unload cleanup:', error);
      }
    }
  }

  /**
   * Sets up page unload monitoring
   */
  setupUnloadMonitoring() {
    const unloadHandler = () => this.handlePageUnload();
    
    // Use both beforeunload and unload for better coverage
    window.addEventListener('beforeunload', unloadHandler);
    window.addEventListener('unload', unloadHandler);
    
    // Store for cleanup
    this.cleanupCallbacks.push(() => {
      window.removeEventListener('beforeunload', unloadHandler);
      window.removeEventListener('unload', unloadHandler);
    });
  }

  /**
   * Generates a unique session ID
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    return 'typing-session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Comprehensive cleanup of all session components and state
   */
  async cleanup() {
    console.log('Starting TypingSession cleanup...');
    
    try {
      // Mark session as inactive immediately
      this.isActive = false;
      
      // Stop content monitoring
      if (this.contentObserver) {
        this.contentObserver.disconnect();
        this.contentObserver = null;
      }
      
      // Cleanup input processor
      if (this.inputProcessor) {
        this.inputProcessor.cleanup();
        this.inputProcessor = null;
      }
      
      // Cleanup typing interface
      if (this.typingInterface) {
        this.typingInterface.cleanup();
        this.typingInterface = null;
      }
      
      // Cleanup hints UI
      if (this.hintsUI) {
        this.hintsUI.cleanup();
        this.hintsUI = null;
      }
      
      // Cleanup metrics calculator
      if (this.metricsCalculator) {
        // No specific cleanup needed for metrics calculator
        this.metricsCalculator = null;
      }
      
      // Run custom cleanup callbacks
      for (const callback of this.cleanupCallbacks) {
        try {
          callback();
        } catch (error) {
          console.warn('Error in cleanup callback:', error);
        }
      }
      this.cleanupCallbacks = [];
      
      // Restore original state
      await this.restoreOriginalState();
      
      // Unregister global session
      this.unregisterGlobalSession();
      
      // Clear session data
      this.selectedText = null;
      this.formattedContent = null;
      this.originalState = null;
      this.errorRecoveryData = null;
      this.currentPosition = 0;
      this.sessionLock = false;
      
      console.log('TypingSession cleanup completed successfully');
      
    } catch (error) {
      console.error('Error during TypingSession cleanup:', error);
      // Force cleanup even if errors occur
      await this.forceCleanup();
    }
  }

  /**
   * Force cleanup when normal cleanup fails
   */
  async forceCleanup() {
    console.warn('Performing force cleanup of TypingSession');
    
    try {
      // Remove any remaining DOM elements
      const overlay = document.getElementById('typing-practice-overlay');
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      
      const styles = document.getElementById('typing-practice-styles');
      if (styles && styles.parentNode) {
        styles.parentNode.removeChild(styles);
      }
      
      const hints = document.querySelector('.typing-hints-panel');
      if (hints && hints.parentNode) {
        hints.parentNode.removeChild(hints);
      }
      
      // Reset body styles
      document.body.style.cursor = '';
      
      // Clear global references
      this.unregisterGlobalSession();
      
      // Mark as inactive
      this.isActive = false;
      this.sessionLock = false;
      
    } catch (error) {
      console.error('Error during force cleanup:', error);
    }
  }

  /**
   * Gets current session status
   * @returns {Object} Session status information
   */
  getStatus() {
    return {
      id: this.id,
      isActive: this.isActive,
      startTime: this.startTime,
      currentPosition: this.currentPosition,
      hasTypingInterface: !!this.typingInterface,
      hasInputProcessor: !!this.inputProcessor,
      hasMetricsCalculator: !!this.metricsCalculator,
      hasHintsUI: !!this.hintsUI,
      sessionLock: this.sessionLock
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TypingSession;
}