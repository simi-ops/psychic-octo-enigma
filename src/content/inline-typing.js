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
  }

  startTyping(paragraphElement) {
    this.originalElement = paragraphElement;
    this.originalText = paragraphElement.textContent;
    this.currentPosition = 0;
    this.isActive = true;

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
        
        if (this.currentPosition >= this.originalText.length) {
          setTimeout(() => this.cleanup(), 1000);
        } else {
          this.setCursor(this.currentPosition);
        }
      } else {
        span.classList.add('error');
        setTimeout(() => span.classList.remove('error'), 300);
      }
    };

    document.addEventListener('keydown', this.keyHandler);
  }

  cleanup() {
    if (this.originalElement) {
      this.originalElement.contentEditable = false;
      this.originalElement.textContent = this.originalText;
    }
    
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    
    this.isActive = false;
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
