/**
 * Content script for Webpage Typing Practice extension
 * Handles text selection and typing interface injection
 */

// Import MetricsCalculator for typing metrics tracking
// Note: In browser extension context, we'll load this via script tag in manifest

/**
 * TextSelectionHandler class - handles capturing and processing text selections
 * Implements requirements 1.1 and 1.2 for text selection and formatting preservation
 */
class TextSelectionHandler {
  constructor() {
    this.currentSelection = null;
  }

  /**
   * Captures the current user text selection
   * @returns {Object|null} SelectedText object or null if no valid selection
   */
  captureSelection() {
    const selection = window.getSelection();
    
    if (!this.validateSelection(selection)) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const boundingRect = range.getBoundingClientRect();
    
    return {
      content: selection.toString(),
      htmlContent: this.getSelectionHTML(selection),
      boundingRect: boundingRect,
      parentElement: range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer,
      range: range.cloneRange()
    };
  }

  /**
   * Validates if a selection is suitable for typing practice
   * @param {Selection} selection - The browser selection object
   * @returns {boolean} True if selection is valid for typing practice
   */
  validateSelection(selection) {
    try {
      // Check if there's actually a selection
      if (!selection || selection.rangeCount === 0) {
        return false;
      }

      const selectedText = selection.toString().trim();
      
      // Must have actual text content (minimum 3 characters)
      if (selectedText.length < 3) {
        return false;
      }

      // Check if selection contains only whitespace
      if (!/\S/.test(selectedText)) {
        return false;
      }

      // Ensure selection is within reasonable bounds (not too long)
      if (selectedText.length > 10000) {
        return false;
      }

      // Check if selection is within editable content (avoid input fields, textareas)
      const range = selection.getRangeAt(0);
      if (!range) {
        return false;
      }
      
      const container = range.commonAncestorContainer;
      if (!container) {
        return false;
      }
      
      const parentElement = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container;

      if (!parentElement) {
        return false;
      }

      // Avoid selections within form inputs
      if (this.isWithinEditableElement(parentElement)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating selection:', error);
      return false;
    }
  }

  /**
   * Extracts formatted content preserving HTML structure
   * @param {Selection} selection - The browser selection object
   * @returns {Object} FormattedContent object with text and formatting info
   */
  extractFormattedContent(selection) {
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    
    // Create a temporary container to work with the fragment
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);

    const text = selection.toString();
    const formatting = this.parseFormatting(tempDiv, text);
    const skipPositions = this.identifySkipPositions(tempDiv, text);

    return {
      text: text,
      htmlContent: tempDiv.innerHTML,
      formatting: formatting,
      skipPositions: skipPositions,
      originalRange: range.cloneRange()
    };
  }

  /**
   * Gets the HTML content of a selection
   * @param {Selection} selection - The browser selection object
   * @returns {string} HTML content of the selection
   */
  getSelectionHTML(selection) {
    if (!selection || selection.rangeCount === 0) {
      return '';
    }

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);
    
    return tempDiv.innerHTML;
  }

  /**
   * Parses formatting information from HTML content with enhanced format preservation
   * @param {HTMLElement} container - Container with the formatted content
   * @param {string} text - Plain text content
   * @returns {Array} Array of FormatNode objects
   */
  parseFormatting(container, text) {
    const formatNodes = [];
    let textIndex = 0;
    const nodeStack = [];

    const walkNodes = (node, depth = 0, parentStyles = {}) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const nodeText = node.textContent;
        if (nodeText.length > 0) {
          // Create text node with inherited formatting
          const textNode = {
            type: 'text',
            content: nodeText,
            startIndex: textIndex,
            endIndex: textIndex + nodeText.length - 1,
            depth: depth,
            inheritedStyles: { ...parentStyles },
            parentElements: [...nodeStack]
          };
          
          formatNodes.push(textNode);
          textIndex += nodeText.length;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const startIndex = textIndex;
        const elementStyles = this.getComputedStyles(node);
        const mergedStyles = { ...parentStyles, ...elementStyles };
        
        // Add element to stack for inheritance tracking
        const elementInfo = {
          tagName: node.tagName.toLowerCase(),
          attributes: this.getElementAttributes(node),
          styles: elementStyles,
          computedStyles: mergedStyles
        };
        nodeStack.push(elementInfo);
        
        // Process child nodes with inherited styles
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(child => walkNodes(child, depth + 1, mergedStyles));
        
        const endIndex = textIndex - 1;
        
        // Create element format node if it contains text
        if (endIndex >= startIndex) {
          const elementNode = {
            type: 'element',
            content: node.textContent,
            tagName: node.tagName.toLowerCase(),
            attributes: this.getElementAttributes(node),
            styles: elementStyles,
            computedStyles: mergedStyles,
            startIndex: startIndex,
            endIndex: endIndex,
            depth: depth,
            hasChildren: childNodes.length > 0,
            isInline: this.isInlineElement(node),
            isBlock: this.isBlockElement(node),
            semanticRole: this.getSemanticRole(node)
          };
          
          formatNodes.push(elementNode);
        }
        
        // Remove element from stack
        nodeStack.pop();
      }
    };

    walkNodes(container);
    
    // Sort format nodes by start index and depth for proper application
    formatNodes.sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      return a.depth - b.depth;
    });
    
    return formatNodes;
  }

  /**
   * Determines if an element is inline
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is inline
   */
  isInlineElement(element) {
    const inlineTags = [
      'a', 'abbr', 'acronym', 'b', 'bdi', 'bdo', 'big', 'br', 'button', 'cite', 
      'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map', 'mark', 
      'meter', 'noscript', 'object', 'output', 'progress', 'q', 'ruby', 's', 
      'samp', 'script', 'select', 'small', 'span', 'strong', 'sub', 'sup', 
      'textarea', 'time', 'tt', 'u', 'var', 'wbr'
    ];
    
    const tagName = element.tagName.toLowerCase();
    const computedStyle = window.getComputedStyle(element);
    
    return inlineTags.includes(tagName) || 
           computedStyle.display === 'inline' || 
           computedStyle.display === 'inline-block';
  }

  /**
   * Determines if an element is block-level
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is block-level
   */
  isBlockElement(element) {
    const blockTags = [
      'address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'dd', 
      'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 
      'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul'
    ];
    
    const tagName = element.tagName.toLowerCase();
    const computedStyle = window.getComputedStyle(element);
    
    return blockTags.includes(tagName) || 
           computedStyle.display === 'block' || 
           computedStyle.display === 'list-item';
  }

  /**
   * Gets the semantic role of an element for accessibility preservation
   * @param {HTMLElement} element - Element to analyze
   * @returns {string} Semantic role of the element
   */
  getSemanticRole(element) {
    const tagName = element.tagName.toLowerCase();
    
    // Map common HTML elements to their semantic roles
    const semanticMap = {
      'h1': 'heading-1', 'h2': 'heading-2', 'h3': 'heading-3',
      'h4': 'heading-4', 'h5': 'heading-5', 'h6': 'heading-6',
      'p': 'paragraph',
      'a': 'link',
      'button': 'button',
      'img': 'image',
      'ul': 'list', 'ol': 'list', 'li': 'list-item',
      'table': 'table', 'tr': 'row', 'td': 'cell', 'th': 'columnheader',
      'blockquote': 'blockquote',
      'code': 'code', 'pre': 'code-block',
      'strong': 'emphasis', 'b': 'emphasis',
      'em': 'emphasis', 'i': 'emphasis'
    };
    
    return semanticMap[tagName] || 'generic';
  }

  /**
   * Identifies positions in text that should be skippable (non-typeable characters)
   * @param {HTMLElement} container - Container with the content
   * @param {string} text - Plain text content
   * @returns {Array} Array of character positions that can be skipped
   */
  identifySkipPositions(container, text) {
    const skipPositions = [];
    
    // Identify positions with special characters that might be hard to type
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Skip positions for special Unicode characters, symbols, etc.
      if (this.isSkippableCharacter(char)) {
        skipPositions.push(i);
      }
    }

    return skipPositions;
  }

  /**
   * Determines if a character should be skippable
   * @param {string} char - Character to check
   * @returns {boolean} True if character should be skippable
   */
  isSkippableCharacter(char) {
    const charCode = char.charCodeAt(0);
    
    // Skip non-printable characters
    if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
      return true;
    }
    
    // Skip some special Unicode ranges that are hard to type
    // Mathematical symbols, arrows, etc.
    if (charCode >= 0x2190 && charCode <= 0x21FF) return true; // Arrows
    if (charCode >= 0x2200 && charCode <= 0x22FF) return true; // Mathematical operators
    if (charCode >= 0x2300 && charCode <= 0x23FF) return true; // Miscellaneous technical
    if (charCode >= 0x25A0 && charCode <= 0x25FF) return true; // Geometric shapes
    
    return false;
  }

  /**
   * Checks if an element is within an editable context
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if within editable element
   */
  isWithinEditableElement(element) {
    if (!element) return false;
    
    const editableTags = ['input', 'textarea', 'select'];
    const editableTypes = ['text', 'password', 'email', 'search', 'url'];
    
    let current = element;
    while (current && current !== document.body) {
      // Check for form inputs
      if (editableTags.includes(current.tagName.toLowerCase())) {
        if (current.tagName.toLowerCase() === 'input') {
          const inputType = current.type ? current.type.toLowerCase() : 'text';
          return editableTypes.includes(inputType);
        }
        return true;
      }
      
      // Check for contenteditable
      if (current.contentEditable === 'true') {
        return true;
      }
      
      current = current.parentElement;
    }
    
    return false;
  }

  /**
   * Gets relevant attributes from an element
   * @param {HTMLElement} element - Element to extract attributes from
   * @returns {Object} Object containing relevant attributes
   */
  getElementAttributes(element) {
    const relevantAttrs = ['class', 'id', 'href', 'title', 'alt'];
    const attributes = {};
    
    relevantAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        attributes[attr] = element.getAttribute(attr);
      }
    });
    
    return attributes;
  }

  /**
   * Gets comprehensive computed styles for an element with format preservation
   * @param {HTMLElement} element - Element to get styles from
   * @returns {Object} Object containing relevant computed styles
   */
  getComputedStyles(element) {
    const computedStyle = window.getComputedStyle(element);
    
    // Comprehensive list of text and layout styles to preserve
    const textStyles = [
      'color', 'backgroundColor', 'fontSize', 'fontWeight', 'fontStyle', 
      'textDecoration', 'fontFamily', 'lineHeight', 'letterSpacing', 
      'wordSpacing', 'textTransform', 'textAlign', 'textShadow'
    ];
    
    const layoutStyles = [
      'display', 'position', 'margin', 'marginTop', 'marginRight', 
      'marginBottom', 'marginLeft', 'padding', 'paddingTop', 'paddingRight', 
      'paddingBottom', 'paddingLeft', 'border', 'borderRadius'
    ];
    
    const styles = {
      text: {},
      layout: {},
      computed: {}
    };
    
    // Capture text-related styles
    textStyles.forEach(style => {
      const value = computedStyle[style];
      if (value && value !== 'initial' && value !== 'inherit') {
        styles.text[style] = value;
        styles.computed[style] = value;
      }
    });
    
    // Capture layout styles (for block elements)
    if (this.isBlockElement(element)) {
      layoutStyles.forEach(style => {
        const value = computedStyle[style];
        if (value && value !== 'initial' && value !== 'inherit' && value !== '0px') {
          styles.layout[style] = value;
        }
      });
    }
    
    // Add special handling for specific elements
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'a' && element.href) {
      styles.computed.href = element.href;
    }
    
    if (tagName === 'img' && element.src) {
      styles.computed.src = element.src;
      styles.computed.alt = element.alt || '';
    }
    
    return styles;
  }
}

