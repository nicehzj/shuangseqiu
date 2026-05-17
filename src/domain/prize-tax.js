const TAX_LEVELS = [
  { threshold: 100, rate: 0.3 },
  { threshold: 50, rate: 0.2 },
  { threshold: 25, rate: 0.1 }
];

export function calculatePrizeTax(results = []) {
  const totals = new Map();

  for (const result of results) {
    const amount = Number(result.prizeAmount || 0);
    if (amount <= 0) {
      continue;
    }
    totals.set(result.nickname, (totals.get(result.nickname) ?? 0) + amount);
  }

  const taxes = [...totals.entries()]
    .map(([nickname, totalPrizeAmount]) => ({
      nickname,
      totalPrizeAmount,
      taxAmount: calculateTaxAmount(totalPrizeAmount)
    }))
    .filter((item) => item.taxAmount > 0);

  return {
    taxes,
    totalTax: taxes.reduce((sum, item) => sum + item.taxAmount, 0)
  };
}

export function buildPrizeTaxRecords({ taxes = [], date, issue, playType }) {
  return taxes.map((tax) => ({
    nickname: tax.nickname,
    date,
    issue,
    playType,
    redBalls: [],
    blueBall: '',
    prizeLevel: 'prizeTax',
    prizeAmount: -tax.taxAmount,
    contribution: '',
    fundingSource: 'prizeTax'
  }));
}

export function formatPrizeTaxReport(taxSummary) {
  if (!taxSummary?.totalTax) {
    return '';
  }

  const details = taxSummary.taxes
    .map((item) => `${item.nickname} 中奖合计 ${item.totalPrizeAmount}Hao币，扣税 ${item.taxAmount}Hao币`)
    .join('\n');
  return `中奖税回流奖池 ${taxSummary.totalTax} Hao币：\n${details}`;
}

function calculateTaxAmount(totalPrizeAmount) {
  let tax = 0;
  for (const level of TAX_LEVELS) {
    if (totalPrizeAmount > level.threshold) {
      tax += (totalPrizeAmount - level.threshold) * level.rate;
      totalPrizeAmount = level.threshold;
    }
  }
  return Math.floor(tax);
}
