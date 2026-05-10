import { getRuleSet, validateBallSet } from './rules.js';

export function validateWinningNumbers(redBalls, blueBall) {
  return validateBallSet(redBalls, blueBall);
}

export function countMatches(bet, winningNumbers) {
  const winningReds = new Set(winningNumbers.redBalls.map(Number));
  const redMatches = bet.redBalls.filter((value) => winningReds.has(Number(value))).length;
  const blueMatched = Number(bet.blueBall) === Number(winningNumbers.blueBall);
  return { redMatches, blueMatched };
}

export function calculateWinningResult(bet, winningNumbers, playType) {
  const ruleSet = getRuleSet(playType);
  const { redMatches, blueMatched } = countMatches(bet, winningNumbers);
  const prize = ruleSet.prizeLevels.find(
    (level) => level.redMatches === redMatches && level.blueMatched === blueMatched
  );

  return {
    bettingRecord: bet,
    nickname: bet.nickname,
    redMatches,
    blueMatched,
    prizeLevel: prize?.id ?? 'none',
    prizeLabel: prize?.label ?? '未中奖',
    prizeAmount: prize?.amount ?? 0,
    payoutShare: prize?.payoutShare ?? 0,
    explanation: `${bet.nickname} 命中红球 ${redMatches} 个，${blueMatched ? '命中' : '未命中'}蓝球，${prize?.label ?? '未中奖'}`
  };
}

export function calculateResults(records, winningNumbers, playType = 'ordinary', payoutContext = {}) {
  const results = records.map((record) => calculateWinningResult(record, winningNumbers, playType));
  const ruleSet = getRuleSet(playType);
  if (!ruleSet.payoutBudgetRatio) {
    return results;
  }
  return applySharedPayouts(results, ruleSet, payoutContext);
}

function applySharedPayouts(results, ruleSet, { openingBalance = 0, income = 0 } = {}) {
  const specialPool = Number(openingBalance) + Number(income);
  const payoutBudget = specialPool * ruleSet.payoutBudgetRatio;
  return results.map((result) => {
    if (result.prizeLevel === 'none') {
      return result;
    }
    const level = ruleSet.prizeLevels.find((item) => item.id === result.prizeLevel);
    const winnerCount = results.filter((item) => item.prizeLevel === result.prizeLevel).length;
    const levelPool = payoutBudget * (level?.payoutShare ?? 0);
    const prizeAmount = winnerCount > 0 ? Math.max(1, Math.floor(levelPool / winnerCount)) : 0;
    return {
      ...result,
      prizeAmount,
      explanation: `${result.explanation}，本奖项 ${winnerCount} 注均分 ${roundCurrency(levelPool)} Hao币，单注向下取整为 ${prizeAmount} Hao币`
    };
  });
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function summarizePrizes(results, playType = 'ordinary') {
  const ruleSet = getRuleSet(playType);
  const summary = new Map();

  for (const level of ruleSet.prizeLevels) {
    if (!summary.has(level.id)) {
      summary.set(level.id, {
        prizeLevel: level.id,
        prizeLabel: level.label,
        count: 0,
        totalAmount: 0,
        amount: level.amount
      });
    }
  }

  for (const result of results) {
    if (result.prizeLevel === 'none') {
      continue;
    }
    const existing = summary.get(result.prizeLevel) ?? {
      prizeLevel: result.prizeLevel,
      prizeLabel: result.prizeLabel,
      count: 0,
      totalAmount: 0,
      amount: result.prizeAmount
    };
    existing.count += 1;
    existing.totalAmount += result.prizeAmount;
    summary.set(result.prizeLevel, existing);
  }

  return [...summary.values()];
}
