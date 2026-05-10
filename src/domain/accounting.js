export const BET_COST = 2;
export const MAX_BETS_PER_PERSON = 3;

export function deriveAccountBalances(personalRecords = []) {
  const balances = new Map();
  for (const record of personalRecords) {
    const nickname = record.nickname;
    if (!nickname) {
      continue;
    }
    balances.set(nickname, (balances.get(nickname) ?? 0) + Number(record.prizeAmount || 0));
  }
  return balances;
}

export function applyBetFunding(records, accountBalances = new Map(), betCost = BET_COST) {
  const betCounts = new Map();
  const balances = new Map(accountBalances);

  return records.map((record) => {
    const previousCount = betCounts.get(record.nickname) ?? 0;
    const betIndex = previousCount + 1;
    betCounts.set(record.nickname, betIndex);

    if (betIndex > MAX_BETS_PER_PERSON) {
      const balance = balances.get(record.nickname) ?? 0;
      return {
        ...record,
        betIndex,
        contribution: 0,
        fundingSource: 'maxBetsExceeded',
        accountBalanceAfter: balance,
        valid: false,
        invalidReasons: [...(record.invalidReasons ?? []), `超过最多 ${MAX_BETS_PER_PERSON} 注限制`]
      };
    }

    if (betIndex === 1) {
      return {
        ...record,
        betIndex,
        contribution: betCost,
        fundingSource: 'firstBetPoolGrant',
        accountBalanceAfter: balances.get(record.nickname) ?? 0,
        valid: record.valid
      };
    }

    const requiredCost = betCost + betIndex - 1;
    const balance = balances.get(record.nickname) ?? 0;
    if (balance < requiredCost) {
      return {
        ...record,
        betIndex,
        contribution: 0,
        fundingSource: 'insufficientBalance',
        accountBalanceAfter: balance,
        valid: false,
        invalidReasons: [...(record.invalidReasons ?? []), `账户余额不足，余额 ${balance} Hao币，需要 ${requiredCost} Hao币`]
      };
    }

    balances.set(record.nickname, balance - requiredCost);
    return {
      ...record,
      betIndex,
      contribution: requiredCost,
      fundingSource: 'accountBalance',
      accountBalanceAfter: balance - requiredCost,
      valid: record.valid
    };
  });
}