/**
 * Content Script Initialization and Event Handling
 * Implements requirements 1.1 and 4.1 for extension activation and text selection
 */

// Extension state management
let isSelectionModeActive = false;
let currentTypingSession = null;
let settingsManager = null;

// Initialize required classes
const textSelectionHandler = new TextSelectionHandler();

/**
 * Cleans up the current typing session using TypingSession cleanup
 */
async function cleanupCurrentSession() {
  if (currentTypingSession) {
    console.log('Cleaning up current typing session...');
    await currentTypingSession.cleanup();
    currentTypingSession = null;
    console.log('Current typing session cleaned up');
  }
}

/**
 * Initializes the content script and sets up event listeners
 */
async function initializeContentScript() {
  console.log('Webpage Typing Practice extension loaded');
  
  // Initialize settings manager
  settingsManager = new SettingsManager();
  await settingsManager.loadSettings();
  settingsManager.startStorageListener();
  
  // Listen for messages from background script (extension button clicks)
  chrome.runtime.onMessage.addListener(handleExtensionMessage);
  
  // Set up selection event listeners (initially inactive)
  setupSelectionListeners();
  
  // Initialize visual feedback for selection mode
  createSelectionModeIndicator();
  
  // Set up periodic session validation (Requirement 4.5)
  setupSessionValidation();
  
  // Set up page unload cleanup
  setupPageUnloadCleanup();
}

/**
 * Sets up periodic validation of active typing sessions
 * Implements requirement 4.5 for graceful handling of dynamic content changes
 */
function setupSessionValidation() {
  // Validate session every 5 seconds if active
  setInterval(() => {
    if (currentTypingSession && currentTypingSession.isActive) {
      // Skip validation if typing interface is active to prevent false failures
      if (currentTypingSession.typingInterface && currentTypingSession.typingInterface.isActive()) {
        return;
      }
      
      const isValid = currentTypingSession.validateSessionState();
      
      if (!isValid) {
        console.warn('Session validation failed, attempting recovery');
        currentTypingSession.attemptSessionRecovery();
      }
    }
  }, 5000);
}

/**
 * Sets up cleanup for page unload events
 * Ensures proper cleanup when user navigates away or closes tab
 */
function setupPageUnloadCleanup() {
  const cleanupHandler = async () => {
    if (currentTypingSession && currentTypingSession.isActive) {
      console.log('Page unloading, cleaning up typing session');
      await cleanupCurrentSession();
    }
  };
  
  window.addEventListener('beforeunload', cleanupHandler);
  window.addEventListener('unload', cleanupHandler);
}

/**
 * Handles messages from the background script
 * @param {Object} message - Message object from background script
 * @param {Object} sender - Sender information
 * @param {Function} sendResponse - Response callback
 */
