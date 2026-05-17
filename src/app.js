import { parseBettingText } from './parser/betting-parser.js';
import { calculateResults, validateWinningNumbers } from './domain/calculator.js';
import { updatePrizePool } from './domain/prize-pool.js';
import { updateRankings } from './domain/rankings.js';
import { generateBattleReport } from './domain/report.js';
import { detectDuplicate, readWorkbookFromFile } from './excel/workbook-reader.js';
import { downloadWorkbook, writeUpdatedWorkbook } from './excel/workbook-writer.js';
import { createInitialState, applyDuplicateDecision } from './ui/state.js';
import { renderValidation } from './ui/validation-view.js';
import { renderReport } from './ui/report-view.js';
import { issueFromDate } from './domain/issue.js';
import { generateWinningNumbers } from './domain/winning-number-generator.js';
import { formatBallNumber, formatBallNumbers } from './domain/rules.js';
import { applyBetFunding, deriveAccountBalances } from './domain/accounting.js';
import { calculateOpeningBalance, parsePoolAdjustment } from './domain/pool-adjustment.js';
import { buildRedistributionCandidates, runRedistribution } from './domain/redistribution.js';

const elements = {
  workbookFile: document.querySelector('#workbookFile'),
  drawDate: document.querySelector('#drawDate'),
  issue: document.querySelector('#issue'),
  playType: document.querySelector('#playType'),
  poolAdjustment: document.querySelector('#poolAdjustment'),
  redistributionRichPoolSize: document.querySelector('#redistributionRichPoolSize'),
  redistributionPoorPoolSize: document.querySelector('#redistributionPoorPoolSize'),
  redBalls: document.querySelector('#redBalls'),
  blueBall: document.querySelector('#blueBall'),
  randomNumbersButton: document.querySelector('#randomNumbersButton'),
  bettingText: document.querySelector('#bettingText'),
  generateButton: document.querySelector('#generateButton'),
  downloadButton: document.querySelector('#downloadButton'),
  copyButton: document.querySelector('#copyButton'),
  reportTextArea: document.querySelector('#reportText'),
  validationView: document.querySelector('#validationView'),
  summaryView: document.querySelector('#summaryView'),
  status: document.querySelector('#status'),
  duplicatePanel: document.querySelector('#duplicatePanel'),
  duplicateMessage: document.querySelector('#duplicateMessage')
};

let state = createInitialState();

elements.drawDate.valueAsDate = new Date();
syncIssueFromDate();

elements.drawDate.addEventListener('change', () => {
  syncIssueFromDate();
  state = {
    ...state,
    duplicate: null,
    duplicateDecision: null,
    generated: null
  };
  elements.duplicatePanel.classList.add('hidden');
  renderReport(elements, null);
  setStatus('日期已更新');
});

elements.workbookFile.addEventListener('change', async () => {
  const file = elements.workbookFile.files?.[0];
  if (!file) {
    return;
  }
  try {
    state.history = await readWorkbookFromFile(file);
    if (!state.history.valid) {
      renderValidation(elements.validationView, state.history.errors);
      setStatus('Excel 校验失败');
      return;
    }
    if (state.history.missingSheets.length) {
      renderValidation(elements.validationView, state.history.warnings);
      setStatus('Excel 已读取，缺失 sheet 将自动补齐');
      return;
    }
    renderValidation(elements.validationView, []);
    setStatus('Excel 已读取');
  } catch (error) {
    renderValidation(elements.validationView, [`Excel 读取失败：${error.message}`]);
    setStatus('Excel 读取失败');
  }
});

elements.generateButton.addEventListener('click', () => {
  generate();
});

