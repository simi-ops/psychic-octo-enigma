/**
 * Personal Records - Track best WPM and accuracy
 */
class PersonalRecords {
  constructor() {
    this.records = this.loadRecords();
  }

  loadRecords() {
    const saved = localStorage.getItem('typing-practice-records');
    return saved ? JSON.parse(saved) : {
      bestWPM: 0,
      bestAccuracy: 0,
      totalSessions: 0,
      averageWPM: 0
    };
  }

  saveRecords() {
    localStorage.setItem('typing-practice-records', JSON.stringify(this.records));
  }

  updateRecords(wpm, accuracy) {
    let isNewRecord = false;
    const updates = [];

    // Check for new WPM record
    if (wpm > this.records.bestWPM) {
      this.records.bestWPM = wpm;
      updates.push(`🎉 New WPM Record: ${wpm}!`);
      isNewRecord = true;
    }

    // Check for new accuracy record
    if (accuracy > this.records.bestAccuracy) {
      this.records.bestAccuracy = accuracy;
      updates.push(`🎯 New Accuracy Record: ${accuracy}%!`);
      isNewRecord = true;
    }

    // Update session stats
    this.records.totalSessions++;
    this.records.averageWPM = Math.round(
      ((this.records.averageWPM * (this.records.totalSessions - 1)) + wpm) / this.records.totalSessions
    );

    this.saveRecords();

    return { isNewRecord, updates };
  }

  getRecords() {
    return this.records;
  }

  addRecordsToSummary(summaryElement) {
    const recordsDiv = document.createElement('div');
    recordsDiv.className = 'personal-records';
    recordsDiv.innerHTML = `
      <div class="records-title">Personal Records</div>
      <div class="records-grid">
        <div class="record-item">
          <div class="record-label">Best WPM</div>
          <div class="record-value">${this.records.bestWPM}</div>
        </div>
        <div class="record-item">
          <div class="record-label">Best Accuracy</div>
          <div class="record-value">${this.records.bestAccuracy}%</div>
        </div>
        <div class="record-item">
          <div class="record-label">Sessions</div>
          <div class="record-value">${this.records.totalSessions}</div>
        </div>
        <div class="record-item">
          <div class="record-label">Avg WPM</div>
          <div class="record-value">${this.records.averageWPM}</div>
        </div>
      </div>
    `;

    summaryElement.appendChild(recordsDiv);
  }
}

window.personalRecords = new PersonalRecords();
