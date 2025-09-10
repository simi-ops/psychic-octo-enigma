/**
 * Popup script for Webpage Typing Practice extension
 * Handles popup interface interactions and settings
 * Implements requirements 3.4, 3.5 for hint visibility controls
 */

let currentSettings = null;
let isInitialized = false;
let sessionStatus = {
  isActive: false,
  isSelectionMode: false,
  hasActiveSession: false
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  try {
    // Load current settings
    console.log('Loading settings...');
    await loadSettings();
    console.log('Settings loaded successfully');
    
    // Set up event listeners
    console.log('About to call setupEventListeners...');
    setupEventListeners();
    console.log('setupEventListeners completed');
    
    // Update UI with current settings
    console.log('Updating UI...');
    updateUI();
    console.log('UI updated');
    
    // Check for active typing session
    console.log('Checking active session...');
    await checkActiveSession();
    console.log('Active session check completed');
    
    // Start periodic status updates
    console.log('Starting status updates...');
    startStatusUpdates();
    console.log('Status updates started');
    
    isInitialized = true;
    console.log('Popup initialization complete');
    
    // Set up button click handler (using onclick since addEventListener wasn't working)
    const startStopBtn = document.getElementById('start-stop-btn');
    if (startStopBtn) {
      startStopBtn.onclick = handleStartStopClick;
      console.log('Start/Stop button handler attached');
    }
  } catch (error) {
    console.error('Popup initialization error:', error);
    showStatus('Failed to initialize popup', 'error');
  }
});

/**
 * Sets up event listeners for popup controls
 */
function setupEventListeners() {
  try {
    console.log('Setting up event listeners');
    console.log('Document ready state:', document.readyState);
    console.log('All elements in document:', document.querySelectorAll('*').length);
    
    // Start/Stop button
    const startStopBtn = document.getElementById('start-stop-btn');
    console.log('Start/Stop button found:', !!startStopBtn);
    console.log('Button element:', startStopBtn);
    
    if (startStopBtn) {
      startStopBtn.addEventListener('click', handleStartStopClick);
      console.log('Event listener attached to start/stop button');
    } else {
      console.error('start-stop-btn element not found!');
      // Try to find it with querySelector
      const btnByQuery = document.querySelector('#start-stop-btn');
      console.log('Button found by querySelector:', !!btnByQuery);
    }
  } catch (error) {
    console.error('Error in setupEventListeners:', error);
  }
  
  // Settings checkboxes
  const hintsToggle = document.getElementById('hints-visibility-toggle');
  if (hintsToggle) {
    hintsToggle.addEventListener('change', handleHintsToggle);
  }
  
  // Hint control buttons
  const showHintsBtn = document.getElementById('show-hints-btn');
  const hideHintsBtn = document.getElementById('hide-hints-btn');
  const resetBtn = document.getElementById('reset-settings-btn');
  
  if (showHintsBtn) showHintsBtn.addEventListener('click', () => sendMessage('showHints'));
  if (hideHintsBtn) hideHintsBtn.addEventListener('click', () => sendMessage('hideHints'));
  if (resetBtn) resetBtn.addEventListener('click', handleResetSettings);
}

/**
 * Handles start/stop button clicks
 */
async function handleStartStopClick() {
  console.log('Start/Stop button clicked');
  console.log('Current sessionStatus:', sessionStatus);
  try {
    if (sessionStatus.hasActiveSession) {
      console.log('Stopping active session');
      // Stop active session
      await sendMessage('forceCleanup');
      updateButtonState('start');
    } else if (sessionStatus.isSelectionMode) {
      console.log('Deactivating selection mode');
      // Deactivate selection mode
      await sendMessage('deactivateSelectionMode');
      updateButtonState('start');
    } else {
      console.log('Starting selection mode');
      // Start selection mode
      await sendMessage('activateSelectionMode');
      updateButtonState('selection');
    }
    
    // Refresh status after action
    setTimeout(checkActiveSession, 100);
  } catch (error) {
    console.error('Start/stop action failed:', error);
  }
}

