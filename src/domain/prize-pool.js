import { getRuleSet } from './rules.js';

export function updatePrizePool({ date, issue, openingBalance = 0, betCount, results, playType, incomeOverride = null, taxRevenue = 0 }) {
  const ruleSet = getRuleSet(playType);
  const income = incomeOverride ?? betCount * ruleSet.poolIncomePerBet;
  const payout = results.reduce((sum, result) => sum + Number(result.prizeAmount || 0), 0);
  const rollover = Number(taxRevenue || 0);
  const closingBalance = Number(openingBalance) + income + rollover - payout;
  const notes = [];
  const prizeLabels = new Map(ruleSet.prizeLevels.map((level) => [level.id, level.label]));

  for (const [levelId, handling] of Object.entries(ruleSet.noWinnerHandling ?? {})) {
    const hasWinner = results.some((result) => result.prizeLevel === levelId);
    if (!hasWinner && (handling === 'rollover' || handling === 'returnToPool')) {
      notes.push(`${prizeLabels.get(levelId) ?? levelId} 无人中奖，奖金进入总奖池`);
    }
  }
  if (rollover > 0) {
    notes.push(`中奖税 ${rollover} Hao币回流奖池`);
  }

  const abnormal = [];
  for (const [label, value] of Object.entries({ openingBalance, income, payout, rollover, closingBalance })) {
    if (!Number.isFinite(Number(value))) {
      abnormal.push(`${label} 不是有效数字`);
    }
  }
  if (closingBalance < 0) {
    abnormal.push('奖池余额不足');
  }

  return {
    date,
    issue,
    openingBalance: Number(openingBalance),
    income,
    payout,
    rollover,
    closingBalance,
    notes,
    abnormal,
    valid: abnormal.length === 0
  };
}
