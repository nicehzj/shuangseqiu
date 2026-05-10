import { describe, expect, it } from 'vitest';
import { generateWinningNumbers } from '../../src/domain/winning-number-generator.js';

describe('generateWinningNumbers', () => {
  it('generates 6 unique red balls and 1 blue ball in range', () => {
    const numbers = generateWinningNumbers();

    expect(numbers.redBalls).toHaveLength(6);
    expect(new Set(numbers.redBalls).size).toBe(6);
    expect(numbers.redBalls.every((value) => value >= 1 && value <= 9)).toBe(true);
    expect(numbers.blueBall).toBeGreaterThanOrEqual(1);
    expect(numbers.blueBall).toBeLessThanOrEqual(8);
  });

  it('accepts an injectable random integer source for deterministic testing', () => {
    const numbers = generateWinningNumbers(() => 0);

    expect(numbers).toEqual({ redBalls: [1, 2, 3, 4, 5, 6], blueBall: 1 });
  });
});
