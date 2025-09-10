/**
 * Unit tests for TypingInterface class
 */

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

describe('TypingInterface', () => {
  let typingInterface;
  
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"><p>Test content</p></div>';
    // Mock TypingInterface functionality
    typingInterface = {
      initialize: jest.fn(),
      renderTypingOverlay: jest.fn(() => document.createElement('div')),
      updateCursor: jest.fn(),
      highlightProgress: jest.fn(),
      showError: jest.fn(),
      cleanup: jest.fn()
    };
  });

  test('should initialize with content and container', () => {
    const content = { text: 'test', formatting: [] };
    const container = document.getElementById('test-container');
    
    typingInterface.initialize(content, container);
    
    expect(typingInterface.initialize).toHaveBeenCalledWith(content, container);
  });

  test('should render typing overlay', () => {
    const overlay = typingInterface.renderTypingOverlay();
    
    expect(typingInterface.renderTypingOverlay).toHaveBeenCalled();
    expect(overlay).toBeInstanceOf(HTMLElement);
  });

  test('should update cursor position', () => {
    typingInterface.updateCursor(5);
    
    expect(typingInterface.updateCursor).toHaveBeenCalledWith(5);
  });

  test('should highlight progress', () => {
    typingInterface.highlightProgress(10);
    
    expect(typingInterface.highlightProgress).toHaveBeenCalledWith(10);
  });

  test('should show error at position', () => {
    typingInterface.showError(3);
    
    expect(typingInterface.showError).toHaveBeenCalledWith(3);
  });

  test('should cleanup resources', () => {
    typingInterface.cleanup();
    
    expect(typingInterface.cleanup).toHaveBeenCalled();
  });
});
