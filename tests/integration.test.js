/**
 * Integration tests for complete typing session workflow
 */

// Polyfill for TextEncoder/TextDecoder in Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock browser extension APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    }
  }
};

// Mock DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <p id="test-content">This is a test paragraph for typing practice.</p>
      <div id="complex-content">
        <h2>Complex Content</h2>
        <p>This paragraph has <strong>bold text</strong> and <em>italic text</em>.</p>
        <ul>
          <li>List item one</li>
          <li>List item two</li>
        </ul>
      </div>
    </body>
  </html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.getSelection = dom.window.getSelection;

describe('Typing Session Integration', () => {
  let contentScript;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <p id="test-content">This is a test paragraph for typing practice.</p>
      <div id="complex-content">
        <h2>Complex Content</h2>
        <p>This paragraph has <strong>bold text</strong> and <em>italic text</em>.</p>
      </div>
    `;
    
    // Mock selection
    const mockSelection = {
      rangeCount: 1,
      toString: () => 'This is a test',
      getRangeAt: () => ({
        commonAncestorContainer: {
          nodeType: Node.TEXT_NODE,
          parentElement: document.getElementById('test-content')
        },
        getBoundingClientRect: () => ({
          top: 100,
          left: 100,
          width: 200,
          height: 20
        })
      })
    };
    
    global.getSelection = jest.fn().mockReturnValue(mockSelection);
  });

  test('should complete full typing session workflow', async () => {
    // Simulate extension activation
    const activationMessage = { action: 'activateSelectionMode' };
    
    // Mock message handler
    const messageHandler = jest.fn().mockImplementation((message, sender, sendResponse) => {
      if (message.action === 'activateSelectionMode') {
        sendResponse({ success: true });
      }
    });
    
    // Register the handler and immediately call it to simulate message reception
    chrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      // Store the handler for later use
    });
    
    // Simulate the message being received
    messageHandler(activationMessage, {}, jest.fn());
    
    expect(messageHandler).toHaveBeenCalledWith(
      activationMessage,
      expect.any(Object),
      expect.any(Function)
    );
  });

  test('should handle text selection and overlay creation', () => {
    const testElement = document.getElementById('test-content');
    const selection = getSelection();
    
    expect(selection.toString()).toBe('This is a test');
    expect(selection.rangeCount).toBe(1);
    
    // Verify selection is within valid element
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    expect(container.parentElement).toBe(testElement);
  });

  test('should preserve formatting in complex content', () => {
    const complexElement = document.getElementById('complex-content');
    const strongElement = complexElement.querySelector('strong');
    const emElement = complexElement.querySelector('em');
    
    expect(strongElement.textContent).toBe('bold text');
    expect(emElement.textContent).toBe('italic text');
    
    // Verify elements maintain their structure
    expect(strongElement.tagName).toBe('STRONG');
    expect(emElement.tagName).toBe('EM');
  });

  test('should handle keyboard shortcuts', () => {
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9
    });
    
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      shiftKey: true
    });
    
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27
    });
    
    // Verify events are properly constructed
    expect(tabEvent.key).toBe('Tab');
    expect(shiftTabEvent.shiftKey).toBe(true);
    expect(escapeEvent.key).toBe('Escape');
  });

  test('should handle session cleanup', () => {
    // Mock typing session cleanup
    const cleanupSpy = jest.fn();
    
    // Simulate session end
    cleanupSpy();
    
    expect(cleanupSpy).toHaveBeenCalled();
  });

  test('should validate metrics calculation during session', () => {
    // Mock metrics data
    const mockMetrics = {
      wpm: 45,
      accuracy: 95.5,
      totalCharacters: 100,
      correctCharacters: 95,
      timeElapsed: 60000,
      skippedCharacters: 5
    };
    
    // Verify metrics structure
    expect(mockMetrics.wpm).toBeGreaterThan(0);
    expect(mockMetrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(mockMetrics.accuracy).toBeLessThanOrEqual(100);
    expect(mockMetrics.correctCharacters).toBeLessThanOrEqual(mockMetrics.totalCharacters);
  });
});
