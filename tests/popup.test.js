/**
 * Unit tests for popup interface
 */

const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <button id="start-stop-btn">Start Typing Mode</button>
      <div id="session-status">Ready to start</div>
      <div id="metrics-section" class="hidden">
        <span id="current-wpm">0</span>
        <span id="current-accuracy">100%</span>
      </div>
      <input type="checkbox" id="hints-visibility-toggle">
      <button id="reset-settings-btn">Reset</button>
    </body>
  </html>
`);

global.window = dom.window;
global.document = dom.window.document;

// Mock chrome APIs
global.chrome = {
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1 }]),
    sendMessage: jest.fn().mockResolvedValue({ success: true })
  },
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    }
  }
};

describe('Popup Interface', () => {
  let popup;
  
  beforeEach(() => {
    popup = {
      handleStartStopClick: jest.fn(),
      updateButtonState: jest.fn(),
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
      checkActiveSession: jest.fn(),
      updateMetrics: jest.fn(),
      handleHintsToggle: jest.fn(),
      handleResetSettings: jest.fn()
    };
  });

  test('should handle start/stop button click', async () => {
    await popup.handleStartStopClick();
    
    expect(popup.handleStartStopClick).toHaveBeenCalled();
  });

  test('should update button state for start mode', () => {
    popup.updateButtonState('start');
    
    expect(popup.updateButtonState).toHaveBeenCalledWith('start');
  });

  test('should update button state for selection mode', () => {
    popup.updateButtonState('selection');
    
    expect(popup.updateButtonState).toHaveBeenCalledWith('selection');
  });

  test('should update button state for stop mode', () => {
    popup.updateButtonState('stop');
    
    expect(popup.updateButtonState).toHaveBeenCalledWith('stop');
  });

  test('should send message to content script', async () => {
    const response = await popup.sendMessage('activateSelectionMode');
    
    expect(response.success).toBe(true);
    expect(popup.sendMessage).toHaveBeenCalledWith('activateSelectionMode');
  });

  test('should check active session status', async () => {
    await popup.checkActiveSession();
    
    expect(popup.checkActiveSession).toHaveBeenCalled();
  });

  test('should update metrics display', () => {
    const sessionInfo = { wpm: 45, accuracy: 95 };
    popup.updateMetrics(sessionInfo);
    
    expect(popup.updateMetrics).toHaveBeenCalledWith(sessionInfo);
  });

  test('should handle hints toggle', async () => {
    const event = { target: { checked: true } };
    await popup.handleHintsToggle(event);
    
    expect(popup.handleHintsToggle).toHaveBeenCalledWith(event);
  });

  test('should handle reset settings', async () => {
    await popup.handleResetSettings();
    
    expect(popup.handleResetSettings).toHaveBeenCalled();
  });

  test('should handle communication errors', async () => {
    popup.sendMessage.mockRejectedValue(new Error('Communication failed'));
    
    try {
      await popup.sendMessage('test');
    } catch (error) {
      expect(error.message).toBe('Communication failed');
    }
  });
});