/**
 * Updates button state and text
 */
function updateButtonState(state) {
  const btn = document.getElementById('start-stop-btn');
  const status = document.getElementById('session-status');
  const metrics = document.getElementById('metrics-section');
  const instruction = document.getElementById('instruction-text');
  
  if (!btn || !status) return;
  
  btn.className = 'primary-btn ' + state;
  
  switch (state) {
    case 'start':
      btn.textContent = 'Start Typing Mode';
      status.textContent = 'Ready to start';
      status.className = 'status-display';
      if (metrics) metrics.classList.add('hidden');
      if (instruction) instruction.textContent = 'Click "Start Typing Mode", then click any paragraph to practice.';
      break;
      
    case 'selection':
      btn.textContent = 'Stop Selection Mode';
      status.textContent = 'Selection mode active - click any paragraph to practice';
      status.className = 'status-display active';
      if (metrics) metrics.classList.add('hidden');
      if (instruction) instruction.textContent = 'Click on any highlighted paragraph to start typing practice.';
      break;
      
    case 'stop':
      btn.textContent = 'End Typing Session';
      status.textContent = 'Typing session active';
      status.className = 'status-display session';
      if (metrics) metrics.classList.remove('hidden');
      if (instruction) instruction.textContent = 'Type the selected text. Use Tab to skip, Esc to exit.';
      break;
  }
}

/**
 * Sends message to content script
 */
