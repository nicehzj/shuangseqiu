import { describe, expect, it } from 'vitest';
import { calculateOpeningBalance, parsePoolAdjustment } from '../../src/domain/pool-adjustment.js';

describe('pool adjustment', () => {
  it('treats empty input as zero', () => {
    expect(parsePoolAdjustment('')).toEqual({ valid: true, amount: 0 });
  });

  it('parses numeric adjustment', () => {
    expect(parsePoolAdjustment('12.5')).toEqual({ valid: true, amount: 12.5 });
  });

  it('rejects non-numeric adjustment', () => {
    expect(parsePoolAdjustment('abc')).toMatchObject({ valid: false, error: '当前奖池补充值必须是数字' });
  });

  it('adds manual adjustment to latest Excel pool balance', () => {
    expect(calculateOpeningBalance(100, 25)).toBe(125);
  });
});
