/**
 * MetricsCalculator class - handles typing metrics calculation and tracking
 * Implements requirements 3.1, 5.1, 5.2, 2.4, 5.3, 5.4 for typing speed, accuracy, and skip tracking
 */
class MetricsCalculator {
  constructor() {
    this.session = null;
    this.isSessionActive = false;
  }

  /**
   * Starts a new typing session and initializes timing and counters
   * Implements requirement 5.1 for session initialization
   */
  startSession() {
    this.session = {
      startTime: new Date(),
      endTime: null,
      totalCharacters: 0,
      correctCharacters: 0,
      incorrectCharacters: 0,
      skippedCharacters: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      incorrectKeystrokes: 0,
      skips: [],
      errors: [],
      currentWPM: 0,
      currentAccuracy: 100,
      lastUpdateTime: new Date(),
      keystrokeHistory: []
    };
    
    this.isSessionActive = true;
    
    console.log('MetricsCalculator: New typing session started');
    return this.session;
  }

  /**
   * Records a keystroke and tracks correct/incorrect inputs
   * Implements requirement 5.1 and 5.2 for keystroke tracking
   * @param {boolean} correct - Whether the keystroke was correct
   * @param {string} expectedChar - The expected character
   * @param {string} actualChar - The actual character typed
   * @param {number} position - Position in text where keystroke occurred
   */
  recordKeystroke(correct, expectedChar = '', actualChar = '', position = 0) {
    if (!this.isSessionActive || !this.session) {
      console.warn('MetricsCalculator: Cannot record keystroke - no active session');
      return;
    }

    const timestamp = new Date();
    
    // Record keystroke in history
    const keystroke = {
      timestamp: timestamp,
      correct: correct,
      expectedChar: expectedChar,
      actualChar: actualChar,
      position: position,
      timeFromStart: timestamp - this.session.startTime
    };
    
    this.session.keystrokeHistory.push(keystroke);
    this.session.totalKeystrokes++;
    
    if (correct) {
      this.session.correctKeystrokes++;
      this.session.correctCharacters++;
    } else {
      this.session.incorrectKeystrokes++;
      this.session.incorrectCharacters++;
      
      // Record error details
      this.session.errors.push({
        position: position,
        expectedChar: expectedChar,
        actualChar: actualChar,
        timestamp: timestamp
      });
    }
    
    // Update total characters processed
    this.session.totalCharacters = this.session.correctCharacters + this.session.incorrectCharacters;
    
    // Update real-time metrics
    this.updateRealTimeMetrics();
    
    console.log('MetricsCalculator: Keystroke recorded', {
      correct: correct,
      position: position,
      totalKeystrokes: this.session.totalKeystrokes,
      accuracy: this.session.currentAccuracy
    });
  }

  /**
   * Records a skipped character and tracks skip reason
   * Implements requirement 2.4, 5.3, 5.4 for skip tracking
   * @param {string} reason - Reason for skip ('tab', 'shift-tab', 'difficult-char')
   * @param {number} position - Position in text that was skipped
   * @param {string} character - Character that was skipped
   * @param {number} count - Number of characters skipped (default 1)
   */
  recordSkip(reason, position = 0, character = '', count = 1) {
    if (!this.isSessionActive || !this.session) {
      console.warn('MetricsCalculator: Cannot record skip - no active session');
      return;
    }

    const timestamp = new Date();
    
    // Record skip details
    const skip = {
      reason: reason,
      position: position,
      character: character,
      count: count,
      timestamp: timestamp,
      timeFromStart: timestamp - this.session.startTime
    };
    
    this.session.skips.push(skip);
    this.session.skippedCharacters += count;
    
    console.log('MetricsCalculator: Skip recorded', {
      reason: reason,
      position: position,
      count: count,
      totalSkipped: this.session.skippedCharacters
    });
  }

  /**
   * Calculates real-time words per minute
   * Implements requirement 3.1 and 5.1 for WPM calculation
   * @returns {number} Current words per minute
   */
  calculateWPM() {
    if (!this.isSessionActive || !this.session) {
      return 0;
    }

    const currentTime = new Date();
    const timeElapsedMinutes = (currentTime - this.session.startTime) / (1000 * 60);
    
    // Avoid division by zero for very short sessions
    if (timeElapsedMinutes <= 0) {
      return 0;
    }
    
    // Calculate WPM based on correct characters only
    // Standard: 5 characters = 1 word
    const wordsTyped = this.session.correctCharacters / 5;
    const wpm = Math.round(wordsTyped / timeElapsedMinutes);
    
    this.session.currentWPM = wpm;
    return wpm;
  }

