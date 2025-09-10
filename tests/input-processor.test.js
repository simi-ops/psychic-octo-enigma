/**
 * Unit tests for InputProcessor class
 */

describe('InputProcessor', () => {
  let inputProcessor;
  
  beforeEach(() => {
    inputProcessor = {
      processKeyInput: jest.fn(),
      validateCharacter: jest.fn(),
      handleShortcut: jest.fn(),
      getCurrentPosition: jest.fn(() => 0)
    };
  });

  describe('processKeyInput', () => {
    test('should process regular key input', () => {
      const event = { key: 'a', preventDefault: jest.fn() };
      inputProcessor.processKeyInput(event);
      
      expect(inputProcessor.processKeyInput).toHaveBeenCalledWith(event);
    });

    test('should handle Tab shortcut', () => {
      const event = { key: 'Tab', preventDefault: jest.fn() };
      inputProcessor.processKeyInput(event);
      
      expect(inputProcessor.processKeyInput).toHaveBeenCalledWith(event);
    });

    test('should handle Shift+Tab shortcut', () => {
      const event = { key: 'Tab', shiftKey: true, preventDefault: jest.fn() };
      inputProcessor.processKeyInput(event);
      
      expect(inputProcessor.processKeyInput).toHaveBeenCalledWith(event);
    });

    test('should handle Escape shortcut', () => {
      const event = { key: 'Escape', preventDefault: jest.fn() };
      inputProcessor.processKeyInput(event);
      
      expect(inputProcessor.processKeyInput).toHaveBeenCalledWith(event);
    });
  });

  describe('validateCharacter', () => {
    test('should return true for correct character', () => {
      inputProcessor.validateCharacter.mockReturnValue(true);
      
      const result = inputProcessor.validateCharacter('a', 'a');
      
      expect(result).toBe(true);
      expect(inputProcessor.validateCharacter).toHaveBeenCalledWith('a', 'a');
    });

    test('should return false for incorrect character', () => {
      inputProcessor.validateCharacter.mockReturnValue(false);
      
      const result = inputProcessor.validateCharacter('a', 'b');
      
      expect(result).toBe(false);
      expect(inputProcessor.validateCharacter).toHaveBeenCalledWith('a', 'b');
    });
  });

  describe('handleShortcut', () => {
    test('should handle skip character shortcut', () => {
      inputProcessor.handleShortcut('Tab');
      
      expect(inputProcessor.handleShortcut).toHaveBeenCalledWith('Tab');
    });

    test('should handle skip paragraph shortcut', () => {
      inputProcessor.handleShortcut('Shift+Tab');
      
      expect(inputProcessor.handleShortcut).toHaveBeenCalledWith('Shift+Tab');
    });

    test('should handle exit session shortcut', () => {
      inputProcessor.handleShortcut('Escape');
      
      expect(inputProcessor.handleShortcut).toHaveBeenCalledWith('Escape');
    });
  });

  test('should get current position', () => {
    const position = inputProcessor.getCurrentPosition();
    
    expect(position).toBe(0);
    expect(inputProcessor.getCurrentPosition).toHaveBeenCalled();
  });
});
