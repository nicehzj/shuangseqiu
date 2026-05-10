export function parsePoolAdjustment(value) {
  if (value == null || String(value).trim() === '') {
    return { valid: true, amount: 0 };
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return { valid: false, amount: 0, error: '当前奖池补充值必须是数字' };
  }

  return { valid: true, amount };
}

export function calculateOpeningBalance(excelBalance = 0, adjustment = 0) {
  return Number(excelBalance || 0) + Number(adjustment || 0);
}
