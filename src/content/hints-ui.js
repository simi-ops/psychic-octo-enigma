/**
 * HintsUI class - manages the floating hints panel for typing speed and shortcuts
 * Implements requirements 3.1, 3.2 for typing speed display and shortcuts reference
 */
class HintsUI {
  constructor() {
    this.hintsPanel = null;
    this.isVisible = true;
    this.metricsCalculator = null;
    this.updateInterval = null;
    this.updateFrequency = 500; // Update every 500ms
  }

  /**
   * Initializes the hints panel and connects to metrics calculator
   * @param {MetricsCalculator} metricsCalculator - Metrics calculator instance
   */
  initialize(metricsCalculator) {
    this.metricsCalculator = metricsCalculator;
    this.createHintsPanel();
    this.startRealTimeUpdates();
    
    console.log('HintsUI: Initialized with metrics calculator');
  }

  /**
   * Creates the floating hints panel showing current WPM and keyboard shortcuts
   * Implements requirements 3.1 and 3.2
   */
  createHintsPanel() {
    // Remove existing panel if it exists
    if (this.hintsPanel) {
      this.cleanup();
    }

    // Create main hints container
    this.hintsPanel = document.createElement('div');
    this.hintsPanel.id = 'typing-practice-hints-panel';
    this.hintsPanel.className = 'typing-hints-panel';
    
    // Create panel header with close button
    const header = document.createElement('div');
    header.className = 'hints-header';
    
    const title = document.createElement('span');
    title.className = 'hints-title';
    title.textContent = 'Typing Practice';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'hints-close-btn';
    closeButton.innerHTML = '×';
    closeButton.title = 'Hide hints panel';
    closeButton.addEventListener('click', () => this.hide());
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create metrics display section
    const metricsSection = document.createElement('div');
    metricsSection.className = 'hints-metrics';
    
    // WPM display
    const wpmContainer = document.createElement('div');
    wpmContainer.className = 'metric-container';
    
    const wpmLabel = document.createElement('span');
    wpmLabel.className = 'metric-label';
    wpmLabel.textContent = 'Speed:';
    
    const wpmValue = document.createElement('span');
    wpmValue.className = 'metric-value wpm-value';
    wpmValue.id = 'hints-wpm-value';
    wpmValue.textContent = '0 WPM';
    
    wpmContainer.appendChild(wpmLabel);
    wpmContainer.appendChild(wpmValue);
    
    // Accuracy display
    const accuracyContainer = document.createElement('div');
    accuracyContainer.className = 'metric-container';
    
    const accuracyLabel = document.createElement('span');
    accuracyLabel.className = 'metric-label';
    accuracyLabel.textContent = 'Accuracy:';
    
    const accuracyValue = document.createElement('span');
    accuracyValue.className = 'metric-value accuracy-value';
    accuracyValue.id = 'hints-accuracy-value';
    accuracyValue.textContent = '100%';
    
    accuracyContainer.appendChild(accuracyLabel);
    accuracyContainer.appendChild(accuracyValue);
    
    // Time elapsed display
    const timeContainer = document.createElement('div');
    timeContainer.className = 'metric-container';
    
    const timeLabel = document.createElement('span');
    timeLabel.className = 'metric-label';
    timeLabel.textContent = 'Time:';
    
    const timeValue = document.createElement('span');
    timeValue.className = 'metric-value time-value';
    timeValue.id = 'hints-time-value';
    timeValue.textContent = '0:00';
    
    timeContainer.appendChild(timeLabel);
    timeContainer.appendChild(timeValue);
    
    metricsSection.appendChild(wpmContainer);
    metricsSection.appendChild(accuracyContainer);
    metricsSection.appendChild(timeContainer);
    
    // Create shortcuts reference section
    const shortcutsSection = document.createElement('div');
    shortcutsSection.className = 'hints-shortcuts';
    
    const shortcutsTitle = document.createElement('div');
    shortcutsTitle.className = 'shortcuts-title';
    shortcutsTitle.textContent = 'Keyboard Shortcuts:';
    
    const shortcutsList = document.createElement('div');
    shortcutsList.className = 'shortcuts-list';
    
    // Define keyboard shortcuts
    const shortcuts = [
      { key: 'Tab', description: 'Skip current character' },
      { key: 'Shift+Tab', description: 'Skip to next paragraph' },
      { key: 'Esc', description: 'End typing session' }
    ];
    
    shortcuts.forEach(shortcut => {
      const shortcutItem = document.createElement('div');
      shortcutItem.className = 'shortcut-item';
      
      const keySpan = document.createElement('span');
      keySpan.className = 'shortcut-key';
      keySpan.textContent = shortcut.key;
      
      const descSpan = document.createElement('span');
      descSpan.className = 'shortcut-desc';
      descSpan.textContent = shortcut.description;
      
      shortcutItem.appendChild(keySpan);
      shortcutItem.appendChild(descSpan);
      shortcutsList.appendChild(shortcutItem);
    });
    
    shortcutsSection.appendChild(shortcutsTitle);
    shortcutsSection.appendChild(shortcutsList);
    
    // Assemble the complete panel
    this.hintsPanel.appendChild(header);
    this.hintsPanel.appendChild(metricsSection);
    this.hintsPanel.appendChild(shortcutsSection);
    
    // Apply styles
    this.applyHintsStyles();
    
    // Add to DOM
    document.body.appendChild(this.hintsPanel);
    
    console.log('HintsUI: Hints panel created and added to DOM');
  }

