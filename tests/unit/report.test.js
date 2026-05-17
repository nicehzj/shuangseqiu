import { describe, expect, it } from 'vitest';
import { generateBattleReport } from '../../src/domain/report.js';

const base = {
  date: '2026-05-10',
  issue: '001',
  winningNumbers: { redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 },
  records: [{ nickname: '张三', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 }],
  results: [{ nickname: '张三', prizeLevel: 'first', prizeLabel: '一等奖', prizeAmount: 66 }],
  poolRecord: { income: 2, payout: 20, closingBalance: 82, notes: [] },
  rankings: { historical: [{ nickname: '张三', rankAfter: 1, rankBefore: null, change: 0 }], monthly: [] }
};

describe('generateBattleReport', () => {
  it('contains all required sections', () => {
    const text = generateBattleReport({ ...base, playType: 'ordinary' });

    expect(text).toContain('今日战报');
    expect(text).toContain('🔴 开奖号码：红球 01 02 03 04 05 06，蓝球 07');
    expect(text).toContain('参与人数');
    expect(text).toContain('投注总数');
    expect(text).toContain('中奖名单');
    expect(text).toContain('张三 一等奖 66Hao币');
    expect(text).toContain('奖项统计');
    expect(text).toContain('一等奖 1人 共66 Hao币');
    expect(text).toContain('今日奖池变化');
    expect(text).toContain('历史排行榜变化');
    expect(text).toContain('月度排行榜变化');
    expect(text).toContain('\n\n🎲 玩法');
  });

  it('includes invalid bet notices', () => {
    const text = generateBattleReport({
      ...base,
      playType: 'ordinary',
      invalidRecords: [{ nickname: '李四', invalidReasons: ['红球不能重复'] }],
      records: [...base.records, { nickname: '李四' }]
    });

    expect(text).toContain('无效投注 1 注');
    expect(text).toContain('李四');
  });

  it('includes Friday jackpot budget notice', () => {
    const text = generateBattleReport({
      ...base,
      playType: 'fridayJackpot',
      results: [{ nickname: '张三', prizeLevel: 'none', prizeLabel: '未中奖', prizeAmount: 0 }]
    });

    expect(text).toContain('大乐透专项奖池');
    expect(text).toContain('最高派奖预算');
  });

  it('appends redistribution details at the end', () => {
    const text = generateBattleReport({
      ...base,
      playType: 'ordinary',
      redistribution: {
        enabled: true,
        deductions: [{ nickname: '张三', amount: -1 }],
        grants: [{ nickname: '李四', amount: 1 }]
      }
    });

    expect(text).toContain('⚖️ 劫富济贫：\n扣除：\n张三 -1Hao币\n增加：\n李四 +1Hao币');
  });

  it('includes prize tax in notices and pool change', () => {
    const text = generateBattleReport({
      ...base,
      playType: 'ordinary',
      poolRecord: { income: 2, payout: 66, rollover: 5, closingBalance: 41, notes: [] },
      taxSummary: {
        totalTax: 5,
        taxes: [{ nickname: '张三', totalPrizeAmount: 66, taxAmount: 5 }]
      }
    });

    expect(text).toContain('今日奖池变化：+2 +5 -66 Hao币，当前余额 41 Hao币');
    expect(text).toContain('中奖税回流奖池 5 Hao币');
    expect(text).toContain('张三 中奖合计 66Hao币，扣税 5Hao币');
  });

  it('sorts winners from first prize to fifth prize', () => {
    const text = generateBattleReport({
      ...base,
      playType: 'ordinary',
      results: [
        { nickname: '王五', prizeLevel: 'fifth', prizeLabel: '五等奖', prizeAmount: 1 },
        { nickname: '李四', prizeLevel: 'second', prizeLabel: '二等奖', prizeAmount: 26 },
        { nickname: '张三', prizeLevel: 'first', prizeLabel: '一等奖', prizeAmount: 66 }
      ]
    });

    expect(text.indexOf('张三 一等奖')).toBeLessThan(text.indexOf('李四 二等奖'));
    expect(text.indexOf('李四 二等奖')).toBeLessThan(text.indexOf('王五 五等奖'));
  });
});
