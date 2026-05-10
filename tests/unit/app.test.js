import { describe, expect, it } from 'vitest';
import { issueFromDate } from '../../src/domain/issue.js';

describe('issueFromDate', () => {
  it('generates issue from selected date', () => {
    expect(issueFromDate('2026-05-10')).toBe('20260510');
  });

  it('returns empty issue for empty date', () => {
    expect(issueFromDate('')).toBe('');
  });
});