  /**
   * Applies comprehensive styling to the hints panel
   */
  applyHintsStyles() {
    if (!this.hintsPanel) return;
    
    // Main panel styles
    this.hintsPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: translateY(0);
    `;
    
    // Header styles
    const header = this.hintsPanel.querySelector('.hints-header');
    if (header) {
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
        background: rgba(248, 249, 250, 0.8);
        border-radius: 8px 8px 0 0;
      `;
    }
    
    // Title styles
    const title = this.hintsPanel.querySelector('.hints-title');
    if (title) {
      title.style.cssText = `
        font-weight: 600;
        color: #333;
        font-size: 15px;
      `;
    }
    
    // Close button styles
    const closeBtn = this.hintsPanel.querySelector('.hints-close-btn');
    if (closeBtn) {
      closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        color: #666;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease, color 0.2s ease;
        line-height: 1;
      `;
      
      // Add hover effects
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#f0f0f0';
        closeBtn.style.color = '#333';
      });
      
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'transparent';
        closeBtn.style.color = '#666';
      });
    }
    
    // Metrics section styles
    const metricsSection = this.hintsPanel.querySelector('.hints-metrics');
    if (metricsSection) {
      metricsSection.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid #eee;
      `;
    }
    
    // Metric container styles
    const metricContainers = this.hintsPanel.querySelectorAll('.metric-container');
    metricContainers.forEach(container => {
      container.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      `;
      
      // Remove margin from last container
      if (container === metricContainers[metricContainers.length - 1]) {
        container.style.marginBottom = '0';
      }
    });
    
    // Metric label styles
    const metricLabels = this.hintsPanel.querySelectorAll('.metric-label');
    metricLabels.forEach(label => {
      label.style.cssText = `
        color: #666;
        font-weight: 500;
      `;
    });
    
    // Metric value styles
    const metricValues = this.hintsPanel.querySelectorAll('.metric-value');
    metricValues.forEach(value => {
      value.style.cssText = `
        font-weight: 600;
        color: #333;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      `;
    });
    
    // WPM value special styling
    const wpmValue = this.hintsPanel.querySelector('.wpm-value');
    if (wpmValue) {
      wpmValue.style.color = '#2196F3';
    }
    
