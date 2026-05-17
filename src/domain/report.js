import { getRuleSet } from './rules.js';
import { summarizePrizes } from './calculator.js';
import { formatBallNumber, formatBallNumbers } from './rules.js';
import { formatRedistributionReport } from './redistribution.js';
import { formatPrizeTaxReport } from './prize-tax.js';

const PRIZE_DISPLAY_ORDER = ['first', 'second', 'third', 'fourth', 'fifth'];

function formatRankingChanges(rankings) {
  const changed = rankings.filter((item) => item.change !== 0 || item.rankBefore == null).slice(0, 5);
  if (changed.length === 0) {
    return '暂无明显变化';
  }
  return changed
    .map((item) => `${item.nickname} 第${item.rankAfter}名${item.rankBefore == null ? '（新上榜）' : `（变化 ${item.change >= 0 ? '+' : ''}${item.change}）`}`)
    .join('；');
}

export function generateBattleReport({
  date,
  issue,
  playType,
  winningNumbers,
  records,
  results,
  invalidRecords = [],
  poolRecord,
  rankings,
  duplicateDecision,
  redistribution,
  taxSummary
}) {
  const ruleSet = getRuleSet(playType);
  const winners = results
    .filter((result) => result.prizeAmount > 0)
    .map((result, index) => ({ ...result, originalIndex: index }))
    .sort((a, b) => prizeOrder(a.prizeLevel) - prizeOrder(b.prizeLevel) || a.originalIndex - b.originalIndex);
  const prizeSummary = summarizePrizes(results, playType);
  const winnerText = winners.length
    ? `\n${winners.map((result) => `${result.nickname} ${result.prizeLabel} ${result.prizeAmount}Hao币`).join('\n')}`
    : '今日无人中奖';
  const prizeSummaryText = `\n${prizeSummary.map((item) => `${item.prizeLabel} ${item.count}人 共${item.totalAmount} Hao币`).join('\n')}`;
  const notices = [...(poolRecord.notes ?? [])];

  if (duplicateDecision) {
    notices.push(`重复数据处理：${duplicateDecision}`);
  }
  if (playType === 'fridayJackpot') {
    const specialPool = poolRecord.openingBalance + poolRecord.income;
    notices.push(`大乐透专项奖池 ${specialPool} Hao币，最高派奖预算 ${Math.round(specialPool * 0.8 * 100) / 100} Hao币`);
  }
  if (invalidRecords.length) {
    notices.push(`无效投注 ${invalidRecords.length} 注：${invalidRecords.map((record) => `${record.nickname}（${(record.invalidReasons ?? []).join('、')}）`).join('；')}`);
  }
  const taxText = formatPrizeTaxReport(taxSummary);
  if (taxText) {
    notices.push(taxText);
  }

  const sections = [
    `🎯【今日战报】${date}${issue ? ` 第${issue}期` : ''}`,
    `🎲 玩法：${ruleSet.label}`,
    `🔴 开奖号码：红球 ${formatBallNumbers(winningNumbers.redBalls)}，蓝球 ${formatBallNumber(winningNumbers.blueBall)}`,
    `👥 参与人数：${new Set(records.map((record) => record.nickname)).size}`,
    `🧾 投注总数：${records.length}`,
    `🏆 中奖名单：${winnerText}`,
    `📊 奖项统计：${prizeSummaryText}`,
    `💰 今日奖池变化：+${poolRecord.income}${poolRecord.rollover ? ` +${poolRecord.rollover}` : ''} -${poolRecord.payout} Hao币，当前余额 ${poolRecord.closingBalance} Hao币`,
    `📈 历史排行榜变化：${formatRankingChanges(rankings.historical ?? [])}`,
    `🗓️ 月度排行榜变化：${formatRankingChanges(rankings.monthly ?? [])}`,
    `💡 重点提示：${notices.length ? notices.join('；') : '无'}`
  ];
  const redistributionText = formatRedistributionReport(redistribution);
  if (redistributionText) {
    sections.push(redistributionText);
  }

  return sections.join('\n\n');
}

function prizeOrder(prizeLevel) {
  const index = PRIZE_DISPLAY_ORDER.indexOf(prizeLevel);
  return index === -1 ? PRIZE_DISPLAY_ORDER.length : index;
}
