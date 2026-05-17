import { describe, expect, it } from 'vitest';
import { updatePrizePool } from '../../src/domain/prize-pool.js';

describe('updatePrizePool', () => {
  it('updates ordinary-day pool with winners', () => {
    const pool = updatePrizePool({
      date: '2026-05-10',
      issue: '001',
      openingBalance: 100,
      betCount: 2,
      playType: 'ordinary',
      results: [{ prizeAmount: 66, prizeLevel: 'first' }, { prizeAmount: 0, prizeLevel: 'none' }]
    });

    expect(pool).toMatchObject({ income: 4, payout: 66, closingBalance: 38, valid: true });
  });

  it('uses explicit income when provided', () => {
    const pool = updatePrizePool({
      date: '2026-05-10',
      issue: '001',
      openingBalance: 100,
      betCount: 10,
      incomeOverride: 4,
      playType: 'ordinary',
      results: []
    });

    expect(pool.income).toBe(4);
    expect(pool.closingBalance).toBe(104);
  });

  it('returns prize tax to the pool as rollover', () => {
    const pool = updatePrizePool({
      date: '2026-05-10',
      issue: '001',
      openingBalance: 100,
      betCount: 1,
      incomeOverride: 2,
      playType: 'ordinary',
      results: [{ prizeAmount: 66, prizeLevel: 'first' }],
      taxRevenue: 5
    });

    expect(pool).toMatchObject({ income: 2, payout: 66, rollover: 5, closingBalance: 41, valid: true });
    expect(pool.notes).toContain('中奖税 5 Hao币回流奖池');
  });

  it('does not add ordinary-day no-winner notes', () => {
    const pool = updatePrizePool({
      date: '2026-05-10',
      issue: '001',
      openingBalance: 100,
      betCount: 1,
      playType: 'ordinary',
      results: [{ prizeAmount: 0, prizeLevel: 'none' }]
    });

    expect(pool.notes).toEqual([]);
  });

  it('blocks insufficient pool', () => {
    const pool = updatePrizePool({
      date: '2026-05-10',
      issue: '001',
      openingBalance: 1,
      betCount: 1,
      playType: 'fridayJackpot',
      results: [{ prizeAmount: 200, prizeLevel: 'first' }]
    });

    expect(pool.valid).toBe(false);
    expect(pool.abnormal).toContain('奖池余额不足');
  });

  it('records Friday jackpot no-winner prize pools returning to total pool', () => {
    const pool = updatePrizePool({
      date: '2026-05-10',
      issue: '001',
      openingBalance: 100,
      betCount: 1,
      playType: 'fridayJackpot',
      results: [{ prizeAmount: 0, prizeLevel: 'none' }]
    });

    expect(pool.notes[0]).toContain('一等奖 无人中奖');
  });
});