elements.randomNumbersButton.addEventListener('click', () => {
  try {
    if (hasWinningNumbersInput() && !window.confirm('当前已经有开奖号码。一天只能开奖一次，确认要重新随机生成并覆盖现有号码吗？')) {
      setStatus('已保留现有开奖号码');
      return;
    }
    const numbers = generateWinningNumbers();
    elements.redBalls.value = formatBallNumbers(numbers.redBalls);
    elements.blueBall.value = formatBallNumber(numbers.blueBall);
    state = {
      ...state,
      duplicateDecision: null,
      generated: null
    };
    renderReport(elements, null);
    setStatus('开奖号码已生成');
  } catch (error) {
    renderValidation(elements.validationView, [`随机生成失败：${error.message}`]);
    setStatus('随机生成失败');
  }
});

elements.downloadButton.addEventListener('click', () => {
  if (state.generated?.workbook) {
    downloadWorkbook(state.generated.workbook, `双色球战报-${state.generated.date}-${state.generated.issue || 'new'}.xlsx`);
  }
});

elements.copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(elements.reportTextArea.value);
  setStatus('战报已复制');
});

elements.duplicatePanel.addEventListener('click', (event) => {
  const decision = event.target?.dataset?.duplicate;
  if (!decision) {
    return;
  }
  state = applyDuplicateDecision(state, decision);
  elements.duplicatePanel.classList.add('hidden');
  generate();
});

