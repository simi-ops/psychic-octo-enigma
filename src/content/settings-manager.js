/**
 * SettingsManager class - handles extension settings persistence and retrieval
 * Implements requirements 3.5 for storing hint visibility preferences
 */
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      hintsVisible: true,
      skipDifficultChars: false,
      highlightColor: '#4CAF50',
      errorColor: '#f44336',
      completedColor: '#2196F3',
      updateFrequency: 500,
      autoHideHints: false,
      showKeyboardShortcuts: true,
      showTypingMetrics: true
    };
    
    this.currentSettings = { ...this.defaultSettings };
    this.isLoaded = false;
  }

  /**
   * Loads settings from chrome storage
   * @returns {Promise<Object>} Current settings object
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('typingPracticeSettings');
      
      if (result.typingPracticeSettings) {
        // Merge with defaults to ensure all properties exist
        this.currentSettings = {
          ...this.defaultSettings,
          ...result.typingPracticeSettings
        };
      } else {
        // First time - save defaults
        await this.saveSettings();
      }
      
      this.isLoaded = true;
      console.log('SettingsManager: Settings loaded', this.currentSettings);
      
      return this.currentSettings;
    } catch (error) {
      console.error('SettingsManager: Error loading settings', error);
      this.currentSettings = { ...this.defaultSettings };
      this.isLoaded = true;
      return this.currentSettings;
    }
  }

  /**
   * Saves current settings to chrome storage
   * @returns {Promise<boolean>} Success status
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        typingPracticeSettings: this.currentSettings
      });
      
      console.log('SettingsManager: Settings saved', this.currentSettings);
      return true;
    } catch (error) {
      console.error('SettingsManager: Error saving settings', error);
      return false;
    }
  }

  /**
   * Gets a specific setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value or undefined if not found
   */
  getSetting(key) {
    return this.currentSettings[key];
  }

  /**
   * Sets a specific setting value and saves to storage
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {Promise<boolean>} Success status
   */
  async setSetting(key, value) {
    if (this.currentSettings.hasOwnProperty(key)) {
      this.currentSettings[key] = value;
      return await this.saveSettings();
    } else {
      console.warn('SettingsManager: Unknown setting key:', key);
      return false;
    }
  }

  /**
   * Updates multiple settings at once
   * @param {Object} settings - Object with setting key-value pairs
   * @returns {Promise<boolean>} Success status
   */
  async updateSettings(settings) {
    let hasChanges = false;
    
    Object.entries(settings).forEach(([key, value]) => {
      if (this.currentSettings.hasOwnProperty(key)) {
        this.currentSettings[key] = value;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      return await this.saveSettings();
    }
    
    return true;
  }

  /**
   * Resets all settings to defaults
   * @returns {Promise<boolean>} Success status
   */
  async resetSettings() {
    this.currentSettings = { ...this.defaultSettings };
    return await this.saveSettings();
  }

  /**
   * Gets all current settings
   * @returns {Object} Current settings object
   */
  getAllSettings() {
    return { ...this.currentSettings };
  }

  /**
   * Checks if settings are loaded
   * @returns {boolean} True if settings are loaded
   */
  isSettingsLoaded() {
    return this.isLoaded;
  }

  /**
   * Gets hint visibility setting
   * @returns {boolean} True if hints should be visible
   */
  getHintsVisibility() {
    return this.getSetting('hintsVisible');
  }

  /**
   * Sets hint visibility setting
   * @param {boolean} visible - Whether hints should be visible
   * @returns {Promise<boolean>} Success status
   */
  async setHintsVisibility(visible) {
    return await this.setSetting('hintsVisible', visible);
  }

  /**
   * Toggles hint visibility setting
   * @returns {Promise<boolean>} New visibility state
   */
  async toggleHintsVisibility() {
    const currentVisibility = this.getHintsVisibility();
    const newVisibility = !currentVisibility;
    await this.setHintsVisibility(newVisibility);
    return newVisibility;
  }

  /**
   * Gets typing interface colors
   * @returns {Object} Color settings object
   */
  getColors() {
    return {
      highlight: this.getSetting('highlightColor'),
      error: this.getSetting('errorColor'),
      completed: this.getSetting('completedColor')
    };
  }

  /**
   * Sets typing interface colors
   * @param {Object} colors - Color settings object
   * @returns {Promise<boolean>} Success status
   */
  async setColors(colors) {
    const updates = {};
    
    if (colors.highlight) updates.highlightColor = colors.highlight;
    if (colors.error) updates.errorColor = colors.error;
    if (colors.completed) updates.completedColor = colors.completed;
    
    return await this.updateSettings(updates);
  }

  /**
   * Gets metrics update frequency
   * @returns {number} Update frequency in milliseconds
   */
  getUpdateFrequency() {
    return this.getSetting('updateFrequency');
  }

  /**
   * Sets metrics update frequency
   * @param {number} frequency - Update frequency in milliseconds
   * @returns {Promise<boolean>} Success status
   */
  async setUpdateFrequency(frequency) {
    // Ensure frequency is within reasonable bounds
    const clampedFrequency = Math.max(100, Math.min(2000, frequency));
    return await this.setSetting('updateFrequency', clampedFrequency);
  }

  /**
   * Listens for storage changes and updates current settings
   */
  startStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.typingPracticeSettings) {
        const newSettings = changes.typingPracticeSettings.newValue;
        if (newSettings) {
          this.currentSettings = {
            ...this.defaultSettings,
            ...newSettings
          };
          console.log('SettingsManager: Settings updated from storage', this.currentSettings);
          
          // Dispatch custom event for other components to listen to
          document.dispatchEvent(new CustomEvent('typingPracticeSettingsChanged', {
            detail: this.currentSettings
          }));
        }
      }
    });
  }

  /**
   * Exports settings for backup
   * @returns {string} JSON string of current settings
   */
  exportSettings() {
    return JSON.stringify(this.currentSettings, null, 2);
  }

  /**
   * Imports settings from backup
   * @param {string} settingsJson - JSON string of settings
   * @returns {Promise<boolean>} Success status
   */
  async importSettings(settingsJson) {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // Validate imported settings
      const validSettings = {};
      Object.keys(this.defaultSettings).forEach(key => {
        if (importedSettings.hasOwnProperty(key)) {
          validSettings[key] = importedSettings[key];
        }
      });
      
      if (Object.keys(validSettings).length > 0) {
        await this.updateSettings(validSettings);
        return true;
      } else {
        console.warn('SettingsManager: No valid settings found in import');
        return false;
      }
    } catch (error) {
      console.error('SettingsManager: Error importing settings', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}