async function sendMessage(action) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action });
    return response;
  } catch (error) {
    console.error('Message send failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Checks active session status
 */
async function checkActiveSession() {
  try {
    const response = await sendMessage('getSessionStatus');
    if (response && response.success !== false) {
      sessionStatus = {
        isActive: response.isActive || false,
        isSelectionMode: response.isActive || false,
        hasActiveSession: response.hasActiveSession || false
      };
      
      // Update UI based on status
      if (sessionStatus.hasActiveSession) {
        updateButtonState('stop');
        updateMetrics(response.sessionInfo);
      } else if (sessionStatus.isSelectionMode) {
        updateButtonState('selection');
      } else {
        updateButtonState('start');
      }
    }
  } catch (error) {
    console.error('Status check failed:', error);
    updateButtonState('start');
  }
}

/**
 * Updates metrics display
 */
function updateMetrics(sessionInfo) {
  if (!sessionInfo) return;
  
  const wpmElement = document.getElementById('current-wpm');
  const accuracyElement = document.getElementById('current-accuracy');
  
  if (wpmElement && sessionInfo.wpm !== undefined) {
    wpmElement.textContent = Math.round(sessionInfo.wpm);
  }
  
  if (accuracyElement && sessionInfo.accuracy !== undefined) {
    accuracyElement.textContent = Math.round(sessionInfo.accuracy) + '%';
  }
}

/**
 * Starts periodic status updates
 */
function startStatusUpdates() {
  setInterval(checkActiveSession, 1000);
}

/**
 * Saves settings to storage
 * Implements requirement 3.5 for settings persistence
 */
async function saveSettings() {
  try {
    await chrome.storage.sync.set({
      typingPracticeSettings: currentSettings
    });
    console.log('Popup: Settings saved');
    return true;
  } catch (error) {
    console.error('Popup: Error saving settings', error);
    return false;
  }
}

/**
 * Sets up event listeners for popup controls
 */
function setupEventListeners() {
  // Hints visibility toggle
  const hintsToggle = document.getElementById('hints-visibility-toggle');
  if (hintsToggle) {
    hintsToggle.addEventListener('change', async (event) => {
      const isVisible = event.target.checked;
      currentSettings.hintsVisible = isVisible;
      await saveSettings();
      
      // Send message to content script to update hints visibility
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          const action = isVisible ? 'showHints' : 'hideHints';
          const response = await chrome.tabs.sendMessage(tab.id, { action });
          
          if (response && response.success) {
            showStatus(isVisible ? 'Hints panel shown' : 'Hints panel hidden', 'success');
          } else {
            showStatus('Failed to update hints visibility', 'error');
            // Revert toggle state on failure
            event.target.checked = !isVisible;
            currentSettings.hintsVisible = !isVisible;
          }
        } else {
          // Save setting even if no active tab (for future sessions)
          showStatus('Setting saved for future typing sessions', 'success');
        }
      } catch (error) {
        console.log('No active typing session or content script not loaded');
        // Still save the setting for future use
        showStatus('Setting saved for future typing sessions', 'success');
      }
      
      updateControlButtons();
    });
  }
  
  // Show hints button
  const showHintsBtn = document.getElementById('show-hints-btn');
  if (showHintsBtn) {
    showHintsBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'showHints' });
          
          if (response && response.success) {
            // Update settings
            currentSettings.hintsVisible = true;
            await saveSettings();
            updateUI();
            
            showStatus('Hints panel shown', 'success');
          } else {
            showStatus('Failed to show hints panel', 'error');
          }
        }
      } catch (error) {
        console.error('Error showing hints:', error);
        showStatus('No active typing session or extension not loaded', 'error');
      }
    });
  }
  
  // Hide hints button
  const hideHintsBtn = document.getElementById('hide-hints-btn');
  if (hideHintsBtn) {
    hideHintsBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'hideHints' });
          
          if (response && response.success) {
            // Update settings
            currentSettings.hintsVisible = false;
            await saveSettings();
            updateUI();
            
            showStatus('Hints panel hidden', 'success');
          } else {
            showStatus('Failed to hide hints panel', 'error');
          }
        }
      } catch (error) {
        console.error('Error hiding hints:', error);
        showStatus('No active typing session or extension not loaded', 'error');
      }
    });
  }
  
  // Show shortcuts toggle
  const showShortcutsToggle = document.getElementById('show-shortcuts-toggle');
  if (showShortcutsToggle) {
    showShortcutsToggle.addEventListener('change', async (event) => {
      currentSettings.showKeyboardShortcuts = event.target.checked;
      await saveSettings();
      showStatus('Keyboard shortcuts setting updated', 'success');
    });
  }
  
  // Show metrics toggle
  const showMetricsToggle = document.getElementById('show-metrics-toggle');
  if (showMetricsToggle) {
    showMetricsToggle.addEventListener('change', async (event) => {
      currentSettings.showTypingMetrics = event.target.checked;
      await saveSettings();
      showStatus('Typing metrics setting updated', 'success');
    });
  }
  
  // Auto-hide hints toggle
  const autoHideToggle = document.getElementById('auto-hide-hints-toggle');
  if (autoHideToggle) {
    autoHideToggle.addEventListener('change', async (event) => {
      currentSettings.autoHideHints = event.target.checked;
      await saveSettings();
      showStatus('Auto-hide hints setting updated', 'success');
    });
  }
  
  // Reset settings button
  const resetBtn = document.getElementById('reset-settings-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        // Reset to default settings
        currentSettings = {
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
        
        await saveSettings();
        updateUI();
        showStatus('All settings reset to defaults', 'success');
        
        // Notify content script of settings reset
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            await chrome.tabs.sendMessage(tab.id, { 
              action: 'resetSettings',
              settings: currentSettings
            });
          }
        } catch (error) {
          console.log('No active content script to notify of reset');
        }
      }
    });
  }
}

/**
 * Updates the popup UI with current settings
 */
function updateUI() {
  if (!currentSettings) return;
  
  // Update hints visibility toggle
  const hintsToggle = document.getElementById('hints-visibility-toggle');
  if (hintsToggle) {
    hintsToggle.checked = currentSettings.hintsVisible;
  }
  
  // Update show shortcuts toggle
  const showShortcutsToggle = document.getElementById('show-shortcuts-toggle');
  if (showShortcutsToggle) {
    showShortcutsToggle.checked = currentSettings.showKeyboardShortcuts;
  }
  
  // Update show metrics toggle
  const showMetricsToggle = document.getElementById('show-metrics-toggle');
  if (showMetricsToggle) {
    showMetricsToggle.checked = currentSettings.showTypingMetrics;
  }
  
  // Update auto-hide hints toggle
  const autoHideToggle = document.getElementById('auto-hide-hints-toggle');
  if (autoHideToggle) {
    autoHideToggle.checked = currentSettings.autoHideHints;
  }
  
  updateControlButtons();
}