async function handleExtensionMessage(message, sender, sendResponse) {
  console.log('Content script received message:', message);
  try {
    switch (message.action) {
      case 'activateSelectionMode':
        console.log('Activating selection mode');
        activateSelectionMode();
        sendResponse({ success: true });
        break;
        
      case 'deactivateSelectionMode':
        deactivateSelectionMode();
        sendResponse({ success: true });
        break;
        
      case 'getSelectionModeStatus':
        sendResponse({ isActive: isSelectionModeActive });
        break;
        
      case 'getSessionStatus':
        // Validate session before reporting status
        if (currentTypingSession && currentTypingSession.isActive) {
          const isValid = currentTypingSession.validateSessionState();
          if (!isValid) {
            console.warn('Invalid session detected during status check');
            currentTypingSession.attemptSessionRecovery();
          }
        }
        
        sendResponse({ 
          hasActiveSession: currentTypingSession !== null && currentTypingSession.isActive,
          hintsVisible: currentTypingSession && currentTypingSession.hintsUI ? 
            currentTypingSession.hintsUI.getVisibility() : false,
        sessionInfo: currentTypingSession ? currentTypingSession.getStatus() : null,
        isValid: currentTypingSession ? currentTypingSession.validateSessionState() : true
      });
      break;
      
    case 'showHints':
      await handleShowHints();
      sendResponse({ success: true });
      break;
      
    case 'hideHints':
      await handleHideHints();
      sendResponse({ success: true });
      break;
      
    case 'resetSettings':
      await handleResetSettings();
      sendResponse({ success: true });
      break;
      
    case 'forceCleanup':
      await handleForceCleanup();
      sendResponse({ success: true });
      break;
      
    case 'validateSession':
      await handleValidateSession();
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  } catch (error) {
    console.error('Error handling extension message:', error);
    sendResponse({ success: false, error: error.message });
    
    // Attempt recovery if session is corrupted
    if (currentTypingSession && error.message.includes('session')) {
      try {
        currentTypingSession.attemptSessionRecovery();
      } catch (recoveryError) {
        console.error('Session recovery failed:', recoveryError);
        await handleForceCleanup();
      }
    }
  }
}

/**
 * Activates text selection mode
 */
function activateSelectionMode() {
  console.log('activateSelectionMode called, current state:', isSelectionModeActive);
  if (isSelectionModeActive) {
    console.log('Selection mode already active, returning');
    return;
  }
  
  isSelectionModeActive = true;
  console.log('Selection mode activated, highlighting paragraphs');
  
  // Show visual indicator that selection mode is active
  showSelectionModeIndicator();
  
  // Highlight all available paragraphs
  highlightAvailableParagraphs();
  
  // Clear any existing selection
  window.getSelection().removeAllRanges();
  
  console.log('Paragraph selection mode activated');
}

/**
 * Deactivates text selection mode
 */
function deactivateSelectionMode() {
  if (!isSelectionModeActive) {
    return;
  }
  
  isSelectionModeActive = false;
  
  // Hide visual indicator
  hideSelectionModeIndicator();
  
  // Remove paragraph highlights
  removeAllParagraphHighlights();
  
  // Clear selection
  window.getSelection().removeAllRanges();
  
  console.log('Paragraph selection mode deactivated');
}

/**
 * Sets up event listeners for text selection
 */
function setupSelectionListeners() {
  // Listen for click events to capture paragraph selections
  document.addEventListener('click', handleParagraphClick);
  
  // Listen for keyboard events to handle shortcuts
  document.addEventListener('keydown', handleKeyDown);
  
  // Prevent context menu during selection mode
  document.addEventListener('contextmenu', handleContextMenu);
  
  // Listen for mouseover to show paragraph previews
  document.addEventListener('mouseover', handleParagraphHover);
  document.addEventListener('mouseout', handleParagraphHoverOut);
}

/**
 * Handles click events to capture paragraph selections
 * @param {MouseEvent} event - Mouse event
 */
function handleParagraphClick(event) {
  if (!isSelectionModeActive) {
    return;
  }
  
  event.preventDefault();
  event.stopPropagation();
  
  // Find the paragraph element that was clicked
  const clickedParagraph = findParagraphElement(event.target);
  
  if (clickedParagraph && clickedParagraph.classList.contains('typing-practice-paragraph')) {
    processSelectedParagraph(clickedParagraph);
  }
}

/**
 * Handles mouseover events for paragraph preview
 * @param {MouseEvent} event - Mouse event
 */
function handleParagraphHover(event) {
  if (!isSelectionModeActive) {
    return;
  }
  
  const paragraph = findParagraphElement(event.target);
  if (paragraph && paragraph.classList.contains('typing-practice-paragraph')) {
    paragraph.classList.add('typing-practice-paragraph-hover');
  }
}

/**
 * Handles mouseout events for paragraph preview
 * @param {MouseEvent} event - Mouse event
 */
function handleParagraphHoverOut(event) {
  if (!isSelectionModeActive) {
    return;
  }
  
  const paragraph = findParagraphElement(event.target);
  if (paragraph && paragraph.classList.contains('typing-practice-paragraph')) {
    paragraph.classList.remove('typing-practice-paragraph-hover');
  }
}

/**
 * Handles keyboard events for shortcuts and navigation
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyDown(event) {
  if (!isSelectionModeActive) {
    return;
  }
  
  // Escape key to exit selection mode
  if (event.key === 'Escape') {
    event.preventDefault();
    deactivateSelectionMode();
    return;
  }
  
  // Enter key to confirm selection
  if (event.key === 'Enter' && window.getSelection().toString().trim().length > 0) {
    event.preventDefault();
    const selectedText = textSelectionHandler.captureSelection();
    
    if (selectedText) {
      processValidSelection(selectedText);
    }
  }
}

/**
 * Handles context menu events during selection mode
 * @param {Event} event - Context menu event
 */
function handleContextMenu(event) {
  if (isSelectionModeActive) {
    event.preventDefault();
    return false;
  }
}

/**
 * Processes a valid text selection and starts typing session using TypingSession
 * @param {Object} selectedText - Selected text object from TextSelectionHandler
 */
async function processValidSelection(selectedText) {
  try {
    // Extract formatted content
    const formattedContent = textSelectionHandler.extractFormattedContent(window.getSelection());
    
    if (!formattedContent) {
      showSelectionError('Unable to process selected text');
      return;
    }
    
    // Force cleanup of any existing sessions to prevent conflicts (Requirement 4.4)
    await TypingSession.forceCleanupExistingSessions();
    
    // Clean up any existing session first
    if (currentTypingSession) {
      await cleanupCurrentSession();
    }
    
    // Deactivate selection mode
    deactivateSelectionMode();
    
    // Create new typing session
    currentTypingSession = new TypingSession();
    
    // Prepare components for session initialization
    const components = {
      textSelectionHandler: textSelectionHandler,
      settingsManager: settingsManager
    };
    
    // Initialize the session
    const success = await currentTypingSession.initialize(selectedText, formattedContent, components);
    
    if (!success) {
      showSelectionError('Failed to initialize typing session. Please try again.');
      currentTypingSession = null;
      return;
    }
    
    console.log('Typing session initialized successfully:', {
      sessionId: currentTypingSession.id,
      textLength: selectedText.content.length,
      hasFormatting: formattedContent.formatting.length > 0,
      skipPositions: formattedContent.skipPositions.length
    });
    
    // Show success feedback
    showSelectionSuccess('Typing practice session started! Start typing to begin.');
    
  } catch (error) {
    console.error('Error processing selection:', error);
    showSelectionError('Error processing selection. Please try again.');
    
    // Clean up on error
    if (currentTypingSession) {
      await cleanupCurrentSession();
    }
  }
}

/**
 * Creates the selection mode indicator element
 */
function createSelectionModeIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'typing-practice-selection-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    display: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  indicator.textContent = 'Click on any paragraph to start typing practice';
  
  document.body.appendChild(indicator);
  
  // Add paragraph highlight styles
  const style = document.createElement('style');
  style.id = 'typing-practice-paragraph-styles';
  style.textContent = `
    .typing-practice-paragraph {
      outline: 2px solid #4CAF50 !important;
      outline-offset: 2px !important;
      background-color: rgba(76, 175, 80, 0.1) !important;
      transition: all 0.2s ease !important;
      border-radius: 4px !important;
    }
    
    .typing-practice-paragraph-hover {
      outline-color: #2E7D32 !important;
      background-color: rgba(76, 175, 80, 0.2) !important;
      transform: scale(1.01) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }
    
    .typing-practice-paragraph::before {
      content: "Click to practice typing" !important;
      position: absolute !important;
      background: #4CAF50 !important;
      color: white !important;
      padding: 2px 6px !important;
      font-size: 12px !important;
      border-radius: 2px !important;
      top: -20px !important;
      left: 0 !important;
      opacity: 0 !important;
      transition: opacity 0.2s ease !important;
      pointer-events: none !important;
      z-index: 1000 !important;
    }
    
    .typing-practice-paragraph-hover::before {
      opacity: 1 !important;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Shows the selection mode indicator
 */
function showSelectionModeIndicator() {
  const indicator = document.getElementById('typing-practice-selection-indicator');
  if (indicator) {
    indicator.style.display = 'block';
  }
}

/**
 * Hides the selection mode indicator
 */
function hideSelectionModeIndicator() {
  const indicator = document.getElementById('typing-practice-selection-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
  
  // Remove paragraph styles
  const styles = document.getElementById('typing-practice-paragraph-styles');
  if (styles) {
    styles.remove();
  }
}

/**
 * Highlights all available paragraphs on the page
 */
function highlightAvailableParagraphs() {
  const paragraphs = findAllParagraphs();
  
  paragraphs.forEach((paragraph, index) => {
    paragraph.classList.add('typing-practice-paragraph');
    paragraph.setAttribute('data-paragraph-index', index);
    paragraph.style.cursor = 'pointer';
  });
  
  console.log(`Highlighted ${paragraphs.length} paragraphs for selection`);
}

/**
 * Removes all paragraph highlights
 */
function removeAllParagraphHighlights() {
  const highlightedParagraphs = document.querySelectorAll('.typing-practice-paragraph');
  
  highlightedParagraphs.forEach(paragraph => {
    paragraph.classList.remove('typing-practice-paragraph', 'typing-practice-paragraph-hover');
    paragraph.removeAttribute('data-paragraph-index');
    paragraph.style.cursor = '';
  });
}

/**
 * Finds all suitable paragraphs on the page
 * @returns {Array} Array of paragraph elements
 */
function findAllParagraphs() {
  const paragraphSelectors = [
    'p', 'div', 'article', 'section', 'li', 'blockquote', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ];
  
  const paragraphs = [];
  
  paragraphSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (isParagraphSuitable(element)) {
        paragraphs.push(element);
      }
    });
  });
  
  return paragraphs;
}

/**
 * Checks if an element is suitable for typing practice
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is suitable
 */
function isParagraphSuitable(element) {
  const text = element.textContent.trim();
  
  // Must have sufficient text
  if (text.length < 20) return false;
  
  // Must not be too long
  if (text.length > 2000) return false;
  
  // Must not be within editable elements
  if (textSelectionHandler.isWithinEditableElement(element)) return false;
  
  // Must not be hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  // Must not be navigation or UI elements
  const excludeClasses = ['nav', 'menu', 'header', 'footer', 'sidebar', 'ad', 'advertisement'];
  const className = element.className.toLowerCase();
  if (excludeClasses.some(cls => className.includes(cls))) return false;
  
  return true;
}

/**
 * Finds the paragraph element from a clicked target
 * @param {HTMLElement} target - Clicked element
 * @returns {HTMLElement|null} Paragraph element or null
 */
function findParagraphElement(target) {
  let current = target;
  
  while (current && current !== document.body) {
    if (current.classList && current.classList.contains('typing-practice-paragraph')) {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
}

/**
 * Processes a selected paragraph for typing practice
 * @param {HTMLElement} paragraph - Selected paragraph element
 */
async function processSelectedParagraph(paragraph) {
  try {
    // Clean up any existing sessions
    if (currentTypingSession) {
      await cleanupCurrentSession();
    }
    
    // Deactivate selection mode
    deactivateSelectionMode();
    
    // Start inline typing
    window.inlineTyping.startTyping(paragraph);
    
    showSelectionSuccess('Start typing to begin practice!');
    
  } catch (error) {
    console.error('Error processing paragraph selection:', error);
    showSelectionError('Error processing selection. Please try again.');
  }
}

/**
 * Creates a range object from an element
 * @param {HTMLElement} element - Element to create range from
 * @returns {Range} Range object
 */
function createRangeFromElement(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range;
}

/**
 * Extracts formatted content from a paragraph element
 * @param {HTMLElement} element - Paragraph element
 * @returns {Object} Formatted content object
 */
function extractFormattedContentFromElement(element) {
  const text = element.textContent;
  const formatting = textSelectionHandler.parseFormatting(element, text);
  const skipPositions = textSelectionHandler.identifySkipPositions(element, text);
  
  return {
    text: text,
    htmlContent: element.innerHTML,
    formatting: formatting,
    skipPositions: skipPositions,
    originalRange: createRangeFromElement(element)
  };
}

/**
 * Shows selection error message
 * @param {string} message - Error message to display
 */
function showSelectionError(message) {
  showTemporaryMessage(message, 'error');
}

/**
 * Shows selection success message
 * @param {string} message - Success message to display
 */
function showSelectionSuccess(message) {
  showTemporaryMessage(message, 'success');
}

/**
 * Shows a temporary message to the user
 * @param {string} message - Message to display
 * @param {string} type - Message type ('error' or 'success')
 */
function showTemporaryMessage(message, type = 'info') {
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    position: fixed;
    top: 50px;
    right: 10px;
    padding: 12px 20px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10001;
    max-width: 300px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ${type === 'error' ? 'background: #f44336; color: white;' : 
      type === 'success' ? 'background: #4CAF50; color: white;' : 
      'background: #2196F3; color: white;'}
  `;
  messageEl.textContent = message;
  
  document.body.appendChild(messageEl);
  
  // Remove message after 3 seconds
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 3000);
}

