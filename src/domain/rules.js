export const BALL_RULES = {
  red: { min: 1, max: 9, count: 6 },
  blue: { min: 1, max: 8, count: 1 }
};

export const PLAY_TYPES = {
  ordinary: 'ordinary',
  fridayJackpot: 'fridayJackpot'
};

export const RULE_SETS = {
  ordinary: {
    playType: PLAY_TYPES.ordinary,
    label: '普通日玩法',
    betPrice: 2,
    poolIncomePerBet: 2,
    prizeLevels: [
      { id: 'first', label: '一等奖', redMatches: 6, blueMatched: true, amount: 66 },
      { id: 'second', label: '二等奖', redMatches: 6, blueMatched: false, amount: 26 },
      { id: 'third', label: '三等奖', redMatches: 5, blueMatched: true, amount: 8 },
      { id: 'fourth', label: '四等奖', redMatches: 5, blueMatched: false, amount: 2 },
      { id: 'fifth', label: '五等奖', redMatches: 4, blueMatched: true, amount: 1 }
    ],
    noWinnerHandling: {}
  },
  fridayJackpot: {
    playType: PLAY_TYPES.fridayJackpot,
    label: '大乐透玩法',
    betPrice: 2,
    poolIncomePerBet: 2,
    payoutBudgetRatio: 0.8,
    prizeLevels: [
      { id: 'first', label: '一等奖', redMatches: 6, blueMatched: true, payoutShare: 0.35 },
      { id: 'second', label: '二等奖', redMatches: 6, blueMatched: false, payoutShare: 0.25 },
      { id: 'third', label: '三等奖', redMatches: 5, blueMatched: true, payoutShare: 0.18 },
      { id: 'fourth', label: '四等奖', redMatches: 5, blueMatched: false, payoutShare: 0.12 },
      { id: 'fifth', label: '五等奖', redMatches: 4, blueMatched: true, payoutShare: 0.1 }
    ],
    noWinnerHandling: {
      first: 'returnToPool',
      second: 'returnToPool',
      third: 'returnToPool',
      fourth: 'returnToPool',
      fifth: 'returnToPool'
    }
  }
};

export function getRuleSet(playType = PLAY_TYPES.ordinary) {
  const ruleSet = RULE_SETS[playType];
  if (!ruleSet) {
    throw new Error(`Unknown play type: ${playType}`);
  }
  return ruleSet;
}

export function normalizeNumbers(values) {
  return [...values].map(Number).sort((a, b) => a - b);
}

export function formatBallNumber(value) {
  return String(Number(value)).padStart(2, '0');
}

export function formatBallNumbers(values) {
  return (values ?? []).map(formatBallNumber).join(' ');
}

export function validateBallSet(redBalls, blueBall) {
  const errors = [];
  const reds = normalizeNumbers(redBalls);
  const blue = Number(blueBall);

  if (reds.length !== BALL_RULES.red.count) {
    errors.push(`红球必须是 ${BALL_RULES.red.count} 个号码`);
  }

  if (new Set(reds).size !== reds.length) {
    errors.push('红球不能重复');
  }

  for (const value of reds) {
    if (!Number.isInteger(value) || value < BALL_RULES.red.min || value > BALL_RULES.red.max) {
      errors.push(`红球 ${value} 超出 ${BALL_RULES.red.min}-${BALL_RULES.red.max} 范围`);
    }
  }

  if (!Number.isInteger(blue) || blue < BALL_RULES.blue.min || blue > BALL_RULES.blue.max) {
    errors.push(`蓝球必须是 ${BALL_RULES.blue.min}-${BALL_RULES.blue.max} 范围内的 1 个号码`);
  }

  return {
    valid: errors.length === 0,
    errors,
    redBalls: reds,
    blueBall: blue
  };
}
