import * as XLSX from 'xlsx';
import {
  LEGACY_PERSONAL_RECORDS_SHEET,
  REQUIRED_COLUMNS,
  RESERVED_SHEETS,
  SHEETS,
  findSheetName,
  normalizeRowKeys,
  parseBalls,
  reverseTranslatedValue
} from './workbook-schema.js';

export async function readWorkbookFromFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  return normalizeWorkbook(workbook);
}

export function normalizeWorkbook(workbook) {
  const validation = validateWorkbookSchema(workbook);
  const rows = {};

  for (const sheetName of Object.values(SHEETS)) {
    rows[sheetName] = sheetToRows(workbook, sheetName);
  }
  const personalRecords = readPersonalRecords(workbook);

  return {
    workbook,
    sheets: workbook.SheetNames,
    errors: validation.errors,
    missingSheets: validation.missingSheets,
    warnings: validation.warnings,
    valid: validation.errors.length === 0,
    drawRecords: rows[SHEETS.draws].map(normalizeDraw),
    prizePoolRecords: rows[SHEETS.prizePool].map(normalizePool),
    historicalRankings: rows[SHEETS.historicalRanking],
    monthlyRankings: rows[SHEETS.monthlyRanking],
    personalRecords
  };
}

export function validateWorkbookSchema(workbook) {
  const errors = [];
  const missingSheets = [];
  const warnings = [];
  for (const [sheetName, columns] of Object.entries(REQUIRED_COLUMNS)) {
    const actualSheetName = findSheetName(workbook, sheetName);
    if (!actualSheetName) {
      missingSheets.push(sheetName);
      warnings.push(`缺少工作表：${sheetName}，点击生成结果后会自动创建`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[actualSheetName], { defval: '' }).map(normalizeRowKeys);
    if (rows.length === 0) {
      continue;
    }
    const present = new Set(Object.keys(rows[0]));
    for (const column of columns) {
      if (!present.has(column)) {
        errors.push(`${sheetName} 缺少列：${column}`);
      }
    }
  }
  return { errors, missingSheets, warnings };
}

export function sheetToRows(workbook, sheetName) {
  const actualSheetName = findSheetName(workbook, sheetName) ?? sheetName;
  const sheet = workbook.Sheets[actualSheetName];
  if (!sheet) {
    return [];
  }
  return XLSX.utils.sheet_to_json(sheet, { defval: '' }).map(normalizeRowKeys);
}

export function detectDuplicate(history, date, issue) {
  const byDate = history.drawRecords.some((record) => String(record.date) === String(date));
  const byIssue = issue ? history.drawRecords.some((record) => String(record.issue) === String(issue)) : false;
  return {
    duplicate: byDate || byIssue,
    byDate,
    byIssue,
    message: byDate && byIssue ? 'Excel 中已存在相同日期和期次' : byDate ? 'Excel 中已存在相同日期' : byIssue ? 'Excel 中已存在相同期次' : ''
  };
}

function normalizeDraw(row) {
  return {
    ...row,
    redBalls: parseBalls(row.redBalls),
    blueBall: Number(row.blueBall),
    playType: reverseTranslatedValue('playType', row.playType),
    participantCount: Number(row.participantCount || 0),
    betCount: Number(row.betCount || 0)
  };
}

function normalizePool(row) {
  return {
    ...row,
    openingBalance: Number(row.openingBalance || 0),
    income: Number(row.income || 0),
    payout: Number(row.payout || 0),
    rollover: Number(row.rollover || 0),
    closingBalance: Number(row.closingBalance || 0)
  };
}

function normalizePersonal(row) {
  return {
    ...row,
    redBalls: parseBalls(row.redBalls),
    blueBall: Number(row.blueBall || 0),
    playType: reverseTranslatedValue('playType', row.playType),
    prizeLevel: reverseTranslatedValue('prizeLevel', row.prizeLevel),
    fundingSource: reverseTranslatedValue('fundingSource', row.fundingSource),
    prizeAmount: Number(row.prizeAmount || 0)
  };
}

function readPersonalRecords(workbook) {
  const records = [];
  if (workbook.Sheets[LEGACY_PERSONAL_RECORDS_SHEET]) {
    records.push(...sheetToRows(workbook, LEGACY_PERSONAL_RECORDS_SHEET).map(normalizePersonal));
  }

  for (const sheetName of workbook.SheetNames) {
    if (RESERVED_SHEETS.has(sheetName)) {
      continue;
    }
    records.push(
      ...sheetToRows(workbook, sheetName).map((row) =>
        normalizePersonal({
          nickname: row.nickname || sheetName,
          ...row
        })
      )
    );
  }

  return records;
}
