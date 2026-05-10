const REDISTRIBUTION_LEVELS = new Set(['redistributionDeduct', 'redistributionGrant']);

function buildRanking(records, scope, period) {
  const byName = new Map();

  for (const record of records) {
    const amount = Number(record.prizeAmount || 0);
    if (amount === 0) {
      continue;
    }
    const current = byName.get(record.nickname) ?? {
      scope,
      period,
      nickname: record.nickname,
      winCount: 0,
      totalPrizeAmount: 0,
      bestPrizeLevel: REDISTRIBUTION_LEVELS.has(record.prizeLevel) ? 'none' : record.prizeLevel,
      rankBefore: null,
      rankAfter: null,
      change: 0
    };
    if (amount > 0 && !REDISTRIBUTION_LEVELS.has(record.prizeLevel)) {
      current.winCount += 1;
      current.bestPrizeLevel = current.bestPrizeLevel === 'none' ? record.prizeLevel : current.bestPrizeLevel;
    }
    current.totalPrizeAmount += amount;
    byName.set(record.nickname, current);
  }

  return [...byName.values()]
    .sort((a, b) => b.totalPrizeAmount - a.totalPrizeAmount || b.winCount - a.winCount || a.nickname.localeCompare(b.nickname))
    .map((record, index) => ({ ...record, rankAfter: index + 1 }));
}

function rankMap(rankings) {
  return new Map((rankings ?? []).map((record, index) => [record.nickname, record.rankAfter ?? record.rank ?? index + 1]));
}

export function updateRankings({ existingPersonalRecords = [], todaysPersonalRecords = [], date }) {
  const month = String(date).slice(0, 7);
  const beforeHistorical = buildRanking(existingPersonalRecords, 'historical', 'all');
  const afterRecords = [...existingPersonalRecords, ...todaysPersonalRecords];
  const afterHistorical = buildRanking(afterRecords, 'historical', 'all');

  const beforeMonthly = buildRanking(
    existingPersonalRecords.filter((record) => String(record.date).startsWith(month)),
    'monthly',
    month
  );
  const afterMonthly = buildRanking(
    afterRecords.filter((record) => String(record.date).startsWith(month)),
    'monthly',
    month
  );

  return {
    historical: attachChanges(afterHistorical, rankMap(beforeHistorical)),
    monthly: attachChanges(afterMonthly, rankMap(beforeMonthly))
  };
}

function attachChanges(rankings, beforeRanks) {
  return rankings.map((record) => {
    const rankBefore = beforeRanks.get(record.nickname) ?? null;
    const change = rankBefore == null ? 0 : rankBefore - record.rankAfter;
    return { ...record, rankBefore, change };
  });
}
