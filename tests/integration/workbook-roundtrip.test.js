import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { normalizeWorkbook, detectDuplicate } from '../../src/excel/workbook-reader.js';
import { writeUpdatedWorkbook } from '../../src/excel/workbook-writer.js';
import { SHEETS } from '../../src/excel/workbook-schema.js';

function makeWorkbook() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([{ date: '2026-05-09', issue: '000', playType: 'ordinary', redBalls: '1 2 3 4 5 6', blueBall: 7, participantCount: 1, betCount: 1 }]),
    SHEETS.draws
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([{ date: '2026-05-09', issue: '000', openingBalance: 100, income: 2, payout: 0, rollover: 0, closingBalance: 102, notes: '' }]),
    SHEETS.prizePool
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), SHEETS.historicalRanking);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), SHEETS.monthlyRanking);
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([{ nickname: '旧用户', date: '2026-05-09', issue: '000', playType: 'ordinary', redBalls: '1 2 3 4 5 6', blueBall: 7, prizeLevel: 'none', prizeAmount: 0, resultExplanation: '未中奖' }]),
    'PersonalRecords'
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'WinningRecords');
  return workbook;
}

function update(date = '2026-05-10', issue = '001') {
  return {
    date,
    issue,
    playType: 'ordinary',
    winningNumbers: { redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 },
    records: [{ nickname: '张三', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 }],
    results: [{ nickname: '张三', prizeLevel: 'grand', prizeLabel: '特等奖', prizeAmount: 20 }],
    poolRecord: { date, issue, openingBalance: 102, income: 2, payout: 20, rollover: 0, closingBalance: 84, notes: [] },
    rankings: {
      historical: [{ scope: 'historical', period: 'all', nickname: '张三', winCount: 1, totalPrizeAmount: 20, bestPrizeLevel: 'grand', rankBefore: null, rankAfter: 1, change: 0 }],
      monthly: [{ scope: 'monthly', period: '2026-05', nickname: '张三', winCount: 1, totalPrizeAmount: 20, bestPrizeLevel: 'grand', rankBefore: null, rankAfter: 1, change: 0 }]
    },
    personalRecords: [{ nickname: '张三', date, issue, playType: 'ordinary', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7, prizeLevel: 'grand', prizeAmount: 20 }]
  };
}

describe('workbook roundtrip', () => {
  it('warns for missing sheets without blocking generation', () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ date: '2026-05-09', issue: '000', playType: 'ordinary', redBalls: '1 2 3 4 5 6', blueBall: 7, participantCount: 1, betCount: 1 }]),
      SHEETS.draws
    );
    const history = normalizeWorkbook(workbook);

    expect(history.valid).toBe(true);
    expect(history.missingSheets).toContain(SHEETS.prizePool);
    expect(history.warnings[0]).toContain('点击生成结果后会自动创建');

    const result = writeUpdatedWorkbook(history, update(), null);
    const sheetNames = result.workbook.SheetNames;
    expect(Object.values(SHEETS).every((sheetName) => sheetNames.includes(sheetName))).toBe(true);
    expect(sheetNames).not.toContain('WinningRecords');
    expect(sheetNames).not.toContain('PersonalRecords');
  });

  it('preserves history and appends today', () => {
    const history = normalizeWorkbook(makeWorkbook());
    const result = writeUpdatedWorkbook(history, update(), null);
    const normalized = normalizeWorkbook(result.workbook);

    expect(normalized.drawRecords).toHaveLength(2);
    expect(normalized.personalRecords.find((record) => record.nickname === '旧用户')).toBeTruthy();
    expect(normalized.personalRecords.find((record) => record.nickname === '张三')).toBeTruthy();
    expect(XLSX.utils.sheet_to_json(result.workbook.Sheets[SHEETS.draws], { defval: '' })[0].红球).toBe('01 02 03 04 05 06');
    expect(XLSX.utils.sheet_to_json(result.workbook.Sheets[SHEETS.draws], { defval: '' })[0].蓝球).toBe('07');
    expect(XLSX.utils.sheet_to_json(result.workbook.Sheets[SHEETS.draws], { defval: '' }).at(-1).红球).toBe('01 02 03 04 05 06');
    expect(XLSX.utils.sheet_to_json(result.workbook.Sheets[SHEETS.draws], { defval: '' }).at(-1).蓝球).toBe('07');
    expect(XLSX.utils.sheet_to_json(result.workbook.Sheets[SHEETS.draws], { defval: '' }).at(-1).玩法).toBe('普通日玩法');
    expect(result.workbook.SheetNames).toContain('张三');
    expect(result.workbook.SheetNames).not.toContain('WinningRecords');
    expect(result.workbook.SheetNames).not.toContain('PersonalRecords');
    const zhangSanRows = XLSX.utils.sheet_to_json(result.workbook.Sheets['张三'], { defval: '' });
    expect(Object.keys(zhangSanRows[0])).toEqual(['日期', '期次', '玩法', '红球', '蓝球', '奖项', '中奖金额', '入池金额', '资金来源']);
    expect(zhangSanRows[0].玩法).toBe('普通日玩法');
    expect(zhangSanRows[0].资金来源).toBe('');
    expect(Object.keys(zhangSanRows[0])).not.toContain('resultExplanation');
  });

  it('writes redistribution records into participant sheets in Chinese', () => {
    const history = normalizeWorkbook(makeWorkbook());
    const nextUpdate = update();
    nextUpdate.personalRecords.push({
      nickname: '张三',
      date: '2026-05-10',
      issue: '001',
      playType: 'ordinary',
      redBalls: [],
      blueBall: '',
      prizeLevel: 'redistributionDeduct',
      prizeAmount: -1,
      contribution: '',
      fundingSource: 'redistribution'
    });

    const result = writeUpdatedWorkbook(history, nextUpdate, null);
    const zhangSanRows = XLSX.utils.sheet_to_json(result.workbook.Sheets['张三'], { defval: '' });

    expect(zhangSanRows.at(-1)).toMatchObject({
      奖项: '劫富济贫扣除',
      中奖金额: -1,
      资金来源: '劫富济贫'
    });
  });

  it('detects duplicate date and issue', () => {
    const history = normalizeWorkbook(makeWorkbook());

    expect(detectDuplicate(history, '2026-05-09', '999')).toMatchObject({ duplicate: true, byDate: true });
    expect(detectDuplicate(history, '2026-05-10', '000')).toMatchObject({ duplicate: true, byIssue: true });
  });

  it('supports overwrite, skip, and new issue decisions', () => {
    const history = normalizeWorkbook(makeWorkbook());

    const overwritten = normalizeWorkbook(writeUpdatedWorkbook(history, update('2026-05-09', '000'), 'overwrite').workbook);
    expect(overwritten.drawRecords).toHaveLength(1);
    expect(overwritten.drawRecords[0].participantCount).toBe(1);

    const skipped = writeUpdatedWorkbook(history, update('2026-05-09', '000'), 'skip');
    expect(skipped.skipped).toBe(true);

    const newIssue = normalizeWorkbook(writeUpdatedWorkbook(history, update('2026-05-09', '002'), 'newIssue').workbook);
    expect(newIssue.drawRecords).toHaveLength(2);
    expect(newIssue.drawRecords.some((record) => record.issue === '002')).toBe(true);
  });
});
