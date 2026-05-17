import { describe, expect, it } from 'vitest';
import { updateRankings } from '../../src/domain/rankings.js';

describe('updateRankings', () => {
  it('updates historical and monthly rankings', () => {
    const rankings = updateRankings({
      date: '2026-05-10',
      existingPersonalRecords: [
        { nickname: '张三', date: '2026-04-01', prizeAmount: 10, prizeLevel: 'first' },
        { nickname: '李四', date: '2026-05-01', prizeAmount: 5, prizeLevel: 'second' }
      ],
      todaysPersonalRecords: [{ nickname: '李四', date: '2026-05-10', prizeAmount: 20, prizeLevel: 'grand' }]
    });

    expect(rankings.historical[0]).toMatchObject({ nickname: '李四', totalPrizeAmount: 25, rankAfter: 1 });
    expect(rankings.monthly[0]).toMatchObject({ nickname: '李四', totalPrizeAmount: 25, rankAfter: 1 });
  });

  it('updates best prize level when today has a higher prize', () => {
    const rankings = updateRankings({
      date: '2026-05-10',
      existingPersonalRecords: [
        { nickname: 'Alice', date: '2026-05-01', prizeAmount: 1, prizeLevel: 'fifth' },
        { nickname: 'Bob', date: '2026-04-01', prizeAmount: 26, prizeLevel: 'second' }
      ],
      todaysPersonalRecords: [
        { nickname: 'Alice', date: '2026-05-10', prizeAmount: 66, prizeLevel: 'first' },
        { nickname: 'Bob', date: '2026-05-10', prizeAmount: 1, prizeLevel: 'fifth' }
      ]
    });

    expect(rankings.historical.find((item) => item.nickname === 'Alice')).toMatchObject({ bestPrizeLevel: 'first' });
    expect(rankings.monthly.find((item) => item.nickname === 'Alice')).toMatchObject({ bestPrizeLevel: 'first' });
    expect(rankings.historical.find((item) => item.nickname === 'Bob')).toMatchObject({ bestPrizeLevel: 'second' });
  });

  it('applies redistribution amounts without counting them as wins', () => {
    const rankings = updateRankings({
      date: '2026-05-10',
      existingPersonalRecords: [
        { nickname: '张三', date: '2026-04-01', prizeAmount: 10, prizeLevel: 'first' },
        { nickname: '李四', date: '2026-04-01', prizeAmount: 2, prizeLevel: 'fifth' }
      ],
      todaysPersonalRecords: [
        { nickname: '张三', date: '2026-05-10', prizeAmount: -1, prizeLevel: 'redistributionDeduct' },
        { nickname: '李四', date: '2026-05-10', prizeAmount: 1, prizeLevel: 'redistributionGrant' }
      ]
    });

    expect(rankings.historical.find((item) => item.nickname === '张三')).toMatchObject({ totalPrizeAmount: 9, winCount: 1 });
    expect(rankings.historical.find((item) => item.nickname === '李四')).toMatchObject({ totalPrizeAmount: 3, winCount: 1 });
  });
});
