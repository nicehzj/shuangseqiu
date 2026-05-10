import * as XLSX from 'xlsx';
import {
  PERSONAL_RECORD_COLUMNS,
  REQUIRED_COLUMNS,
  SHEETS,
  participantSheetName,
  serializeBall,
  serializeBalls,
  toChineseRow
} from './workbook-schema.js';

export function createEmptyWorkbook() {
  const workbook = XLSX.utils.book_new();
  for (const sheetName of Object.values(SHEETS)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), sheetName);
  }
  return workbook;
}

export function writeUpdatedWorkbook(history, update, duplicateDecision) {
  if (duplicateDecision === 'skip') {
    return { skipped: true, workbook: null };
  }

  const nextRows = {
    [SHEETS.draws]: removeDuplicateRows(history.drawRecords, update.date, update.issue, duplicateDecision),
    [SHEETS.prizePool]: removeDuplicateRows(history.prizePoolRecords, update.date, update.issue, duplicateDecision),
    [SHEETS.historicalRanking]: [],
    [SHEETS.monthlyRanking]: []
  };

  nextRows[SHEETS.draws] = nextRows[SHEETS.draws].map(formatDrawRow);
  nextRows[SHEETS.draws].push({
    date: update.date,
    issue: update.issue,
    playType: update.playType,
    redBalls: serializeBalls(update.winningNumbers.redBalls),
    blueBall: serializeBall(update.winningNumbers.blueBall),
    participantCount: new Set(update.records.map((record) => record.nickname)).size,
    betCount: update.records.length
  });

  nextRows[SHEETS.prizePool].push({ ...update.poolRecord, notes: update.poolRecord.notes.join('；') });
  nextRows[SHEETS.historicalRanking] = update.rankings.historical;
  nextRows[SHEETS.monthlyRanking] = update.rankings.monthly;

  const personalRows = update.personalRecords.map((record) => ({
    nickname: record.nickname,
    date: record.date,
    issue: record.issue,
    playType: record.playType,
    redBalls: serializeBalls(record.redBalls),
    blueBall: serializeBall(record.blueBall),
    prizeLevel: record.prizeLevel,
    prizeAmount: record.prizeAmount,
    contribution: record.contribution,
    fundingSource: record.fundingSource
  }));
  const allPersonalRows = [
    ...removeDuplicateRows(history.personalRecords, update.date, update.issue, duplicateDecision),
    ...personalRows
  ];

  const workbook = XLSX.utils.book_new();
  for (const sheetName of Object.values(SHEETS)) {
    XLSX.utils.book_append_sheet(workbook, chineseSheet(nextRows[sheetName], REQUIRED_COLUMNS[sheetName]), sheetName);
  }
  appendParticipantSheets(workbook, allPersonalRows);
  return { skipped: false, workbook };
}

export function downloadWorkbook(workbook, filename) {
  XLSX.writeFile(workbook, filename);
}

function removeDuplicateRows(rows, date, issue, duplicateDecision) {
  if (duplicateDecision !== 'overwrite') {
    return [...(rows ?? [])];
  }
  return (rows ?? []).filter((row) => String(row.date) !== String(date) && (!issue || String(row.issue) !== String(issue)));
}

function appendParticipantSheets(workbook, rows) {
  const grouped = new Map();
  for (const row of rows ?? []) {
    const nickname = row.nickname || '未命名';
    const current = grouped.get(nickname) ?? [];
    current.push(projectPersonalRow(row));
    grouped.set(nickname, current);
  }

  for (const [nickname, userRows] of grouped) {
    XLSX.utils.book_append_sheet(
      workbook,
      chineseSheet(userRows, PERSONAL_RECORD_COLUMNS),
      uniqueSheetName(workbook, participantSheetName(nickname))
    );
  }
}

function projectPersonalRow(row) {
  return {
    date: row.date,
    issue: row.issue,
    playType: row.playType,
    redBalls: Array.isArray(row.redBalls) ? serializeBalls(row.redBalls) : row.redBalls,
    blueBall: row.blueBall == null || row.blueBall === '' ? '' : serializeBall(row.blueBall),
    prizeLevel: row.prizeLevel,
    prizeAmount: row.prizeAmount,
    contribution: row.contribution ?? '',
    fundingSource: row.fundingSource ?? ''
  };
}

function formatDrawRow(row) {
  return {
    ...row,
    redBalls: Array.isArray(row.redBalls) ? serializeBalls(row.redBalls) : row.redBalls,
    blueBall: row.blueBall == null || row.blueBall === '' ? '' : serializeBall(row.blueBall)
  };
}

function toChineseRows(rows, columns) {
  return (rows ?? []).map((row) => toChineseRow(row, columns));
}

function chineseSheet(rows, columns) {
  const translatedRows = toChineseRows(rows, columns);
  const headers = columns.map((column) => toChineseRow({ [column]: '' }, [column]));
  const headerLabels = Object.keys(Object.assign({}, ...headers));
  return XLSX.utils.json_to_sheet(translatedRows, { header: headerLabels });
}

function uniqueSheetName(workbook, preferredName) {
  let name = preferredName.slice(0, 31);
  let index = 2;
  while (workbook.SheetNames.includes(name)) {
    const suffix = `_${index}`;
    name = `${preferredName.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  return name;
}