/**
 * Handles showing hints panel
 * Implements requirement 3.4 for reopening hints from context menu
 */
async function handleShowHints() {
  if (currentTypingSession && currentTypingSession.hintsUI) {
    currentTypingSession.hintsUI.show();
    showTemporaryMessage('Hints panel shown', 'success');
  } else if (currentTypingSession && currentTypingSession.metricsCalculator) {
    // Recreate hints UI if session exists but hints UI was destroyed
    const hintsUI = new HintsUI();
    hintsUI.initialize(currentTypingSession.metricsCalculator);
    hintsUI.show();
    currentTypingSession.hintsUI = hintsUI;
    showTemporaryMessage('Hints panel shown', 'success');
  } else {
    showTemporaryMessage('No active typing session', 'error');
  }
}

/**
 * Handles hiding hints panel
 * Implements requirement 3.3 for hiding hints panel
 */
async function handleHideHints() {
  if (currentTypingSession && currentTypingSession.hintsUI) {
    currentTypingSession.hintsUI.hide();
    showTemporaryMessage('Hints panel hidden', 'success');
  } else {
    showTemporaryMessage('No hints panel to hide', 'error');
  }
}

/**
 * Handles resetting extension settings
 */
async function handleResetSettings() {
  if (settingsManager) {
    await settingsManager.resetSettings();
    
    // Apply reset settings to current session if active
    if (currentTypingSession && currentTypingSession.hintsUI) {
      const hintsVisible = settingsManager.getHintsVisibility();
      const updateFrequency = settingsManager.getUpdateFrequency();
      
      if (hintsVisible) {
        currentTypingSession.hintsUI.show();
      } else {
        currentTypingSession.hintsUI.hide();
      }
      
      currentTypingSession.hintsUI.setUpdateFrequency(updateFrequency);
    }
    
    showTemporaryMessage('Settings reset to defaults', 'success');
  } else {
    showTemporaryMessage('Settings manager not available', 'error');
  }
}

/**
 * Handles force cleanup of all typing sessions
 * Implements requirement 4.4 for preventing multiple simultaneous sessions
 */
async function handleForceCleanup() {
  try {
    console.log('Force cleanup requested');
    
    // Clean up current session
    if (currentTypingSession) {
      await cleanupCurrentSession();
    }
    
    // Force cleanup any remaining sessions
    await TypingSession.forceCleanupExistingSessions();
    
    // Deactivate selection mode
    deactivateSelectionMode();
    
    showTemporaryMessage('All typing sessions cleaned up', 'success');
    
  } catch (error) {
    console.error('Error during force cleanup:', error);
    showTemporaryMessage('Error during cleanup', 'error');
  }
}

/**
 * Handles session validation request
 * Implements requirement 4.5 for graceful handling of dynamic content changes
 */
async function handleValidateSession() {
  try {
    if (!currentTypingSession || !currentTypingSession.isActive) {
      showTemporaryMessage('No active session to validate', 'info');
      return;
    }
    
    const isValid = currentTypingSession.validateSessionState();
    
    if (isValid) {
      showTemporaryMessage('Session is valid', 'success');
    } else {
      console.warn('Session validation failed, attempting recovery');
      const recovered = await currentTypingSession.attemptSessionRecovery();
      
      if (recovered) {
        showTemporaryMessage('Session recovered successfully', 'success');
      } else {
        showTemporaryMessage('Session could not be recovered and was ended', 'error');
      }
    }
    
  } catch (error) {
    console.error('Error during session validation:', error);
    showTemporaryMessage('Error validating session', 'error');
  }
}

/**
 * TypingInterface class - handles the interactive typing overlay
 * Implements requirements 1.2, 1.3, and 4.2 for typing interface and visual feedback
 */
class TypingInterface {
  constructor() {
    this.session = null;
    this.overlayElement = null;
    this.currentPosition = 0;
    this.isInitialized = false;
  }

