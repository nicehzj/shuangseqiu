import { describe, expect, it } from 'vitest';
import { renderValidation } from '../../src/ui/validation-view.js';

describe('renderValidation', () => {
  it('renders line-specific errors', () => {
    const container = document.createElement('div');

    renderValidation(container, [{ lineNumber: 3, reason: '红球不足' }]);

    expect(container.textContent).toContain('第 3 行：红球不足');
    expect(container.className).toContain('error');
  });
});
