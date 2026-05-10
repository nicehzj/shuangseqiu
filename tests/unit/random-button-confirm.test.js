import { beforeEach, describe, expect, it, vi } from 'vitest';

function setupDom() {
  document.body.innerHTML = `
    <input id="workbookFile" type="file" />
    <input id="drawDate" type="date" />
    <input id="issue" />
    <select id="playType"><option value="ordinary">普通日玩法</option></select>
    <input id="poolAdjustment" />
    <input id="redBalls" />
    <input id="blueBall" />
    <button id="randomNumbersButton" type="button">随机生成开奖号码</button>
    <textarea id="bettingText"></textarea>
    <button id="generateButton" type="button"></button>
    <button id="downloadButton" type="button"></button>
    <button id="copyButton" type="button"></button>
    <textarea id="reportText"></textarea>
    <div id="validationView"></div>
    <div id="summaryView"></div>
    <div id="status"></div>
    <div id="duplicatePanel" class="hidden"></div>
    <div id="duplicateMessage"></div>
  `;
}

describe('random number button confirmation', () => {
  beforeEach(async () => {
    vi.resetModules();
    setupDom();
    vi.spyOn(window, 'confirm').mockReset();
    await import('../../src/app.js');
  });

  it('does not overwrite existing numbers when confirmation is cancelled', () => {
    document.querySelector('#redBalls').value = '01 02 03 04 05 06';
    document.querySelector('#blueBall').value = '07';
    window.confirm.mockReturnValue(false);

    document.querySelector('#randomNumbersButton').click();

    expect(window.confirm).toHaveBeenCalled();
    expect(document.querySelector('#redBalls').value).toBe('01 02 03 04 05 06');
    expect(document.querySelector('#blueBall').value).toBe('07');
    expect(document.querySelector('#status').textContent).toBe('已保留现有开奖号码');
  });
});
