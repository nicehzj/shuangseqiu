import { describe, expect, it } from 'vitest';
import { buildRedistributionCandidates, formatRedistributionReport, runRedistribution } from '../../src/domain/redistribution.js';

function ranking(count) {
  return Array.from({ length: count }, (_, index) => ({
    nickname: `用户${String(index + 1).padStart(2, '0')}`,
    totalPrizeAmount: 100 - index,
    rankAfter: index + 1
  }));
}

describe('redistribution', () => {
  it('draws from top 20 and bottom 30 without overlap', () => {
    const result = runRedistribution({
      rankings: ranking(60),
      date: '2026-05-10',
      issue: '20260510',
      playType: 'ordinary',
      random: () => 0
    });

    expect(result.deductions).toHaveLength(10);
    expect(result.grants).toHaveLength(10);
    expect(result.records).toHaveLength(20);
    expect(result.deductions.every((item) => Number(item.nickname.replace('用户', '')) <= 20)).toBe(true);
    expect(result.grants.every((item) => Number(item.nickname.replace('用户', '')) >= 31)).toBe(true);
    expect(new Set([...result.deductions, ...result.grants].map((item) => item.nickname)).size).toBe(20);
    expect(result.records[0]).toMatchObject({ prizeLevel: 'redistributionDeduct', prizeAmount: -1, fundingSource: 'redistribution' });
  });

  it('uses today participants as bottom candidates even when they are not on the prize ranking', () => {
    const todaysRecords = Array.from({ length: 40 }, (_, index) => ({
      nickname: `今日用户${String(index + 1).padStart(2, '0')}`
    }));
    const candidates = buildRedistributionCandidates({
      rankings: ranking(5),
      historyRecords: [],
      todaysRecords
    });

    const result = runRedistribution({
      rankings: ranking(5),
      candidateNames: candidates,
      date: '2026-05-10',
      issue: '20260510',
      playType: 'ordinary',
      random: () => 0
    });

    expect(result.deductions).toHaveLength(10);
    expect(result.grants).toHaveLength(10);
    expect(result.grants.some((item) => item.nickname.startsWith('今日用户'))).toBe(true);
  });

  it('formats report text with deduction and grant lines', () => {
    const text = formatRedistributionReport({
      enabled: true,
      deductions: [{ nickname: '张三', amount: -1 }],
      grants: [{ nickname: '李四', amount: 1 }]
    });

    expect(text).toContain('⚖️ 劫富济贫');
    expect(text).toContain('张三 -1Hao币');
    expect(text).toContain('李四 +1Hao币');
  });
});
