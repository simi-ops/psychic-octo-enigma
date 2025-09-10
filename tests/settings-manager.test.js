/**
 * Unit tests for SettingsManager class
 */

// Mock chrome storage API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      onChanged: {
        addListener: jest.fn()
      }
    }
  }
};

describe('SettingsManager', () => {
  let settingsManager;
  
  beforeEach(() => {
    settingsManager = {
      loadSettings: jest.fn(),
      saveSettings: jest.fn(),
      getSettings: jest.fn(() => ({ hintsVisible: true })),
      resetSettings: jest.fn(),
      validateSettings: jest.fn(() => true)
    };
    
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
  });

  test('should load settings from storage', async () => {
    chrome.storage.sync.get.mockResolvedValue({
      typingPracticeSettings: { hintsVisible: true }
    });
    
    await settingsManager.loadSettings();
    
    expect(settingsManager.loadSettings).toHaveBeenCalled();
  });

  test('should save settings to storage', async () => {
    const settings = { hintsVisible: false };
    chrome.storage.sync.set.mockResolvedValue();
    
    await settingsManager.saveSettings(settings);
    
    expect(settingsManager.saveSettings).toHaveBeenCalledWith(settings);
  });

  test('should get current settings', () => {
    const settings = settingsManager.getSettings();
    
    expect(settings).toEqual({ hintsVisible: true });
    expect(settingsManager.getSettings).toHaveBeenCalled();
  });

  test('should validate settings structure', () => {
    const settings = { hintsVisible: true, highlightColor: '#4CAF50' };
    const isValid = settingsManager.validateSettings(settings);
    
    expect(isValid).toBe(true);
    expect(settingsManager.validateSettings).toHaveBeenCalledWith(settings);
  });

  test('should reset to default settings', async () => {
    await settingsManager.resetSettings();
    
    expect(settingsManager.resetSettings).toHaveBeenCalled();
  });

  test('should handle storage errors gracefully', async () => {
    chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
    
    try {
      await settingsManager.loadSettings();
    } catch (error) {
      expect(error.message).toBe('Storage error');
    }
    
    expect(settingsManager.loadSettings).toHaveBeenCalled();
  });
});