  /**
   * Calculates typing accuracy percentage
   * Implements requirement 5.2 for accuracy calculation
   * Excludes skipped characters from accuracy calculations per requirement 5.3
   * @returns {number} Accuracy percentage (0-100)
   */
  calculateAccuracy() {
    if (!this.isSessionActive || !this.session) {
      return 100;
    }

    // Calculate accuracy excluding skipped characters (requirement 5.3)
    const totalTypedCharacters = this.session.correctCharacters + this.session.incorrectCharacters;
    
    if (totalTypedCharacters === 0) {
      return 100;
    }
    
    const accuracy = (this.session.correctCharacters / totalTypedCharacters) * 100;
    const roundedAccuracy = Math.round(accuracy * 100) / 100; // Round to 2 decimal places
    
    this.session.currentAccuracy = roundedAccuracy;
    return roundedAccuracy;
  }

  /**
   * Updates real-time metrics (WPM and accuracy)
   * Called after each keystroke for live updates
   */
  updateRealTimeMetrics() {
    if (!this.isSessionActive || !this.session) {
      return;
    }

    this.session.lastUpdateTime = new Date();
    this.calculateWPM();
    this.calculateAccuracy();
  }

  /**
   * Gets comprehensive session summary with final performance metrics
   * Implements requirement 5.4 for session summary
   * @returns {Object} Complete session metrics summary
   */
  getSessionSummary() {
    if (!this.session) {
      return null;
    }

    // End the session if it's still active
    if (this.isSessionActive) {
      this.endSession();
    }

    const totalTimeSeconds = (this.session.endTime - this.session.startTime) / 1000;
    const totalTimeMinutes = totalTimeSeconds / 60;
    
    // Calculate final metrics
    const finalWPM = totalTimeMinutes > 0 ? Math.round((this.session.correctCharacters / 5) / totalTimeMinutes) : 0;
    const finalAccuracy = this.calculateFinalAccuracy();
    
    // Calculate additional statistics
    const errorRate = this.session.totalCharacters > 0 ? 
      (this.session.incorrectCharacters / this.session.totalCharacters) * 100 : 0;
    
    const skipRate = (this.session.totalCharacters + this.session.skippedCharacters) > 0 ? 
      (this.session.skippedCharacters / (this.session.totalCharacters + this.session.skippedCharacters)) * 100 : 0;

    const summary = {
      // Time metrics
      startTime: this.session.startTime,
      endTime: this.session.endTime,
      timeElapsed: Math.round(totalTimeSeconds),
      totalTimeMinutes: Math.round(totalTimeMinutes * 100) / 100,
      
      // Character metrics
      totalCharacters: this.session.totalCharacters,
      correctCharacters: this.session.correctCharacters,
      incorrectCharacters: this.session.incorrectCharacters,
      skippedCharacters: this.session.skippedCharacters,
      
      // Keystroke metrics
      totalKeystrokes: this.session.totalKeystrokes,
      correctKeystrokes: this.session.correctKeystrokes,
      incorrectKeystrokes: this.session.incorrectKeystrokes,
      
      // Performance metrics
      wpm: finalWPM,
      accuracy: finalAccuracy,
      errorRate: Math.round(errorRate * 100) / 100,
      skipRate: Math.round(skipRate * 100) / 100,
      
      // Detailed statistics
      errorsCount: this.session.errors.length,
      skipsCount: this.session.skips.length,
      skipsByReason: this.getSkipsByReason(),
      
      // Raw data for analysis
      errors: [...this.session.errors],
      skips: [...this.session.skips],
      keystrokeHistory: [...this.session.keystrokeHistory]
    };

    console.log('MetricsCalculator: Session summary generated', {
      wpm: finalWPM,
      accuracy: finalAccuracy,
      totalTime: totalTimeSeconds,
      totalCharacters: this.session.totalCharacters
    });

    return summary;
  }

  /**
   * Calculates final accuracy excluding skipped characters
   * @returns {number} Final accuracy percentage
   */
  calculateFinalAccuracy() {
    if (!this.session) {
      return 100;
    }

    const totalTypedCharacters = this.session.correctCharacters + this.session.incorrectCharacters;
    
    if (totalTypedCharacters === 0) {
      return 100;
    }
    
    const accuracy = (this.session.correctCharacters / totalTypedCharacters) * 100;
    return Math.round(accuracy * 100) / 100;
  }

  /**
   * Groups skips by reason for analysis
   * @returns {Object} Skip counts grouped by reason
   */
  getSkipsByReason() {
    if (!this.session || !this.session.skips) {
      return {};
    }

    const skipsByReason = {};
    
    this.session.skips.forEach(skip => {
      if (!skipsByReason[skip.reason]) {
        skipsByReason[skip.reason] = {
          count: 0,
          characters: 0
        };
      }
      skipsByReason[skip.reason].count++;
      skipsByReason[skip.reason].characters += skip.count;
    });

    return skipsByReason;
  }