  /**
   * Initializes a typing session with formatted content
   * @param {Object} formattedContent - Content with formatting information
   * @param {HTMLElement} container - Container element for positioning
   */
  initialize(formattedContent, container, selectedText = null) {
    console.log('TypingInterface.initialize called with:', {
      textLength: formattedContent.text.length,
      containerExists: !!container,
      textPreview: formattedContent.text.substring(0, 100) + (formattedContent.text.length > 100 ? '...' : ''),
      hasText: formattedContent.text.length > 0,
      hasCapturedPosition: !!(selectedText && selectedText.capturedPosition)
    });
    
    if (this.isInitialized) {
      this.cleanup();
    }

    this.session = {
      content: formattedContent,
      container: container,
      startTime: new Date(),
      currentPosition: 0,
      completedCharacters: 0,
      errors: []
    };
    
    // Add captured position if available
    if (selectedText && selectedText.capturedPosition) {
      this.session.content.capturedPosition = selectedText.capturedPosition;
    }

    this.currentPosition = 0;
    this.isInitialized = true;

    try {
      // Create and render the typing overlay
      console.log('About to call renderTypingOverlay');
      this.renderTypingOverlay();
      console.log('renderTypingOverlay completed, overlay element:', !!this.overlayElement);
      
      console.log('TypingInterface initialized successfully with content:', {
        textLength: formattedContent.text.length,
        formatNodes: formattedContent.formatting.length,
        skipPositions: formattedContent.skipPositions.length,
        overlayCreated: !!this.overlayElement,
        overlayInDOM: this.overlayElement ? document.contains(this.overlayElement) : false
      });
    } catch (error) {
      console.error('Error in TypingInterface.initialize:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Renders the typing overlay interface over the selected text
   * @returns {HTMLElement} The created overlay element
   */
  renderTypingOverlay() {
    console.log('renderTypingOverlay called');
    
    if (!this.session) {
      throw new Error('TypingInterface not initialized');
    }

    // Create main overlay container
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'typing-practice-overlay';
    this.overlayElement.className = 'typing-practice-overlay';
    
    console.log('Overlay element created, calling positionOverlay');
    
    // Position overlay over the original content
    this.positionOverlay();
    
    // Create the typing content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'typing-content';
    
    // Render the text with character-by-character spans
    this.renderTypingText(contentContainer);
    
    // Create cursor element
    const cursor = document.createElement('span');
    cursor.id = 'typing-cursor';
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    
    this.overlayElement.appendChild(contentContainer);
    this.overlayElement.appendChild(cursor);
    
    // Add overlay styles
    this.applyOverlayStyles();
    
    // Insert overlay into DOM
    document.body.appendChild(this.overlayElement);
    
    // Initialize cursor position
    this.updateCursor(0);
    
    return this.overlayElement;
  }

  /**
   * Renders the typing text with individual character spans for highlighting
   * @param {HTMLElement} container - Container to render text into
   */
  renderTypingText(container) {
    const text = this.session.content.text;
    const formatting = this.session.content.formatting;
    
    // Create character spans with preserved formatting
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charSpan = document.createElement('span');
      charSpan.className = 'typing-char';
      charSpan.setAttribute('data-index', i);
      
      // Handle special characters
      if (char === ' ') {
        charSpan.innerHTML = '&nbsp;';
        charSpan.classList.add('space-char');
      } else if (char === '\n') {
        charSpan.innerHTML = '<br>';
        charSpan.classList.add('newline-char');
      } else if (char === '\t') {
        charSpan.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
        charSpan.classList.add('tab-char');
      } else {
        charSpan.textContent = char;
      }
      
      // Apply formatting from original content
      this.applyCharacterFormatting(charSpan, i, formatting);
      
      // Mark skippable characters
      if (this.session.content.skipPositions.includes(i)) {
        charSpan.classList.add('skippable-char');
      }
      
      container.appendChild(charSpan);
    }
  }

  /**
   * Applies comprehensive formatting to a character span based on original formatting
   * @param {HTMLElement} charSpan - Character span element
   * @param {number} index - Character index in text
   * @param {Array} formatting - Array of format nodes
   */
  applyCharacterFormatting(charSpan, index, formatting) {
    // Find formatting nodes that apply to this character
    const applicableFormats = formatting.filter(format => 
      format.startIndex <= index && format.endIndex >= index
    );
    
    // Sort by depth (deepest first) to apply nested formatting correctly
    const sortedFormats = applicableFormats.sort((a, b) => b.depth - a.depth);
    
    // Track applied styles to avoid conflicts
    const appliedStyles = new Set();
    
    sortedFormats.forEach(format => {
      if (format.type === 'element') {
        // Apply computed text styles
        if (format.computedStyles) {
          Object.entries(format.computedStyles).forEach(([property, value]) => {
            if (this.isTextStyle(property) && !appliedStyles.has(property)) {
              charSpan.style[property] = value;
              appliedStyles.add(property);
            }
          });
        }
        
        // Add semantic classes for styling
        if (format.tagName) {
          charSpan.classList.add(`original-${format.tagName}`);
          
          // Add semantic role class
          if (format.semanticRole) {
            charSpan.classList.add(`role-${format.semanticRole}`);
          }
        }
        
        // Handle special elements
        this.applySpecialElementFormatting(charSpan, format, index);
      }
    });
    
    // Apply text node inherited styles if no element styles were applied
    const textNodes = applicableFormats.filter(f => f.type === 'text');
    if (textNodes.length > 0 && appliedStyles.size === 0) {
      const textNode = textNodes[textNodes.length - 1]; // Use deepest text node
      if (textNode.inheritedStyles) {
        Object.entries(textNode.inheritedStyles).forEach(([property, value]) => {
          if (this.isTextStyle(property)) {
            charSpan.style[property] = value;
          }
        });
      }
    }
  }

  /**
   * Applies special formatting for specific element types
   * @param {HTMLElement} charSpan - Character span element
   * @param {Object} format - Format node object
   * @param {number} index - Character index
   */
  applySpecialElementFormatting(charSpan, format, index) {
    const tagName = format.tagName;
    
    switch (tagName) {
      case 'a':
        // Preserve link styling and add hover effects
        charSpan.style.cursor = 'pointer';
        if (format.computedStyles && format.computedStyles.href) {
          charSpan.setAttribute('data-original-href', format.computedStyles.href);
          charSpan.title = format.computedStyles.href;
        }
        break;
        
      case 'code':
        // Ensure monospace font for code elements
        charSpan.style.fontFamily = 'monospace, Consolas, "Courier New", Courier';
        break;
        
      case 'mark':
        // Preserve highlighting
        if (!charSpan.style.backgroundColor) {
          charSpan.style.backgroundColor = '#ffff00';
        }
        break;
        
      case 'del':
      case 's':
        // Preserve strikethrough
        charSpan.style.textDecoration = 'line-through';
        break;
        
      case 'ins':
      case 'u':
        // Preserve underline
        charSpan.style.textDecoration = 'underline';
        break;
        
      case 'sup':
        charSpan.style.verticalAlign = 'super';
        charSpan.style.fontSize = '0.8em';
        break;
        
      case 'sub':
        charSpan.style.verticalAlign = 'sub';
        charSpan.style.fontSize = '0.8em';
        break;
    }
  }

  /**
   * Checks if a CSS property is text-related and should be preserved
   * @param {string} property - CSS property name
   * @returns {boolean} True if property should be preserved
   */
  isTextStyle(property) {
    const textStyles = [
      'color', 'backgroundColor', 'fontSize', 'fontWeight', 
      'fontStyle', 'textDecoration', 'fontFamily', 'textTransform'
    ];
    return textStyles.includes(property);
  }

  /**
   * Positions the overlay to precisely match the original text location and layout
   */
  positionOverlay() {
    console.log('positionOverlay called with session:', !!this.session, 'container:', !!this.session?.container);
    
    if (!this.session || !this.session.container) {
      console.warn('No session or container for positioning');
      return;
    }

    // Get the original range for precise positioning
    const originalRange = this.session.content.originalRange;
    console.log('originalRange exists:', !!originalRange);
    
    if (!originalRange) {
      console.log('No originalRange, using fallback positioning');
      this.fallbackPositioning();
      return;
    }

    try {
      // Get bounding rectangle of the original selection
      const rangeRect = originalRange.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      console.log('Overlay positioning:', {
        rangeRect: { top: rangeRect.top, left: rangeRect.left, width: rangeRect.width, height: rangeRect.height },
        scroll: { top: scrollTop, left: scrollLeft },
        finalPosition: { 
          top: rangeRect.top + scrollTop, 
          left: rangeRect.left + scrollLeft,
          width: Math.max(rangeRect.width, 200),
          height: rangeRect.height
        }
      });
      
      // Check if range has valid dimensions
      if (rangeRect.width === 0 || rangeRect.height === 0) {
        console.log('Range has no dimensions, using fallback positioning');
        this.fallbackPositioning();
        return;
      }
      
      // Position overlay exactly over the original text
      this.overlayElement.style.position = 'absolute';
      this.overlayElement.style.top = (rangeRect.top + scrollTop) + 'px';
      this.overlayElement.style.left = (rangeRect.left + scrollLeft) + 'px';
      this.overlayElement.style.width = Math.max(rangeRect.width, 200) + 'px';
      this.overlayElement.style.minHeight = rangeRect.height + 'px';
      
      // Copy layout properties from the original container
      this.copyLayoutProperties();
      
      // Just position overlay - don't modify original content
      
    } catch (error) {
      console.warn('Error positioning overlay precisely, using fallback:', error);
      this.fallbackPositioning();
    }
  }

  /**
   * Fallback positioning method when precise positioning fails
   */
  fallbackPositioning() {
    console.log('=== FALLBACK POSITIONING DEBUG ===');
    
    // Check if we have a captured position from before DOM modifications
    if (this.session.content.capturedPosition) {
      console.log('Using captured position from selectedText');
      const pos = this.session.content.capturedPosition;
      
      this.overlayElement.style.position = 'absolute';
      this.overlayElement.style.top = pos.top + 'px';
      this.overlayElement.style.left = pos.left + 'px';
      this.overlayElement.style.width = Math.max(pos.width, 300) + 'px';
      this.overlayElement.style.minHeight = Math.max(pos.height, 50) + 'px';
      
      console.log('Applied captured position:', pos);
      return;
    }
    
    console.log('Container element exists:', !!this.session.container);
    
    if (!this.session.container) {
      console.error('No container element available!');
      return;
    }
    
    console.log('Container tagName:', this.session.container.tagName);
    console.log('Container in DOM:', document.contains(this.session.container));
    
    let containerElement = this.session.container;
    
    // If container is not in DOM, try to find it again by text content
    if (!document.contains(containerElement)) {
      console.log('Container not in DOM, searching for paragraph with matching text...');
      const textContent = this.session.content.text.substring(0, 50); // First 50 chars
      const paragraphs = document.querySelectorAll('p');
      
      for (const p of paragraphs) {
        if (p.textContent.trim().startsWith(textContent.trim())) {
          containerElement = p;
          console.log('Found matching paragraph element');
          break;
        }
      }
    }
    
    const containerRect = containerElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    console.log('Final container in DOM:', document.contains(containerElement));
    console.log('Fallback positioning:', {
      containerRect: { top: containerRect.top, left: containerRect.left, width: containerRect.width, height: containerRect.height },
      scroll: { top: scrollTop, left: scrollLeft },
      finalPosition: { 
        top: containerRect.top + scrollTop, 
        left: containerRect.left + scrollLeft,
        width: containerRect.width,
        height: containerRect.height
      }
    });
    
    this.overlayElement.style.position = 'absolute';
    this.overlayElement.style.top = (containerRect.top + scrollTop) + 'px';
    this.overlayElement.style.left = (containerRect.left + scrollLeft) + 'px';
    this.overlayElement.style.width = Math.max(containerRect.width, 300) + 'px';
    this.overlayElement.style.minHeight = Math.max(containerRect.height, 50) + 'px';
  }

  /**
   * Copies relevant layout properties from the original container
   */
  copyLayoutProperties() {
    if (!this.session.container) {
      return;
    }

    const containerStyle = window.getComputedStyle(this.session.container);
    const layoutProperties = [
      'fontFamily', 'fontSize', 'lineHeight', 'letterSpacing', 
      'wordSpacing', 'textAlign', 'whiteSpace'
    ];

    layoutProperties.forEach(prop => {
      const value = containerStyle[prop];
      if (value && value !== 'initial') {
        this.overlayElement.style[prop] = value;
      }
    });

    // Ensure proper text flow
    this.overlayElement.style.whiteSpace = 'pre-wrap';
    this.overlayElement.style.wordWrap = 'break-word';
    this.overlayElement.style.overflowWrap = 'break-word';
  }

  /**
   * Temporarily dims the original content to show overlay clearly
   */
  dimOriginalContent() {
    if (!this.session.content.originalRange) {
      return;
    }

    try {
      // Just dim the original content instead of hiding it
      const range = this.session.content.originalRange;
      const commonAncestor = range.commonAncestorContainer;
      
      if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
        commonAncestor.style.opacity = '0.3';
        this.session.dimmedElement = commonAncestor;
      } else if (commonAncestor.parentElement) {
        commonAncestor.parentElement.style.opacity = '0.3';
        this.session.dimmedElement = commonAncestor.parentElement;
      }
      
    } catch (error) {
      console.warn('Could not dim original content:', error);
    }
  }

  /**
   * Restores the original content when cleaning up
   */
  restoreOriginalContent() {
    // No content modification needed - overlay just sits on top
    console.log('No content restoration needed');
  }

  /**
   * Updates cursor position to the specified character index
   * @param {number} position - Character index for cursor position
   */
  updateCursor(position) {
    if (!this.overlayElement) {
      return;
    }

    this.currentPosition = position;
    const cursor = this.overlayElement.querySelector('#typing-cursor');
    const chars = this.overlayElement.querySelectorAll('.typing-char');
    
    if (!cursor || !chars.length) {
      return;
    }

    // Hide cursor if at end of text
    if (position >= chars.length) {
      cursor.style.display = 'none';
      return;
    }
    
    cursor.style.display = 'inline';
    
    // Position cursor at the current character
    const currentChar = chars[position];
    if (currentChar) {
      const charRect = currentChar.getBoundingClientRect();
      const overlayRect = this.overlayElement.getBoundingClientRect();
      
      cursor.style.position = 'absolute';
      cursor.style.left = (charRect.left - overlayRect.left) + 'px';
      cursor.style.top = (charRect.top - overlayRect.top) + 'px';
      cursor.style.height = charRect.height + 'px';
    }
  }

  /**
   * Highlights progress by marking completed characters
   * @param {number} completedChars - Number of characters completed
   */
  highlightProgress(completedChars) {
    if (!this.overlayElement) {
      return;
    }

    const chars = this.overlayElement.querySelectorAll('.typing-char');
    
    chars.forEach((char, index) => {
      char.classList.remove('completed', 'current', 'error');
      
      if (index < completedChars) {
        char.classList.add('completed');
      } else if (index === completedChars) {
        char.classList.add('current');
      }
    });
    
    // Update cursor position
    this.updateCursor(completedChars);
  }

  /**
   * Shows error indication at the specified position
   * @param {number} position - Character position where error occurred
   */
  showError(position) {
    if (!this.overlayElement) {
      return;
    }

    const chars = this.overlayElement.querySelectorAll('.typing-char');
    const errorChar = chars[position];
    
    if (errorChar) {
      errorChar.classList.add('error');
      
      // Add to session errors
      if (this.session) {
        this.session.errors.push({
          position: position,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Clears error indication at the specified position
   * @param {number} position - Character position to clear error from
   */
  clearError(position) {
    if (!this.overlayElement) {
      return;
    }

    const chars = this.overlayElement.querySelectorAll('.typing-char');
    const char = chars[position];
    
    if (char) {
      char.classList.remove('error');
    }
  }

  /**
   * Applies CSS styles to the overlay element
   */
  applyOverlayStyles() {
    if (!this.overlayElement) {
      return;
    }

    // Create style element if it doesn't exist
    let styleElement = document.getElementById('typing-practice-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'typing-practice-styles';
      document.head.appendChild(styleElement);
    }

    // Define comprehensive overlay styles with format preservation
    const styles = `
      .typing-practice-overlay {
        z-index: 9999;
        background: transparent;
        border: 2px solid #4CAF50;
        border-radius: 4px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: inherit;
        line-height: inherit;
        word-wrap: break-word;
        overflow-wrap: break-word;
        backdrop-filter: blur(2px);
      }
      
      .typing-content {
        position: relative;
        white-space: pre-wrap;
        word-break: break-word;
      }
      
      .typing-char {
        position: relative;
        transition: background-color 0.2s ease, transform 0.1s ease;
        display: inline;
      }
      
      .typing-char.completed {
        background-color: rgba(200, 230, 201, 0.7);
        color: inherit;
      }
      
      .typing-char.current {
        background-color: rgba(255, 249, 196, 0.9);
        outline: 2px solid #FFC107;
        outline-offset: 1px;
        border-radius: 2px;
      }
      
      .typing-char.error {
        background-color: rgba(255, 205, 210, 0.9);
        color: inherit;
        animation: shake 0.3s ease-in-out;
        border-radius: 2px;
      }
      
      .typing-char.skippable-char {
        background-color: rgba(225, 245, 254, 0.6);
        border-bottom: 1px dotted #0277BD;
        cursor: help;
      }
      
      .typing-cursor {
        position: absolute;
        color: #4CAF50;
        font-weight: bold;
        animation: blink 1s infinite;
        pointer-events: none;
        z-index: 1;
        font-size: inherit;
      }
      
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }
      
      /* Special character handling */
      .space-char {
        border-bottom: 1px solid rgba(204, 204, 204, 0.5);
        min-width: 0.5em;
        display: inline-block;
      }
      
      .newline-char {
        display: block;
        height: 1em;
        width: 100%;
      }
      
      .tab-char {
        border-bottom: 1px dotted rgba(204, 204, 204, 0.5);
        min-width: 2em;
        display: inline-block;
      }
      
      /* Preserve original formatting with enhanced support */
      .original-h1, .original-h2, .original-h3, .original-h4, .original-h5, .original-h6 {
        font-weight: bold;
        display: inline;
      }
      
      .original-strong, .original-b, .role-emphasis {
        font-weight: bold;
      }
      
      .original-em, .original-i {
        font-style: italic;
      }
      
      .original-u, .original-ins {
        text-decoration: underline;
      }
      
      .original-s, .original-del {
        text-decoration: line-through;
      }
      
      .original-a, .role-link {
        color: #1976D2;
        text-decoration: underline;
        cursor: pointer;
      }
      
      .original-a:hover, .role-link:hover {
        background-color: rgba(25, 118, 210, 0.1);
      }
      
      .original-code, .role-code {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        background-color: rgba(245, 245, 245, 0.8);
        padding: 1px 3px;
        border-radius: 2px;
        font-size: 0.9em;
      }
      
      .original-pre, .role-code-block {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        background-color: rgba(245, 245, 245, 0.8);
        padding: 4px 6px;
        border-radius: 3px;
        display: inline-block;
        white-space: pre;
      }
      
      .original-mark {
        background-color: rgba(255, 255, 0, 0.6);
        padding: 1px 2px;
      }
      
      .original-sup {
        vertical-align: super;
        font-size: 0.75em;
      }
      
      .original-sub {
        vertical-align: sub;
        font-size: 0.75em;
      }
      
      .original-blockquote, .role-blockquote {
        border-left: 3px solid #ccc;
        padding-left: 8px;
        margin-left: 4px;
        font-style: italic;
        display: inline-block;
      }
      
      .original-small {
        font-size: 0.8em;
      }
      
      .original-big {
        font-size: 1.2em;
      }
      
      /* Semantic role styling */
      .role-heading-1, .role-heading-2, .role-heading-3,
      .role-heading-4, .role-heading-5, .role-heading-6 {
        font-weight: bold;
        display: inline;
      }
      
      .role-paragraph {
        display: inline;
      }
      
      .role-list-item {
        display: inline;
      }
      
      /* Accessibility and visual enhancements */
      .typing-char[data-original-href] {
        position: relative;
      }
      
      .typing-char[data-original-href]:hover::after {
        content: attr(data-original-href);
        position: absolute;
        bottom: 100%;
        left: 0;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .typing-practice-overlay {
          background: white;
          border-color: black;
        }
        
        .typing-char.completed {
          background-color: #90EE90;
          color: black;
        }
        
        .typing-char.error {
          background-color: #FFB6C1;
          color: black;
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .typing-practice-overlay {
          background: rgba(33, 33, 33, 0.95);
          border-color: #4CAF50;
          color: white;
        }
        
        .original-code, .role-code {
          background-color: rgba(66, 66, 66, 0.8);
          color: #E0E0E0;
        }
      }
    `;

    styleElement.textContent = styles;
  }

  /**
   * Gets the current session information
   * @returns {Object|null} Current session object or null
   */
  getSession() {
    return this.session;
  }

  /**
   * Gets the current typing position
   * @returns {number} Current character position
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * Checks if the typing interface is initialized
   * @returns {boolean} True if initialized
   */
  isActive() {
    return this.isInitialized && this.overlayElement !== null;
  }

  /**
   * Cleans up the typing interface and removes overlay
   */
  cleanup() {
    // Restore original content first
    this.restoreOriginalContent();
    
    // Remove overlay element
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    
    // Clean up styles
    const styleElement = document.getElementById('typing-practice-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    
    this.overlayElement = null;
    this.session = null;
    this.currentPosition = 0;
    this.isInitialized = false;
    
    console.log('TypingInterface cleaned up and original content restored');
  }
}

/**
 * InputProcessor class - handles keystroke processing and validation
 * Implements requirements 1.4, 1.5, 2.1, 2.2, 2.3, 2.4 for input processing and shortcuts
 */
class InputProcessor {
  constructor(typingInterface) {
    this.typingInterface = typingInterface;
    this.currentPosition = 0;
    this.isProcessing = false;
    this.eventListeners = [];
    
    // Shortcut definitions
    this.shortcuts = {
      SKIP_CHAR: 'Tab',
      SKIP_PARAGRAPH: 'Shift+Tab', 
      EXIT_SESSION: 'Escape'
    };
    
    // Initialize event listeners
    this.setupEventListeners();
  }

  /**
   * Sets up keyboard event listeners for input processing
   */
  setupEventListeners() {
    const keydownHandler = (event) => this.handleKeyDown(event);
    const keypressHandler = (event) => this.handleKeyPress(event);
    
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keypress', keypressHandler);
    
    // Store listeners for cleanup
    this.eventListeners.push(
      { element: document, event: 'keydown', handler: keydownHandler },
      { element: document, event: 'keypress', handler: keypressHandler }
    );
  }

  /**
   * Handles keydown events for shortcuts and special keys
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    if (!this.typingInterface || !this.typingInterface.isActive()) {
      return;
    }

    // Check for shortcuts first
    if (this.isShortcut(event)) {
      event.preventDefault();
      this.handleShortcut(event);
      return;
    }

    // Handle special keys that don't generate keypress events
    if (this.isSpecialKey(event.key)) {
      event.preventDefault();
      this.processSpecialKey(event);
    }
  }

  /**
   * Handles keypress events for regular character input
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyPress(event) {
    if (!this.typingInterface || !this.typingInterface.isActive()) {
      return;
    }

    // Prevent default to avoid any browser behavior
    event.preventDefault();
    
    // Process the character input
    this.processKeyInput(event);
  }

  /**
   * Processes keyboard input and validates against expected character
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {Object} InputResult object with validation results
   */
  processKeyInput(event) {
    if (this.isProcessing) {
      return { success: false, reason: 'already_processing' };
    }

    this.isProcessing = true;

    try {
      const session = this.typingInterface.getSession();
      if (!session) {
        return { success: false, reason: 'no_session' };
      }

      const inputChar = event.char || event.key;
      const expectedChar = session.content.text[this.currentPosition];
      
      // Validate the character input
      const isValid = this.validateCharacter(inputChar, expectedChar);
      
      const result = {
        success: isValid,
        inputChar: inputChar,
        expectedChar: expectedChar,
        position: this.currentPosition,
        timestamp: new Date()
      };

      if (isValid) {
        this.handleCorrectInput(result);
      } else {
        this.handleIncorrectInput(result);
      }

      return result;

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Validates if input character matches expected character
   * @param {string} input - Input character from user
   * @param {string} expected - Expected character from text
   * @returns {boolean} True if characters match
   */
  validateCharacter(input, expected) {
    if (!input || !expected) {
      return false;
    }

    // Direct character match
    if (input === expected) {
      return true;
    }

    // Handle special character equivalencies
    return this.areCharactersEquivalent(input, expected);
  }

  /**
   * Checks if two characters are equivalent for typing purposes
   * @param {string} input - Input character
   * @param {string} expected - Expected character
   * @returns {boolean} True if characters are equivalent
   */
  areCharactersEquivalent(input, expected) {
    // Handle space variations
    if ((input === ' ' || input === '\u00A0') && (expected === ' ' || expected === '\u00A0')) {
      return true;
    }

    // Handle newline variations
    if ((input === '\n' || input === '\r') && (expected === '\n' || expected === '\r')) {
      return true;
    }

    // Handle tab variations
    if (input === '\t' && expected === '\t') {
      return true;
    }

    // Case-insensitive matching for letters (optional enhancement)
    if (input.toLowerCase() === expected.toLowerCase() && /[a-zA-Z]/.test(input)) {
      return true;
    }

    return false;
  }

  /**
   * Handles correct character input
   * @param {Object} result - Input result object
   */
  handleCorrectInput(result) {
    // Advance position
    this.currentPosition++;
    
    // Update typing interface
    this.typingInterface.highlightProgress(this.currentPosition);
    this.typingInterface.clearError(result.position);
    
    // Check if typing is complete
    const session = this.typingInterface.getSession();
    console.log('Position check:', {
      currentPosition: this.currentPosition,
      textLength: session ? session.content.text.length : 'no session',
      isComplete: session ? this.currentPosition >= session.content.text.length : 'no session',
      textPreview: session ? session.content.text.substring(0, 50) + '...' : 'no session'
    });
    
    // Only complete if we actually have text and position is at the end
    if (session && session.content.text.length > 0 && this.currentPosition >= session.content.text.length) {
      this.handleTypingComplete();
    }

    console.log(`Correct input: "${result.inputChar}" at position ${result.position}`);
  }

  /**
   * Handles incorrect character input
   * @param {Object} result - Input result object
   */
  handleIncorrectInput(result) {
    // Show error indication
    this.typingInterface.showError(result.position);
    
    // Do not advance position - user must correct the error
    console.log(`Incorrect input: "${result.inputChar}" expected "${result.expectedChar}" at position ${result.position}`);
  }

  /**
   * Handles typing session completion
   */
  handleTypingComplete() {
    console.log('Typing session completed!');
    
    // Show completion message
    showTemporaryMessage('Typing practice completed! Great job!', 'success');
    
    // Clean up after a short delay to show completion
    setTimeout(() => {
      cleanupCurrentSession();
    }, 2000);
  }

  /**
   * Checks if a keyboard event represents a shortcut
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} True if event is a shortcut
   */
  isShortcut(event) {
    // Tab key (skip character)
    if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      return true;
    }
    
    // Shift+Tab (skip paragraph)
    if (event.key === 'Tab' && event.shiftKey && !event.ctrlKey && !event.altKey) {
      return true;
    }
    
    // Escape key (exit session)
    if (event.key === 'Escape' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      return true;
    }

    return false;
  }

  /**
   * Handles keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleShortcut(event) {
    const session = this.typingInterface.getSession();
    if (!session) {
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey) {
      // Skip current character (Tab key)
      this.skipCharacter();
    } else if (event.key === 'Tab' && event.shiftKey) {
      // Skip to next paragraph (Shift+Tab)
      this.skipParagraph();
    } else if (event.key === 'Escape') {
      // Exit typing session (Escape key)
      this.exitSession();
    }
  }

  /**
   * Skips the current character (Tab key functionality)
   * Implements requirement 2.1
   */
  skipCharacter() {
    const session = this.typingInterface.getSession();
    if (!session || this.currentPosition >= session.content.text.length) {
      return;
    }

    const currentChar = session.content.text[this.currentPosition];
    
    // Mark character as skipped
    this.markCharacterAsSkipped(this.currentPosition);
    
    // Advance position
    this.currentPosition++;
    
    // Update interface
    this.typingInterface.highlightProgress(this.currentPosition);
    
    console.log(`Skipped character: "${currentChar}" at position ${this.currentPosition - 1}`);
    
    // Check if typing is complete - only if we have text
    if (session.content.text.length > 0 && this.currentPosition >= session.content.text.length) {
      this.handleTypingComplete();
    }
  }

  /**
   * Skips to the next paragraph or text element (Shift+Tab functionality)
   * Implements requirement 2.2
   */
  skipParagraph() {
    const session = this.typingInterface.getSession();
    if (!session || this.currentPosition >= session.content.text.length) {
      return;
    }

    const text = session.content.text;
    const startPosition = this.currentPosition;
    
    // Find next paragraph break or significant text boundary
    let nextPosition = this.findNextParagraphBoundary(text, this.currentPosition);
    
    // If no paragraph boundary found, skip to end
    if (nextPosition === -1) {
      nextPosition = text.length;
    }

    // Mark all skipped characters
    for (let i = this.currentPosition; i < nextPosition; i++) {
      this.markCharacterAsSkipped(i);
    }

    // Update position
    this.currentPosition = nextPosition;
    
    // Update interface
    this.typingInterface.highlightProgress(this.currentPosition);
    
    const skippedCount = nextPosition - startPosition;
    console.log(`Skipped paragraph: ${skippedCount} characters from position ${startPosition} to ${nextPosition}`);
    
    // Check if typing is complete - only if we have text
    if (session.content.text.length > 0 && this.currentPosition >= session.content.text.length) {
      this.handleTypingComplete();
    }
  }

  /**
   * Finds the next paragraph boundary in the text
   * @param {string} text - Text content
   * @param {number} startPos - Starting position
   * @returns {number} Position of next paragraph boundary or -1 if not found
   */
  findNextParagraphBoundary(text, startPos) {
    // Look for double newlines (paragraph breaks)
    let pos = text.indexOf('\n\n', startPos);
    if (pos !== -1) {
      return pos + 2; // Skip past the double newline
    }

    // Look for single newlines followed by significant content
    pos = text.indexOf('\n', startPos);
    while (pos !== -1 && pos < text.length - 1) {
      const nextChar = text[pos + 1];
      // If next character after newline is not whitespace, it's likely a new paragraph
      if (nextChar && !/\s/.test(nextChar)) {
        return pos + 1;
      }
      pos = text.indexOf('\n', pos + 1);
    }

    // Look for sentence boundaries (periods followed by spaces and capital letters)
    const sentenceRegex = /[.!?]\s+[A-Z]/g;
    sentenceRegex.lastIndex = startPos;
    const match = sentenceRegex.exec(text);
    if (match) {
      return match.index + 2; // Position after period and space
    }

    return -1; // No boundary found
  }

  /**
   * Exits the current typing session (Escape key functionality)
   * Implements requirement 2.3
   */
  exitSession() {
    console.log('Exiting typing session via Escape key');
    
    // Show exit message
    showTemporaryMessage('Typing session ended', 'info');
    
    // Clean up the entire session
    cleanupCurrentSession();
  }

  /**
   * Marks a character as skipped for metrics tracking
   * @param {number} position - Character position to mark as skipped
   */
  markCharacterAsSkipped(position) {
    const session = this.typingInterface.getSession();
    if (!session) {
      return;
    }

    // Initialize skipped characters array if it doesn't exist
    if (!session.skippedCharacters) {
      session.skippedCharacters = [];
    }

    // Add to skipped characters list
    session.skippedCharacters.push({
      position: position,
      character: session.content.text[position],
      timestamp: new Date(),
      method: 'shortcut'
    });
  }

  /**
   * Checks if a key is a special key that doesn't generate keypress events
   * @param {string} key - Key name
   * @returns {boolean} True if key is special
   */
  isSpecialKey(key) {
    const specialKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'
    ];
    return specialKeys.includes(key);
  }

  /**
   * Processes special keys that don't generate keypress events
   * @param {KeyboardEvent} event - Keyboard event
   */
  processSpecialKey(event) {
    switch (event.key) {
      case 'Backspace':
        this.handleBackspace();
        break;
      case 'Delete':
        // Delete key doesn't make sense in typing practice, ignore
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'Home':
      case 'End':
      case 'PageUp':
      case 'PageDown':
        // Navigation keys don't make sense in typing practice, ignore
        break;
    }
  }

  /**
   * Handles backspace key (allows correction of errors)
   */
  handleBackspace() {
    if (this.currentPosition > 0) {
      // Move back one position
      this.currentPosition--;
      
      // Clear any error at the previous position
      this.typingInterface.clearError(this.currentPosition);
      
      // Update interface
      this.typingInterface.highlightProgress(this.currentPosition);
      
      console.log(`Backspace: moved to position ${this.currentPosition}`);
    }
  }

  /**
   * Gets the current typing position
   * @returns {number} Current character position
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * Sets the current typing position
   * @param {number} position - New position
   */
  setCurrentPosition(position) {
    const session = this.typingInterface.getSession();
    if (session && position >= 0 && position <= session.content.text.length) {
      this.currentPosition = position;
      this.typingInterface.highlightProgress(this.currentPosition);
    }
  }

  /**
   * Checks if input processing is currently active
   * @returns {boolean} True if processing is active
   */
  isActive() {
    return this.typingInterface && this.typingInterface.isActive();
  }

  /**
   * Cleans up event listeners and resets state
   */
  cleanup() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Clean up typing interface
    if (this.typingInterface) {
      this.typingInterface.cleanup();
    }

    // Reset state
    this.currentPosition = 0;
    this.isProcessing = false;
    this.typingInterface = null;

    console.log('InputProcessor cleaned up');
  }
}



// Initialize content script when DOM is ready (only in browser environment)
if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof jest === 'undefined') {
  console.log('Content script loading...');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
  } else {
    initializeContentScript();
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TextSelectionHandler,
    TypingInterface,
    InputProcessor
  };
}