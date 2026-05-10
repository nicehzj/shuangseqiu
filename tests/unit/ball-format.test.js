import { describe, expect, it } from 'vitest';
import { formatBallNumber, formatBallNumbers } from '../../src/domain/rules.js';

describe('ball number formatting', () => {
  it('formats single ball numbers as two digits', () => {
    expect(formatBallNumber(1)).toBe('01');
    expect(formatBallNumber(9)).toBe('09');
  });

  it('formats ball arrays as two-digit space-separated text', () => {
    expect(formatBallNumbers([1, 2, 3, 8, 9])).toBe('01 02 03 08 09');
  });
});
