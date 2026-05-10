export function renderReport({ reportTextArea, summaryView, copyButton, downloadButton }, generated) {
  if (!generated) {
    reportTextArea.value = '';
    summaryView.innerHTML = '';
    copyButton.disabled = true;
    downloadButton.disabled = true;
    return;
  }

  reportTextArea.value = generated.reportText;
  copyButton.disabled = false;
  downloadButton.disabled = generated.skipped;
  summaryView.innerHTML = `
    <div class="summary-grid">
      <div><strong>${generated.records.length}</strong><span>投注数</span></div>
      <div><strong>${generated.results.filter((item) => item.prizeAmount > 0).length}</strong><span>中奖数</span></div>
      <div><strong>${generated.poolRecord.closingBalance}</strong><span>奖池余额 Hao币</span></div>
    </div>
  `;
}
