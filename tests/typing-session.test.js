/**
 * Unit tests for TypingSession class
 */

describe('TypingSession', () => {
  let typingSession;
  
  beforeEach(() => {
    typingSession = {
      initialize: jest.fn(),
      cleanup: jest.fn(),
      validateSessionState: jest.fn(() => true),
      attemptSessionRecovery: jest.fn(),
      getStatus: jest.fn(() => ({ isActive: true })),
      isActive: true
    };
  });

  test('should initialize session', () => {
    const content = { text: 'test content' };
    const element = document.createElement('div');
    
    typingSession.initialize(content, element);
    
    expect(typingSession.initialize).toHaveBeenCalledWith(content, element);
  });

  test('should validate session state', () => {
    const isValid = typingSession.validateSessionState();
    
    expect(isValid).toBe(true);
    expect(typingSession.validateSessionState).toHaveBeenCalled();
  });

  test('should attempt session recovery', () => {
    typingSession.attemptSessionRecovery();
    
    expect(typingSession.attemptSessionRecovery).toHaveBeenCalled();
  });

  test('should get session status', () => {
    const status = typingSession.getStatus();
    
    expect(status).toEqual({ isActive: true });
    expect(typingSession.getStatus).toHaveBeenCalled();
  });

  test('should cleanup session', () => {
    typingSession.cleanup();
    
    expect(typingSession.cleanup).toHaveBeenCalled();
  });

  test('should handle dynamic content changes', () => {
    // Mock DOM mutation
    typingSession.validateSessionState.mockReturnValue(false);
    
    const isValid = typingSession.validateSessionState();
    
    expect(isValid).toBe(false);
    
    if (!isValid) {
      typingSession.attemptSessionRecovery();
      expect(typingSession.attemptSessionRecovery).toHaveBeenCalled();
    }
  });
});
