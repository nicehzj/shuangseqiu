import { describe, expect, it } from 'vitest';
import { applyBetFunding, deriveAccountBalances } from '../../src/domain/accounting.js';

describe('accounting', () => {
  it('derives account balances from historical prize amounts', () => {
    const balances = deriveAccountBalances([
      { nickname: '张三', prizeAmount: 5 },
      { nickname: '张三', prizeAmount: 3 },
      { nickname: '李四', prizeAmount: 0 }
    ]);

    expect(balances.get('张三')).toBe(8);
    expect(balances.get('李四')).toBe(0);
  });

  it('funds first bet automatically and deducts later bets with increasing costs', () => {
    const records = [
      { nickname: '张三', valid: true },
      { nickname: '张三', valid: true },
      { nickname: '张三', valid: true },
      { nickname: '张三', valid: true }
    ];

    const funded = applyBetFunding(records, new Map([['张三', 7]]));

    expect(funded[0]).toMatchObject({ betIndex: 1, contribution: 2, fundingSource: 'firstBetPoolGrant', valid: true });
    expect(funded[1]).toMatchObject({ betIndex: 2, contribution: 3, fundingSource: 'accountBalance', accountBalanceAfter: 4, valid: true });
    expect(funded[2]).toMatchObject({ betIndex: 3, contribution: 4, fundingSource: 'accountBalance', accountBalanceAfter: 0, valid: true });
    expect(funded[3]).toMatchObject({ betIndex: 4, contribution: 0, fundingSource: 'maxBetsExceeded', valid: false });
  });

  it('marks later bets invalid when balance cannot cover increasing cost', () => {
    const funded = applyBetFunding(
      [
        { nickname: '张三', valid: true },
        { nickname: '张三', valid: true }
      ],
      new Map([['张三', 2]])
    );

    expect(funded[1]).toMatchObject({ betIndex: 2, contribution: 0, fundingSource: 'insufficientBalance', valid: false });
    expect(funded[1].invalidReasons[0]).toContain('需要 3');
  });

  it('still funds invalid first bets', () => {
    const funded = applyBetFunding([{ nickname: '张三', valid: false, invalidReasons: ['红球不能重复'] }], new Map());

    expect(funded[0]).toMatchObject({ contribution: 2, valid: false });
    expect(funded[0].invalidReasons).toContain('红球不能重复');
  });
});
