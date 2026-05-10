import { describe, expect, it } from 'vitest';
import { calculateResults, calculateWinningResult, validateWinningNumbers } from '../../src/domain/calculator.js';

const winningNumbers = { redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 };

describe('calculator', () => {
  it('validates winning numbers', () => {
    expect(validateWinningNumbers([1, 2, 3, 4, 5, 6], 7).valid).toBe(true);
    expect(validateWinningNumbers([1, 2, 3, 4, 5, 5], 9).valid).toBe(false);
  });

  it('calculates ordinary-day prize levels', () => {
    expect(calculateWinningResult({ nickname: 'A', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 }, winningNumbers, 'ordinary')).toMatchObject({ prizeLevel: 'first', prizeAmount: 66 });
    expect(calculateWinningResult({ nickname: 'B', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 8 }, winningNumbers, 'ordinary')).toMatchObject({ prizeLevel: 'second', prizeAmount: 26 });
    expect(calculateWinningResult({ nickname: 'C', redBalls: [1, 2, 3, 4, 5, 9], blueBall: 7 }, winningNumbers, 'ordinary')).toMatchObject({ prizeLevel: 'third', prizeAmount: 8 });
    expect(calculateWinningResult({ nickname: 'D', redBalls: [1, 2, 3, 4, 8, 9], blueBall: 7 }, winningNumbers, 'ordinary')).toMatchObject({ prizeLevel: 'fifth', prizeAmount: 1 });
  });

  it('calculates Friday jackpot shared prize pools', () => {
    const results = calculateResults(
      [
        { nickname: 'A', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 },
        { nickname: 'B', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 },
        { nickname: 'C', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 8 }
      ],
      winningNumbers,
      'fridayJackpot',
      { openingBalance: 100, income: 10 }
    );

    expect(results[0]).toMatchObject({ prizeLevel: 'first' });
    expect(results[0].prizeAmount).toBe(15);
    expect(results[1].prizeAmount).toBe(15);
    expect(results[2]).toMatchObject({ prizeLevel: 'second' });
    expect(results[2].prizeAmount).toBe(22);
  });

  it('keeps Friday jackpot shared prize at minimum 1 Hao币', () => {
    const results = calculateResults(
      [{ nickname: 'A', redBalls: [1, 2, 3, 4, 8, 9], blueBall: 7 }],
      winningNumbers,
      'fridayJackpot',
      { openingBalance: 1, income: 0 }
    );

    expect(results[0]).toMatchObject({ prizeLevel: 'fifth', prizeAmount: 1 });
  });

  it('calculates multiple records', () => {
    const results = calculateResults(
      [
        { nickname: 'A', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 },
        { nickname: 'B', redBalls: [2, 3, 4, 5, 6, 8], blueBall: 1 }
      ],
      winningNumbers,
      'ordinary'
    );

    expect(results).toHaveLength(2);
    expect(results[0].explanation).toContain('命中红球 6 个');
  });
});
