/**
 * Background script for Webpage Typing Practice extension
 * Handles extension lifecycle and cross-tab communication
 * Implements requirement 3.4 for cross-tab communication and context menu management
 */

// Track active typing sessions across tabs
let activeSessions = new Map();

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Webpage Typing Practice extension installed/updated', details);
  
  // Handle different installation reasons
  switch (details.reason) {
    case 'install':
      console.log('Extension installed for the first time');
      // Initialize default settings
      initializeDefaultSettings();
      break;
      
    case 'update':
      console.log('Extension updated from version', details.previousVersion);
      // Handle any migration logic if needed
      handleExtensionUpdate(details.previousVersion);
      break;
      
    case 'chrome_update':
    case 'shared_module_update':
      console.log('Chrome or shared module updated');
      break;
  }
  
  // Create context menu for hints management
  createContextMenus();
});

// Handle extension startup (browser restart)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started up (browser restart)');
  
  // Clear any stale session data
  activeSessions.clear();
  
  // Recreate context menus
  createContextMenus();
});

/**
 * Initialize default settings on first install
 */
async function initializeDefaultSettings() {
  try {
    const result = await chrome.storage.sync.get('typingPracticeSettings');
    
    if (!result.typingPracticeSettings) {
      const defaultSettings = {
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
      
      await chrome.storage.sync.set({
        typingPracticeSettings: defaultSettings
      });
      
      console.log('Default settings initialized');
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}

/**
 * Handle extension updates
 * @param {string} previousVersion - Previous version number
 */
async function handleExtensionUpdate(previousVersion) {
  try {
    // Add any version-specific migration logic here
    console.log(`Updated from version ${previousVersion} to current version`);
    
    // Example: migrate settings if structure changed
    // const result = await chrome.storage.sync.get('typingPracticeSettings');
    // if (result.typingPracticeSettings) {
    //   // Perform any necessary migrations
    // }
  } catch (error) {
    console.error('Error handling extension update:', error);
  }
}

// Handle extension button (action) clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Check if we can inject into this tab
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      console.log('Cannot inject into this tab:', tab.url);
      return;
    }

    // Get current selection mode status from content script
    const response = await chrome.tabs.sendMessage(tab.id, { 
      action: 'getSelectionModeStatus' 
    });

    if (response && response.isActive) {
      // Deactivate selection mode if it's currently active
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'deactivateSelectionMode' 
      });
    } else {
      // Activate selection mode
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'activateSelectionMode' 
      });
    }
  } catch (error) {
    console.error('Error handling extension button click:', error);
    
    // If content script is not loaded, try to inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content-script.js']
      });
      
      // Try to activate selection mode after injection
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { 
            action: 'activateSelectionMode' 
          });
        } catch (retryError) {
          console.error('Error activating selection mode after injection:', retryError);
        }
      }, 100);
    } catch (injectionError) {
      console.error('Error injecting content script:', injectionError);
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background: Received message from tab', sender.tab?.id, message);
  
  switch (message.action) {
    case 'logMessage':
      console.log('Content script message:', message.data);
      sendResponse({ success: true });
      break;
      
    case 'updateBadge':
      // Update extension badge based on typing session status
      if (message.data && message.data.hasActiveSession) {
        chrome.action.setBadgeText({
          text: '●',
          tabId: sender.tab?.id
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#4CAF50',
          tabId: sender.tab?.id
        });
      } else {
        chrome.action.setBadgeText({
          text: '',
          tabId: sender.tab?.id
        });
      }
      sendResponse({ success: true });
      break;
      
    default:
      console.warn('Background: Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep message channel open for async responses
});

/**
 * Creates context menus for extension functionality
 * Implements requirement 3.4 for context menu access to hints
 */
function createContextMenus() {
  // Remove existing context menus
  chrome.contextMenus.removeAll(() => {
    try {
      // Create main context menu for hints management
      chrome.contextMenus.create({
        id: 'typing-practice-main',
        title: 'Typing Practice',
        contexts: ['action']
      });
      
      chrome.contextMenus.create({
        id: 'show-hints',
        parentId: 'typing-practice-main',
        title: 'Show Hints Panel',
        contexts: ['action']
      });
      
      chrome.contextMenus.create({
        id: 'hide-hints',
        parentId: 'typing-practice-main',
        title: 'Hide Hints Panel',
        contexts: ['action']
      });
      
      chrome.contextMenus.create({
        id: 'separator-1',
        parentId: 'typing-practice-main',
        type: 'separator',
        contexts: ['action']
      });
      
      chrome.contextMenus.create({
        id: 'reset-settings',
        parentId: 'typing-practice-main',
        title: 'Reset Settings',
        contexts: ['action']
      });
      
      chrome.contextMenus.create({
        id: 'separator-2',
        parentId: 'typing-practice-main',
        type: 'separator',
        contexts: ['action']
      });
      
      chrome.contextMenus.create({
        id: 'force-cleanup',
        parentId: 'typing-practice-main',
        title: 'Force Cleanup Sessions',
        contexts: ['action']
      });
      
      chrome.contextMenus.create({
        id: 'validate-session',
        parentId: 'typing-practice-main',
        title: 'Validate Current Session',
        contexts: ['action']
      });
      
      console.log('Background: Context menus created successfully');
    } catch (error) {
      console.error('Background: Error creating context menus:', error);
    }
  });
}

/**
 * Handles context menu clicks
 * Implements requirement 3.4 for reopening hints from context menu
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Background: Context menu clicked:', info.menuItemId, 'on tab', tab.id);
  
  try {
    let response;
    
    switch (info.menuItemId) {
      case 'show-hints':
        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'showHints'
        });
        console.log('Background: Show hints response:', response);
        break;
        
      case 'hide-hints':
        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'hideHints'
        });
        console.log('Background: Hide hints response:', response);
        break;
        
      case 'reset-settings':
        // Clear all settings and notify content script
        await chrome.storage.sync.remove('typingPracticeSettings');
        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'resetSettings'
        });
        console.log('Background: Reset settings response:', response);
        break;
        
      case 'force-cleanup':
        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'forceCleanup'
        });
        console.log('Background: Force cleanup response:', response);
        break;
        
      case 'validate-session':
        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'validateSession'
        });
        console.log('Background: Validate session response:', response);
        break;
        
      default:
        console.warn('Background: Unknown context menu item:', info.menuItemId);
    }
  } catch (error) {
    console.error('Background: Error handling context menu click:', error);
    
    // If content script is not loaded, try to inject it
    if (error.message && error.message.includes('Could not establish connection')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content-script.js']
        });
        console.log('Background: Content script injected after context menu error');
      } catch (injectionError) {
        console.error('Background: Failed to inject content script:', injectionError);
      }
    }
  }
});