/**
 * Updates the state of control buttons
 */
function updateControlButtons() {
  const showBtn = document.getElementById('show-hints-btn');
  const hideBtn = document.getElementById('hide-hints-btn');
  
  if (showBtn && hideBtn && currentSettings) {
    if (currentSettings.hintsVisible) {
      showBtn.disabled = true;
      hideBtn.disabled = false;
      showBtn.textContent = 'Hints Shown';
      hideBtn.textContent = 'Hide Hints';
    } else {
      showBtn.disabled = false;
      hideBtn.disabled = true;
      showBtn.textContent = 'Show Hints';
      hideBtn.textContent = 'Hints Hidden';
    }
  }
}

/**
 * Checks if there's an active typing session
 */
async function checkActiveSession() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'getSessionStatus' 
      });
      
      if (response && response.hasActiveSession) {
        updateSessionStatus('Active typing session detected', 'active');
        
        // Update hints visibility based on current session state
        if (response.hintsVisible !== undefined) {
          currentSettings.hintsVisible = response.hintsVisible;
          updateUI();
        }
      } else {
        updateSessionStatus('No active typing session', 'inactive');
      }
    }
  } catch (error) {
    updateSessionStatus('Extension not loaded on this page', 'inactive');
  }
}

/**
 * Updates the session status display
 * @param {string} message - Status message
 * @param {string} type - Status type ('active' or 'inactive')
 */
function updateSessionStatus(message, type) {
  const statusElement = document.getElementById('session-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status-text ${type}`;
  }
}

/**
 * Shows a temporary status message
 * @param {string} message - Message to show
 * @param {string} type - Message type ('success' or 'error')
 */
function showStatus(message, type) {
  // Create or update status element
  let statusEl = document.getElementById('temp-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'temp-status';
    statusEl.className = 'temp-status';
    document.querySelector('.popup-container').appendChild(statusEl);
  }
  
  statusEl.textContent = message;
  statusEl.className = `temp-status ${type}`;
  statusEl.style.display = 'block';
  
  // Hide after 2 seconds
  setTimeout(() => {
    if (statusEl) {
      statusEl.style.display = 'none';
    }
  }, 2000);
}
/**
 * Loads extension settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('typingPracticeSettings');
    
    if (result.typingPracticeSettings) {
      currentSettings = result.typingPracticeSettings;
    } else {
      currentSettings = {
        hintsVisible: true,
        skipDifficultChars: false,
        highlightColor: '#4CAF50',
        errorColor: '#f44336',
        completedColor: '#e8f5e8',
        showShortcuts: true,
        showMetrics: true,
        autoHideHints: false
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Updates UI with current settings
 */
function updateUI() {
  const hintsToggle = document.getElementById('hints-visibility-toggle');
  
  if (hintsToggle && currentSettings) {
    hintsToggle.checked = currentSettings.hintsVisible;
  }
}

/**
 * Handles hints visibility toggle
 */
async function handleHintsToggle(event) {
  try {
    currentSettings.hintsVisible = event.target.checked;
    await chrome.storage.sync.set({ typingPracticeSettings: currentSettings });
    
    if (currentSettings.hintsVisible) {
      await sendMessage('showHints');
    } else {
      await sendMessage('hideHints');
    }
  } catch (error) {
    console.error('Failed to toggle hints:', error);
  }
}

/**
 * Handles reset settings
 */
async function handleResetSettings() {
  try {
    await sendMessage('resetSettings');
    await loadSettings();
    updateUI();
  } catch (error) {
    console.error('Failed to reset settings:', error);
  }
}

/**
 * Shows temporary status message
 */
function showStatus(message, type = 'success') {
  console.log(`Status: ${message} (${type})`);
}
