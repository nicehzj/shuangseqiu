import { describe, expect, it } from 'vitest';
import { buildPrizeTaxRecords, calculatePrizeTax, formatPrizeTaxReport } from '../../src/domain/prize-tax.js';

describe('prize tax', () => {
  it('calculates progressive tax by winner daily total and rounds down', () => {
    const summary = calculatePrizeTax([
      { nickname: '张三', prizeAmount: 20 },
      { nickname: '李四', prizeAmount: 26 },
      { nickname: '王五', prizeAmount: 66 },
      { nickname: '赵六', prizeAmount: 80 },
      { nickname: '赵六', prizeAmount: 40 }
    ]);

    expect(summary.taxes).toEqual([
      { nickname: '李四', totalPrizeAmount: 26, taxAmount: 0 },
      { nickname: '王五', totalPrizeAmount: 66, taxAmount: 5 },
      { nickname: '赵六', totalPrizeAmount: 120, taxAmount: 18 }
    ].filter((item) => item.taxAmount > 0));
    expect(summary.totalTax).toBe(23);
  });

  it('builds negative personal records for tax collection', () => {
    const records = buildPrizeTaxRecords({
      taxes: [{ nickname: '王五', totalPrizeAmount: 66, taxAmount: 5 }],
      date: '2026-05-10',
      issue: '20260510',
      playType: 'ordinary'
    });

    expect(records).toEqual([
      {
        nickname: '王五',
        date: '2026-05-10',
        issue: '20260510',
        playType: 'ordinary',
        redBalls: [],
        blueBall: '',
        prizeLevel: 'prizeTax',
        prizeAmount: -5,
        contribution: '',
        fundingSource: 'prizeTax'
      }
    ]);
  });

  it('formats tax report details', () => {
    const text = formatPrizeTaxReport({
      totalTax: 5,
      taxes: [{ nickname: '王五', totalPrizeAmount: 66, taxAmount: 5 }]
    });

    expect(text).toContain('中奖税回流奖池 5 Hao币');
    expect(text).toContain('王五 中奖合计 66Hao币，扣税 5Hao币');
  });
});