function generate() {
  const messages = [];
  if (!state.history) {
    messages.push('请先上传历史 Excel');
  } else if (!state.history.valid) {
    messages.push(...state.history.errors);
  }

  const date = elements.drawDate.value;
  const issue = elements.issue.value.trim();
  const playType = elements.playType.value;
  const poolAdjustment = parsePoolAdjustment(elements.poolAdjustment.value);
  if (!poolAdjustment.valid) {
    messages.push(poolAdjustment.error);
  }
  const redistributionConfig = parseRedistributionConfig(
    elements.redistributionRichPoolSize.value,
    elements.redistributionPoorPoolSize.value
  );
  if (!redistributionConfig.valid) {
    messages.push(...redistributionConfig.errors);
  }
  const winningRedBalls = parseNumberInput(elements.redBalls.value);
  const winningBlueBall = Number(elements.blueBall.value);
  const winningValidation = validateWinningNumbers(winningRedBalls, winningBlueBall);
  if (!winningValidation.valid) {
    messages.push(...winningValidation.errors);
  }

  const parseResult = parseBettingText(elements.bettingText.value);
  state.parseResult = parseResult;
  messages.push(...parseResult.errors);

  if (messages.length) {
    renderValidation(elements.validationView, messages);
    renderReport(elements, null);
    setStatus('请修正输入');
    return;
  }

  const duplicate = detectDuplicate(state.history, date, issue);
  state.duplicate = duplicate;
  if (duplicate.duplicate && !state.duplicateDecision) {
    elements.duplicateMessage.textContent = duplicate.message;
    elements.duplicatePanel.classList.remove('hidden');
    renderValidation(elements.validationView, [duplicate.message]);
    setStatus('等待重复处理选择');
    return;
  }

  const excelOpeningBalance = state.history.prizePoolRecords.at(-1)?.closingBalance ?? 0;
  const openingBalance = calculateOpeningBalance(excelOpeningBalance, poolAdjustment.amount);
  const winningNumbers = {
    redBalls: winningValidation.redBalls,
    blueBall: winningValidation.blueBall
  };
  const fundedRecords = applyBetFunding(parseResult.records, deriveAccountBalances(state.history.personalRecords));
  const validRecords = fundedRecords.filter((record) => record.valid);
  const invalidRecords = fundedRecords.filter((record) => !record.valid);
  const income = fundedRecords.reduce((sum, record) => sum + Number(record.contribution || 0), 0);
  const results = calculateResults(validRecords, winningNumbers, playType, { openingBalance, income });
  const poolRecord = updatePrizePool({
    date,
    issue,
    openingBalance,
    betCount: fundedRecords.length,
    results,
    playType,
    incomeOverride: income
  });

  if (!poolRecord.valid) {
    renderValidation(elements.validationView, poolRecord.abnormal);
    renderReport(elements, null);
    setStatus('奖池异常');
    return;
  }

  const resultByRecord = new Map(results.map((result) => [result.bettingRecord, result]));
  const personalRecords = fundedRecords.map((record) => {
    const result = resultByRecord.get(record);
    return {
      nickname: record.nickname,
      date,
      issue,
      playType,
      redBalls: record.redBalls,
      blueBall: record.blueBall,
      prizeLevel: result?.prizeLevel ?? 'invalid',
      prizeAmount: result?.prizeAmount ?? 0,
      contribution: record.contribution,
      fundingSource: record.fundingSource
    };
  });
  let rankings = updateRankings({
    existingPersonalRecords: state.history.personalRecords,
    todaysPersonalRecords: personalRecords,
    date
  });
  let redistribution = null;
  let finalPersonalRecords = personalRecords;
  if (
    state.duplicateDecision !== 'skip' &&
    window.confirm(
      `是否启用“劫富济贫”？确认后将只在今日投注活动用户中，按更新后的总榜排名从前${redistributionConfig.richPoolSize}名随机抽取最多10人各扣除1Hao币，再从后${redistributionConfig.poorPoolSize}名随机抽取最多10人各增加1Hao币。`
    )
  ) {
    redistribution = runRedistribution({
      rankings: rankings.historical,
      candidateNames: buildRedistributionCandidates({
        todaysRecords: fundedRecords
      }),
      date,
      issue,
      playType,
      richPoolSize: redistributionConfig.richPoolSize,
      poorPoolSize: redistributionConfig.poorPoolSize
    });
    finalPersonalRecords = [...personalRecords, ...redistribution.records];
    rankings = updateRankings({
      existingPersonalRecords: state.history.personalRecords,
      todaysPersonalRecords: finalPersonalRecords,
      date
    });
  }
  const reportText = generateBattleReport({
    date,
    issue,
    playType,
    winningNumbers,
    records: fundedRecords,
    results,
    invalidRecords,
    poolRecord,
    rankings,
    duplicateDecision: state.duplicateDecision,
    redistribution
  });
  const writeResult = writeUpdatedWorkbook(
    state.history,
    { date, issue, playType, winningNumbers, records: fundedRecords, results, poolRecord, rankings, personalRecords: finalPersonalRecords },
    state.duplicateDecision
  );

  state.generated = {
    date,
    issue,
    records: fundedRecords,
    results,
    invalidRecords,
    poolRecord,
    rankings,
    redistribution,
    reportText,
    skipped: writeResult.skipped,
    workbook: writeResult.workbook
  };

  renderValidation(elements.validationView, []);
  renderReport(elements, state.generated);
  setStatus(writeResult.skipped ? '已跳过重复数据' : '结果已生成');
}

function parseNumberInput(value) {
  return String(value ?? '')
    .split(/[\s,，|]+/u)
    .filter(Boolean)
    .map(Number);
}

function parseRedistributionConfig(richPoolSizeValue, poorPoolSizeValue) {
  const richPoolSize = parsePositiveInteger(richPoolSizeValue, 20);
  const poorPoolSize = parsePositiveInteger(poorPoolSizeValue, 30);
  const errors = [];

  if (!richPoolSize) {
    errors.push('劫富济贫扣款候选名次必须是正整数');
  }
  if (!poorPoolSize) {
    errors.push('劫富济贫增款候选名次必须是正整数');
  }

  return {
    valid: errors.length === 0,
    errors,
    richPoolSize,
    poorPoolSize
  };
}

function parsePositiveInteger(value, defaultValue) {
  if (String(value ?? '').trim() === '') {
    return defaultValue;
  }
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function syncIssueFromDate() {
  elements.issue.value = issueFromDate(elements.drawDate.value);
}

function hasWinningNumbersInput() {
  return Boolean(elements.redBalls.value.trim() || elements.blueBall.value.trim());
}

function setStatus(value) {
  elements.status.textContent = value;
}
