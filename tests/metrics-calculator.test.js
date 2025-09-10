/**
 * Unit tests for MetricsCalculator functionality
 */

const MetricsCalculator = require('../src/content/metrics-calculator.js');

describe('MetricsCalculator', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new MetricsCalculator();
  });

  describe('WPM calculation', () => {
    test('should calculate correct WPM for basic typing', () => {
      calculator.startSession();
      
      // Mock the start time to be 1 minute ago
      const oneMinuteAgo = Date.now() - 60000;
      calculator.session.startTime = new Date(oneMinuteAgo);
      
      // Simulate typing 5 words (25 characters) in 1 minute
      for (let i = 0; i < 25; i++) {
        calculator.recordKeystroke(true);
      }
      
      const wpm = calculator.calculateWPM();
      expect(wpm).toBe(5); // 25 chars / 5 chars per word = 5 WPM
    });

    test('should return 0 WPM for no typing', () => {
      calculator.startSession();
      const wpm = calculator.calculateWPM();
      expect(wpm).toBe(0);
    });

    test('should handle very short time periods', () => {
      calculator.startSession();
      calculator.recordKeystroke(true);
      
      // Very short time elapsed
      const wpm = calculator.calculateWPM();
      expect(wpm).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Accuracy calculation', () => {
    test('should calculate 100% accuracy for all correct keystrokes', () => {
      calculator.startSession();
      
      for (let i = 0; i < 10; i++) {
        calculator.recordKeystroke(true);
      }
      
      const accuracy = calculator.calculateAccuracy();
      expect(accuracy).toBe(100);
    });

    test('should calculate 0% accuracy for all incorrect keystrokes', () => {
      calculator.startSession();
      
      for (let i = 0; i < 10; i++) {
        calculator.recordKeystroke(false);
      }
      
      const accuracy = calculator.calculateAccuracy();
      expect(accuracy).toBe(0);
    });

    test('should calculate 50% accuracy for half correct keystrokes', () => {
      calculator.startSession();
      
      for (let i = 0; i < 5; i++) {
        calculator.recordKeystroke(true);
        calculator.recordKeystroke(false);
      }
      
      const accuracy = calculator.calculateAccuracy();
      expect(accuracy).toBe(50);
    });

    test('should return 100% accuracy for no keystrokes', () => {
      calculator.startSession();
      const accuracy = calculator.calculateAccuracy();
      expect(accuracy).toBe(100);
    });
  });

  describe('Skip tracking', () => {
    test('should exclude skipped characters from accuracy', () => {
      calculator.startSession();
      
      calculator.recordKeystroke(true);
      calculator.recordKeystroke(false);
      calculator.recordSkip('difficult');
      calculator.recordSkip('difficult');
      
      const accuracy = calculator.calculateAccuracy();
      expect(accuracy).toBe(50); // Only counts the 2 actual keystrokes
    });

    test('should track skip reasons', () => {
      calculator.startSession();
      
      calculator.recordSkip('difficult');
      calculator.recordSkip('paragraph');
      
      const summary = calculator.getSessionSummary();
      expect(summary.skippedCharacters).toBe(2);
    });
  });

  describe('Session summary', () => {
    test('should provide complete session metrics', () => {
      calculator.startSession();
      
      // Mock start time to ensure measurable elapsed time
      const startTime = Date.now() - 1000; // 1 second ago
      calculator.session.startTime = new Date(startTime);
      
      calculator.recordKeystroke(true);
      calculator.recordKeystroke(true);
      calculator.recordKeystroke(false);
      calculator.recordSkip('difficult');
      
      const summary = calculator.getSessionSummary();
      
      expect(summary.totalCharacters).toBe(3);
      expect(summary.correctCharacters).toBe(2);
      expect(summary.skippedCharacters).toBe(1);
      expect(summary.accuracy).toBe(66.67);
      expect(summary.wpm).toBeGreaterThanOrEqual(0);
      expect(summary.timeElapsed).toBeGreaterThan(0);
    });
  });
});
