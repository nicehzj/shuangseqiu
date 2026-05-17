import { formatBallNumber, formatBallNumbers } from '../domain/rules.js';

export const SHEETS = {
  draws: '开奖记录',
  prizePool: '奖池记录',
  historicalRanking: '历史排行榜',
  monthlyRanking: '月度排行榜'
};

export const LEGACY_SHEETS = {
  draws: 'Draws',
  prizePool: 'PrizePool',
  historicalRanking: 'HistoricalRanking',
  monthlyRanking: 'MonthlyRanking'
};

export const SHEET_ALIASES = {
  [SHEETS.draws]: [SHEETS.draws, LEGACY_SHEETS.draws],
  [SHEETS.prizePool]: [SHEETS.prizePool, LEGACY_SHEETS.prizePool],
  [SHEETS.historicalRanking]: [SHEETS.historicalRanking, LEGACY_SHEETS.historicalRanking],
  [SHEETS.monthlyRanking]: [SHEETS.monthlyRanking, LEGACY_SHEETS.monthlyRanking]
};

export const COLUMN_LABELS = {
  date: '日期',
  issue: '期次',
  playType: '玩法',
  redBalls: '红球',
  blueBall: '蓝球',
  participantCount: '参与人数',
  betCount: '投注总数',
  openingBalance: '期初奖池',
  income: '本期入池',
  payout: '本期派奖',
  rollover: '滚入奖池',
  closingBalance: '期末奖池',
  notes: '备注',
  scope: '统计范围',
  period: '统计周期',
  nickname: '姓名',
  winCount: '中奖次数',
  totalPrizeAmount: '中奖总额',
  bestPrizeLevel: '最高奖项',
  rankBefore: '原排名',
  rankAfter: '新排名',
  change: '排名变化',
  prizeLevel: '奖项',
  prizeAmount: '中奖金额',
  contribution: '入池金额',
  fundingSource: '资金来源'
};

export const REQUIRED_COLUMNS = {
  [SHEETS.draws]: ['date', 'issue', 'playType', 'redBalls', 'blueBall', 'participantCount', 'betCount'],
  [SHEETS.prizePool]: ['date', 'issue', 'openingBalance', 'income', 'payout', 'rollover', 'closingBalance', 'notes'],
  [SHEETS.historicalRanking]: ['scope', 'period', 'nickname', 'winCount', 'totalPrizeAmount', 'bestPrizeLevel', 'rankBefore', 'rankAfter', 'change'],
  [SHEETS.monthlyRanking]: ['scope', 'period', 'nickname', 'winCount', 'totalPrizeAmount', 'bestPrizeLevel', 'rankBefore', 'rankAfter', 'change']
};

export const LEGACY_PERSONAL_RECORDS_SHEET = 'PersonalRecords';
export const LEGACY_WINNING_RECORDS_SHEET = 'WinningRecords';
export const PERSONAL_RECORD_COLUMNS = ['date', 'issue', 'playType', 'redBalls', 'blueBall', 'prizeLevel', 'prizeAmount', 'contribution', 'fundingSource'];
export const RESERVED_SHEETS = new Set([
  ...Object.values(SHEETS),
  ...Object.values(LEGACY_SHEETS),
  LEGACY_PERSONAL_RECORDS_SHEET,
  LEGACY_WINNING_RECORDS_SHEET
]);

export const PLAY_TYPE_LABELS = {
  ordinary: '普通日玩法',
  fridayJackpot: '大乐透玩法'
};

export const PRIZE_LEVEL_LABELS = {
  none: '未中奖',
  invalid: '无效投注',
  first: '一等奖',
  second: '二等奖',
  third: '三等奖',
  fourth: '四等奖',
  fifth: '五等奖',
  grand: '特等奖',
  jackpot: '大乐透特等奖',
  prizeTax: '中奖税',
  redistributionDeduct: '劫富济贫扣除',
  redistributionGrant: '劫富济贫增加'
};

export const FUNDING_SOURCE_LABELS = {
  firstBetPoolGrant: '首次投注自动入池',
  accountBalance: '账户扣款入池',
  insufficientBalance: '账户余额不足',
  maxBetsExceeded: '超过三注限制',
  redistribution: '劫富济贫',
  prizeTax: '中奖税'
};

export function participantSheetName(nickname) {
  const sanitized = String(nickname ?? '未命名')
    .replace(/[\\/?*[\]:]/g, '_')
    .trim()
    .slice(0, 31);
  return sanitized || '未命名';
}

export function serializeBalls(values) {
  return formatBallNumbers(values);
}

export function serializeBall(value) {
  return formatBallNumber(value);
}

export function parseBalls(value) {
  if (Array.isArray(value)) {
    return value.map(Number);
  }
  return String(value ?? '')
    .split(/[\s,，|]+/u)
    .filter(Boolean)
    .map(Number);
}

export function findSheetName(workbook, canonicalSheetName) {
  return SHEET_ALIASES[canonicalSheetName]?.find((sheetName) => workbook.Sheets[sheetName]) ?? null;
}

export function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row ?? {})) {
    const internalKey = Object.entries(COLUMN_LABELS).find(([, label]) => label === key)?.[0] ?? key;
    normalized[internalKey] = value;
  }
  return normalized;
}

export function toChineseRow(row, columns) {
  const translated = {};
  for (const column of columns) {
    translated[COLUMN_LABELS[column]] = translateCellValue(column, row?.[column]);
  }
  return translated;
}

export function translateCellValue(column, value) {
  if (column === 'playType') {
    return PLAY_TYPE_LABELS[value] ?? value;
  }
  if (column === 'prizeLevel' || column === 'bestPrizeLevel') {
    return PRIZE_LEVEL_LABELS[value] ?? value;
  }
  if (column === 'fundingSource') {
    return FUNDING_SOURCE_LABELS[value] ?? value;
  }
  if (column === 'scope') {
    return value === 'historical' ? '历史' : value === 'monthly' ? '月度' : value;
  }
  return value ?? '';
}

export function reverseTranslatedValue(column, value) {
  if (column === 'playType') {
    return reverseLookup(PLAY_TYPE_LABELS, value);
  }
  if (column === 'prizeLevel' || column === 'bestPrizeLevel') {
    return reverseLookup(PRIZE_LEVEL_LABELS, value);
  }
  if (column === 'fundingSource') {
    return reverseLookup(FUNDING_SOURCE_LABELS, value);
  }
  if (column === 'scope') {
    if (value === '历史') return 'historical';
    if (value === '月度') return 'monthly';
  }
  return value;
}

function reverseLookup(map, value) {
  return Object.entries(map).find(([, label]) => label === value)?.[0] ?? value;
}