    // Accuracy value special styling
    const accuracyValue = this.hintsPanel.querySelector('.accuracy-value');
    if (accuracyValue) {
      accuracyValue.style.color = '#4CAF50';
    }
    
    // Shortcuts section styles
    const shortcutsSection = this.hintsPanel.querySelector('.hints-shortcuts');
    if (shortcutsSection) {
      shortcutsSection.style.cssText = `
        padding: 16px;
      `;
    }
    
    // Shortcuts title styles
    const shortcutsTitle = this.hintsPanel.querySelector('.shortcuts-title');
    if (shortcutsTitle) {
      shortcutsTitle.style.cssText = `
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
        font-size: 13px;
      `;
    }
    
    // Shortcuts list styles
    const shortcutsList = this.hintsPanel.querySelector('.shortcuts-list');
    if (shortcutsList) {
      shortcutsList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 6px;
      `;
    }
    
    // Individual shortcut item styles
    const shortcutItems = this.hintsPanel.querySelectorAll('.shortcut-item');
    shortcutItems.forEach(item => {
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      `;
    });
    
    // Shortcut key styles
    const shortcutKeys = this.hintsPanel.querySelectorAll('.shortcut-key');
    shortcutKeys.forEach(key => {
      key.style.cssText = `
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 2px 6px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        font-size: 11px;
        color: #333;
        font-weight: 500;
        min-width: 60px;
        text-align: center;
      `;
    });
    
    // Shortcut description styles
    const shortcutDescs = this.hintsPanel.querySelectorAll('.shortcut-desc');
    shortcutDescs.forEach(desc => {
      desc.style.cssText = `
        color: #666;
        flex: 1;
        margin-left: 12px;
        font-size: 12px;
      `;
    });
  }

  /**
   * Starts real-time updates of typing metrics
   * Implements requirement 3.1 for real-time speed updates
   */
  startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.updateMetricsDisplay();
    }, this.updateFrequency);
    
    console.log('HintsUI: Started real-time metrics updates');
  }

  /**
   * Updates the metrics display with current values
   */
  updateMetricsDisplay() {
    if (!this.hintsPanel || !this.metricsCalculator || !this.isVisible) {
      return;
    }
    
    const metrics = this.metricsCalculator.getCurrentMetrics();
    
    // Update WPM
    const wpmElement = this.hintsPanel.querySelector('#hints-wpm-value');
    if (wpmElement) {
      wpmElement.textContent = `${metrics.wpm} WPM`;
      
      // Add visual feedback for WPM changes
      this.animateMetricUpdate(wpmElement);
    }
    
    // Update accuracy
    const accuracyElement = this.hintsPanel.querySelector('#hints-accuracy-value');
    if (accuracyElement) {
      accuracyElement.textContent = `${metrics.accuracy}%`;
      
      // Color coding for accuracy
      if (metrics.accuracy >= 95) {
        accuracyElement.style.color = '#4CAF50'; // Green
      } else if (metrics.accuracy >= 85) {
        accuracyElement.style.color = '#FF9800'; // Orange
      } else {
        accuracyElement.style.color = '#f44336'; // Red
      }
      
      this.animateMetricUpdate(accuracyElement);
    }
    
    // Update time elapsed
    const timeElement = this.hintsPanel.querySelector('#hints-time-value');
    if (timeElement) {
      const minutes = Math.floor(metrics.timeElapsed / 60);
      const seconds = metrics.timeElapsed % 60;
      timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Adds a subtle animation to indicate metric updates
   * @param {HTMLElement} element - Element to animate
   */
  animateMetricUpdate(element) {
    if (!element) return;
    
    // Remove existing animation class
    element.classList.remove('metric-updated');
    
    // Force reflow
    element.offsetHeight;
    
    // Add animation class
    element.classList.add('metric-updated');
    
    // Add CSS for animation if not already present
    if (!document.getElementById('hints-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'hints-animation-styles';
      style.textContent = `
        .metric-updated {
          animation: metricPulse 0.3s ease-out;
        }
        
        @keyframes metricPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Shows the hints panel
   */
  show() {
    if (!this.hintsPanel) {
      return;
    }
    
    this.isVisible = true;
    this.hintsPanel.style.display = 'block';
    this.hintsPanel.style.opacity = '1';
    this.hintsPanel.style.transform = 'translateY(0)';
    
    // Resume real-time updates
    this.startRealTimeUpdates();
    
    // Save visibility preference to settings
    this.saveVisibilityPreference(true);
    
    console.log('HintsUI: Panel shown');
  }

  /**
   * Hides the hints panel
   * Implements requirement 3.3 for hiding hints panel
   */
  hide() {
    if (!this.hintsPanel) {
      return;
    }
    
    this.isVisible = false;
    this.hintsPanel.style.opacity = '0';
    this.hintsPanel.style.transform = 'translateY(-10px)';
    
    // Hide after animation
    setTimeout(() => {
      if (this.hintsPanel && !this.isVisible) {
        this.hintsPanel.style.display = 'none';
      }
    }, 300);
    
    // Stop updates when hidden
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Save visibility preference to settings
    this.saveVisibilityPreference(false);
    
    console.log('HintsUI: Panel hidden');
  }

  /**
   * Toggles the visibility of the hints panel
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Gets the current visibility state
   * @returns {boolean} True if panel is visible
   */
  getVisibility() {
    return this.isVisible;
  }

  /**
   * Updates the update frequency for real-time metrics
   * @param {number} frequency - Update frequency in milliseconds
   */
  setUpdateFrequency(frequency) {
    this.updateFrequency = Math.max(100, frequency); // Minimum 100ms
    
    if (this.updateInterval) {
      this.startRealTimeUpdates(); // Restart with new frequency
    }
  }

  /**
   * Cleans up the hints panel and stops updates
   */
  cleanup() {
    // Stop update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Remove panel from DOM
    if (this.hintsPanel && this.hintsPanel.parentNode) {
      this.hintsPanel.parentNode.removeChild(this.hintsPanel);
    }
    
    // Remove animation styles
    const animationStyles = document.getElementById('hints-animation-styles');
    if (animationStyles && animationStyles.parentNode) {
      animationStyles.parentNode.removeChild(animationStyles);
    }
    
    // Reset state
    this.hintsPanel = null;
    this.isVisible = true;
    this.metricsCalculator = null;
    
    console.log('HintsUI: Cleanup completed');
  }

  /**
   * Resets the metrics display to initial values
   */
  resetMetrics() {
    if (!this.hintsPanel) return;
    
    const wpmElement = this.hintsPanel.querySelector('#hints-wpm-value');
    if (wpmElement) {
      wpmElement.textContent = '0 WPM';
    }
    
    const accuracyElement = this.hintsPanel.querySelector('#hints-accuracy-value');
    if (accuracyElement) {
      accuracyElement.textContent = '100%';
      accuracyElement.style.color = '#4CAF50';
    }
    
    const timeElement = this.hintsPanel.querySelector('#hints-time-value');
    if (timeElement) {
      timeElement.textContent = '0:00';
    }
    
    console.log('HintsUI: Metrics display reset');
  }

  /**
   * Saves hint visibility preference to extension settings
   * Implements requirement 3.5 for storing hint visibility preference
   * @param {boolean} visible - Whether hints should be visible
   */
  saveVisibilityPreference(visible) {
    // Send message to content script to save settings
    // This method is called from within the content script context
    // so we can access the global settingsManager
    if (typeof settingsManager !== 'undefined' && settingsManager) {
      settingsManager.setHintsVisibility(visible).catch(error => {
        console.error('HintsUI: Error saving visibility preference:', error);
      });
    } else {
      console.warn('HintsUI: SettingsManager not available for saving visibility preference');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HintsUI;
}