/**
 * Inline Typing - Types directly on the original paragraph
 */
class InlineTyping {
  constructor() {
    this.originalElement = null;
    this.originalText = '';
    this.currentPosition = 0;
    this.isActive = false;
    this.keyHandler = null;
    this.errorCount = 0;
  }

  startTyping(paragraphElement) {
    this.originalElement = paragraphElement;
    this.originalText = paragraphElement.textContent;
    this.currentPosition = 0;
    this.errorCount = 0;
    this.isActive = true;

    // Show stats popup
    window.statsPopup.show(this.originalText.length);

    // Make editable and clear content
    paragraphElement.contentEditable = true;
    paragraphElement.innerHTML = '';
    
    // Create character spans
    for (let i = 0; i < this.originalText.length; i++) {
      const span = document.createElement('span');
      span.textContent = this.originalText[i];
      span.className = 'typing-char';
      paragraphElement.appendChild(span);
    }
    
    // Focus and position cursor
    paragraphElement.focus();
    this.setCursor(0);
    this.setupKeyListener();
  }

  setCursor(position) {
    const selection = window.getSelection();
    const range = document.createRange();
    
    if (position < this.originalElement.children.length) {
      const span = this.originalElement.children[position];
      range.setStart(span, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  setupKeyListener() {
    this.keyHandler = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      
      if (e.key === 'Escape') {
        this.cleanup();
        return;
      }

      const expected = this.originalText[this.currentPosition];
      const span = this.originalElement.children[this.currentPosition];
      
      if (e.key === expected) {
        span.classList.add('completed');
        this.currentPosition++;
        
        // Update stats
        window.statsPopup.update(this.currentPosition, this.errorCount);
        
        if (this.currentPosition >= this.originalText.length) {
          // Show summary and cleanup without hiding popup
          window.statsPopup.showSummary();
          this.cleanupWithoutHidingPopup();
        } else {
          this.setCursor(this.currentPosition);
        }
      } else {
        this.errorCount++;
        span.classList.add('error');
        window.statsPopup.update(this.currentPosition, this.errorCount);
        setTimeout(() => span.classList.remove('error'), 300);
      }
    };

    document.addEventListener('keydown', this.keyHandler);
  }

  cleanupWithoutHidingPopup() {
    if (this.originalElement) {
      this.originalElement.contentEditable = false;
      this.originalElement.textContent = this.originalText;
    }
    
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    
    this.isActive = false;
  }

  cleanup() {
    this.cleanupWithoutHidingPopup();
    window.statsPopup.hide();
  }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  .typing-char { position: relative; }
  .typing-char.completed { background: #c8e6c9; }
  .typing-char.error { background: #ffcdd2; }
`;
document.head.appendChild(style);

// Global instance
window.inlineTyping = new InlineTyping();
