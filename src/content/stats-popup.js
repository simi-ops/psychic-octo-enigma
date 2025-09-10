/**
 * Stats Popup - Shows typing stats and instructions
 */
class StatsPopup {
  constructor() {
    this.popup = null;
    this.startTime = null;
    this.totalChars = 0;
    this.completedChars = 0;
    this.errors = 0;
  }

  show(totalCharacters) {
    this.startTime = Date.now();
    this.totalChars = totalCharacters;
    this.completedChars = 0;
    this.errors = 0;

    this.popup = document.createElement('div');
    this.popup.className = 'typing-stats-popup';
    this.popup.innerHTML = `
      <div class="stats-header">Typing Practice</div>
      <div class="stats-content">
        <div class="stat-item">
          <span class="stat-label">WPM:</span>
          <span class="stat-value" id="wpm-value">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Accuracy:</span>
          <span class="stat-value" id="accuracy-value">100%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Progress:</span>
          <span class="stat-value" id="progress-value">0/${totalCharacters}</span>
        </div>
      </div>
      <div class="instructions">
        <div>• Type to match the text</div>
        <div>• Press <kbd>Esc</kbd> to exit</div>
      </div>
      <button class="close-btn" onclick="window.statsPopup.hide()">×</button>
    `;

    document.body.appendChild(this.popup);
    this.addStyles();
  }

  update(completedChars, errorCount) {
    if (!this.popup) return;

    this.completedChars = completedChars;
    this.errors = errorCount;

    const timeElapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const wpm = timeElapsed > 0 ? Math.round((completedChars / 5) / timeElapsed) : 0;
    const accuracy = this.completedChars > 0 ? Math.round(((this.completedChars - this.errors) / this.completedChars) * 100) : 100;

    document.getElementById('wpm-value').textContent = wpm;
    document.getElementById('accuracy-value').textContent = accuracy + '%';
    document.getElementById('progress-value').textContent = `${completedChars}/${this.totalChars}`;
  }

  showSummary() {
    console.log('showSummary() called');
    if (!this.popup) {
      console.log('No popup exists for summary');
      return;
    }

    const timeElapsed = (Date.now() - this.startTime) / 1000;
    const wpm = timeElapsed > 0 ? Math.round((this.completedChars / 5) / (timeElapsed / 60)) : 0;
    const accuracy = this.completedChars > 0 ? Math.round(((this.completedChars - this.errors) / this.completedChars) * 100) : 100;

    console.log('Summary stats:', { wpm, accuracy, timeElapsed, completedChars: this.completedChars, errors: this.errors });

    this.popup.innerHTML = `
      <div class="stats-header">🎉 Session Complete!</div>
      <div class="summary-content">
        <div class="summary-stat">
          <div class="summary-label">Final WPM</div>
          <div class="summary-value">${wpm}</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Accuracy</div>
          <div class="summary-value">${accuracy}%</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Time</div>
          <div class="summary-value">${Math.round(timeElapsed)}s</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Characters</div>
          <div class="summary-value">${this.completedChars}</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Errors</div>
          <div class="summary-value">${this.errors}</div>
        </div>
      </div>
      <button class="summary-close-btn" onclick="window.statsPopup.hide()">Close</button>
    `;

    setTimeout(() => this.hide(), 5000); // Auto-close after 5 seconds
  }

  hide() {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

  addStyles() {
    if (document.getElementById('stats-popup-styles')) return;

    const style = document.createElement('style');
    style.id = 'stats-popup-styles';
    style.textContent = `
      .typing-stats-popup {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        min-width: 200px;
      }

      .stats-header {
        font-weight: bold;
        text-align: center;
        margin-bottom: 12px;
        color: #4CAF50;
        font-size: 16px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .stat-label {
        font-weight: 500;
      }

      .stat-value {
        font-weight: bold;
        color: #2E7D32;
      }

      .instructions {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
      }

      .instructions div {
        margin-bottom: 4px;
      }

      .instructions kbd {
        background: #f5f5f5;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: 11px;
      }

      .close-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-btn:hover {
        color: #666;
        background: #f0f0f0;
        border-radius: 50%;
      }

      .summary-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .summary-stat {
        text-align: center;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
      }

      .summary-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }

      .summary-value {
        font-size: 18px;
        font-weight: bold;
        color: #2E7D32;
      }

      .summary-close-btn {
        width: 100%;
        padding: 8px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }

      .summary-close-btn:hover {
        background: #45a049;
      }
    `;
    document.head.appendChild(style);
  }
}

window.statsPopup = new StatsPopup();