  /**
   * Ends the current session
   */
  endSession() {
    if (!this.isSessionActive || !this.session) {
      return;
    }

    this.session.endTime = new Date();
    this.isSessionActive = false;
    
    console.log('MetricsCalculator: Session ended');
  }

  /**
   * Gets current session metrics for real-time display
   * @returns {Object} Current session metrics
   */
  getCurrentMetrics() {
    if (!this.isSessionActive || !this.session) {
      return {
        wpm: 0,
        accuracy: 100,
        timeElapsed: 0,
        charactersTyped: 0,
        isActive: false
      };
    }

    const currentTime = new Date();
    const timeElapsed = Math.round((currentTime - this.session.startTime) / 1000);

    return {
      wpm: this.session.currentWPM,
      accuracy: this.session.currentAccuracy,
      timeElapsed: timeElapsed,
      charactersTyped: this.session.totalCharacters,
      correctCharacters: this.session.correctCharacters,
      incorrectCharacters: this.session.incorrectCharacters,
      skippedCharacters: this.session.skippedCharacters,
      totalKeystrokes: this.session.totalKeystrokes,
      isActive: this.isSessionActive
    };
  }

  /**
   * Resets the calculator for a new session
   */
  reset() {
    this.session = null;
    this.isSessionActive = false;
    console.log('MetricsCalculator: Reset completed');
  }

  /**
   * Gets session status
   * @returns {boolean} True if session is active
   */
  isActive() {
    return this.isSessionActive;
  }

  /**
   * Gets detailed keystroke statistics for analysis
   * @returns {Object} Keystroke analysis data
   */
  getKeystrokeAnalysis() {
    if (!this.session || !this.session.keystrokeHistory) {
      return null;
    }

    const history = this.session.keystrokeHistory;
    
    if (history.length === 0) {
      return null;
    }

    // Calculate typing speed over time
    const speedOverTime = [];
    const windowSize = 10; // Calculate WPM over 10-keystroke windows
    
    for (let i = windowSize; i < history.length; i++) {
      const windowStart = history[i - windowSize];
      const windowEnd = history[i];
      const timeSpan = (windowEnd.timestamp - windowStart.timestamp) / 1000 / 60; // minutes
      
      if (timeSpan > 0) {
        const correctInWindow = history.slice(i - windowSize, i).filter(k => k.correct).length;
        const wpmInWindow = Math.round((correctInWindow / 5) / timeSpan);
        
        speedOverTime.push({
          position: i,
          wpm: wpmInWindow,
          timestamp: windowEnd.timestamp
        });
      }
    }

    // Calculate error patterns
    const errorsByCharacter = {};
    this.session.errors.forEach(error => {
      const char = error.expectedChar;
      if (!errorsByCharacter[char]) {
        errorsByCharacter[char] = 0;
      }
      errorsByCharacter[char]++;
    });

    return {
      totalKeystrokes: history.length,
      speedOverTime: speedOverTime,
      errorsByCharacter: errorsByCharacter,
      averageKeystrokeInterval: this.calculateAverageKeystrokeInterval(),
      fastestKeystroke: this.findFastestKeystroke(),
      slowestKeystroke: this.findSlowestKeystroke()
    };
  }

  /**
   * Calculates average time between keystrokes
   * @returns {number} Average interval in milliseconds
   */
  calculateAverageKeystrokeInterval() {
    if (!this.session || this.session.keystrokeHistory.length < 2) {
      return 0;
    }

    const history = this.session.keystrokeHistory;
    let totalInterval = 0;
    
    for (let i = 1; i < history.length; i++) {
      totalInterval += history[i].timestamp - history[i - 1].timestamp;
    }

    return Math.round(totalInterval / (history.length - 1));
  }

  /**
   * Finds the fastest keystroke interval
   * @returns {number} Fastest interval in milliseconds
   */
  findFastestKeystroke() {
    if (!this.session || this.session.keystrokeHistory.length < 2) {
      return 0;
    }

    const history = this.session.keystrokeHistory;
    let fastest = Infinity;
    
    for (let i = 1; i < history.length; i++) {
      const interval = history[i].timestamp - history[i - 1].timestamp;
      if (interval < fastest) {
        fastest = interval;
      }
    }

    return fastest === Infinity ? 0 : fastest;
  }

  /**
   * Finds the slowest keystroke interval
   * @returns {number} Slowest interval in milliseconds
   */
  findSlowestKeystroke() {
    if (!this.session || this.session.keystrokeHistory.length < 2) {
      return 0;
    }

    const history = this.session.keystrokeHistory;
    let slowest = 0;
    
    for (let i = 1; i < history.length; i++) {
      const interval = history[i].timestamp - history[i - 1].timestamp;
      if (interval > slowest) {
        slowest = interval;
      }
    }

    return slowest;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetricsCalculator;
}