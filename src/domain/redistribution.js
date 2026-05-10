const REDISTRIBUTION_AMOUNT = 1;
const RICH_POOL_SIZE = 20;
const POOR_POOL_SIZE = 30;
const DRAW_COUNT = 10;

export function runRedistribution({ rankings = [], candidateNames = [], date, issue, playType, random = secureRandom }) {
  const completeRankings = completeRanking(rankings, candidateNames);
  const richCandidates = completeRankings.slice(0, RICH_POOL_SIZE);
  const selectedRich = sample(richCandidates, DRAW_COUNT, random);
  const selectedRichNames = new Set(selectedRich.map((item) => item.nickname));
  const poorCandidates = completeRankings.slice(-POOR_POOL_SIZE).filter((item) => !selectedRichNames.has(item.nickname));
  const selectedPoor = sample(poorCandidates, DRAW_COUNT, random);

  const deductions = selectedRich.map((item) => ({
    nickname: item.nickname,
    amount: -REDISTRIBUTION_AMOUNT
  }));
  const grants = selectedPoor.map((item) => ({
    nickname: item.nickname,
    amount: REDISTRIBUTION_AMOUNT
  }));

  return {
    enabled: true,
    deductions,
    grants,
    records: [
      ...deductions.map((item) => personalRecord(item, date, issue, playType, 'redistributionDeduct', 'redistribution')),
      ...grants.map((item) => personalRecord(item, date, issue, playType, 'redistributionGrant', 'redistribution'))
    ]
  };
}

export function buildRedistributionCandidates({ rankings = [], historyRecords = [], todaysRecords = [] }) {
  return uniqueNames([
    ...rankings.map((item) => item.nickname),
    ...historyRecords.map((item) => item.nickname),
    ...todaysRecords.map((item) => item.nickname)
  ]);
}

export function formatRedistributionReport(redistribution) {
  if (!redistribution?.enabled) {
    return '';
  }

  const deductionText = redistribution.deductions.length
    ? redistribution.deductions.map((item) => `${item.nickname} -1Hao币`).join('\n')
    : '无';
  const grantText = redistribution.grants.length
    ? redistribution.grants.map((item) => `${item.nickname} +1Hao币`).join('\n')
    : '无';

  return ['⚖️ 劫富济贫：', '扣除：', deductionText, '增加：', grantText].join('\n');
}

function personalRecord(item, date, issue, playType, prizeLevel, fundingSource) {
  return {
    nickname: item.nickname,
    date,
    issue,
    playType,
    redBalls: [],
    blueBall: '',
    prizeLevel,
    prizeAmount: item.amount,
    contribution: '',
    fundingSource
  };
}

function sample(items, count, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function completeRanking(rankings, candidateNames) {
  const byName = new Map();
  for (const item of rankings ?? []) {
    if (!item.nickname) {
      continue;
    }
    byName.set(item.nickname, {
      nickname: item.nickname,
      totalPrizeAmount: Number(item.totalPrizeAmount || 0),
      winCount: Number(item.winCount || 0)
    });
  }
  for (const nickname of candidateNames ?? []) {
    if (!nickname || byName.has(nickname)) {
      continue;
    }
    byName.set(nickname, {
      nickname,
      totalPrizeAmount: 0,
      winCount: 0
    });
  }

  return [...byName.values()]
    .sort((a, b) => b.totalPrizeAmount - a.totalPrizeAmount || b.winCount - a.winCount || a.nickname.localeCompare(b.nickname))
    .map((item, index) => ({ ...item, rankAfter: index + 1 }));
}

function uniqueNames(names) {
  return [...new Set((names ?? []).filter(Boolean))];
}

function secureRandom() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    return Math.random();
  }
  const values = new Uint32Array(1);
  cryptoApi.getRandomValues(values);
  return values[0] / 2 ** 32;
}
