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

  it('uses configured rich and poor candidate pool sizes', () => {
    const result = runRedistribution({
      rankings: ranking(20),
      richPoolSize: 5,
      poorPoolSize: 8,
      date: '2026-05-10',
      issue: '20260510',
      playType: 'ordinary',
      random: () => 0
    });

    expect(result.deductions).toHaveLength(5);
    expect(result.grants).toHaveLength(8);
    expect(result.deductions.every((item) => Number(item.nickname.replace('用户', '')) <= 5)).toBe(true);
    expect(result.grants.every((item) => Number(item.nickname.replace('用户', '')) >= 13)).toBe(true);
  });

  it('limits redistribution candidates to today active users', () => {
    const result = runRedistribution({
      rankings: ranking(10),
      candidateNames: ['用户02', '用户04', '用户09', '今日用户'],
      richPoolSize: 2,
      poorPoolSize: 2,
      date: '2026-05-10',
      issue: '20260510',
      playType: 'ordinary',
      random: () => 0
    });

    const selectedNames = [...result.deductions, ...result.grants].map((item) => item.nickname);

    expect(selectedNames.every((name) => ['用户02', '用户04', '用户09', '今日用户'].includes(name))).toBe(true);
    expect(result.deductions.every((item) => ['用户02', '用户04'].includes(item.nickname))).toBe(true);
    expect(result.grants.every((item) => ['用户09', '今日用户'].includes(item.nickname))).toBe(true);
    expect(selectedNames).not.toContain('用户01');
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
