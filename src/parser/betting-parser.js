import { validateBallSet } from '../domain/rules.js';

const SEPARATOR_PATTERN = /[\s,，|]+/u;
const DASH_SEPARATOR_PATTERN = /\s+-\s+/u;
const LEADING_INDEX_PATTERN = /^\s*\d+\s+/u;
const TRAILING_GROUP_NICKNAME_PATTERN = /(?:（[^（）]*）|\([^()]*\))\s*$/u;

export function parseBettingText(text) {
  const rawText = text ?? '';
  const lines = rawText.split(/\r?\n/);
  const records = [];
  const errors = [];

  if (!rawText.trim()) {
    return {
      records,
      errors: [
        {
          lineNumber: 1,
          rawText: '',
          reason: '投注文本不能为空',
          suggestion: '请粘贴至少一行投注记录'
        }
      ]
    };
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const rawLine = line;
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    const parsedLine = parseBettingLine(trimmed);
    if (!parsedLine.parsed) {
      errors.push({
        lineNumber,
        rawText: rawLine,
        reason: parsedLine.reason,
        suggestion: parsedLine.suggestion
      });
      return;
    }

    const bets = parsedLine.bets ?? [parsedLine];
    for (const bet of bets) {
      const validation = validateBallSet(bet.redBalls, bet.blueBall);
      const invalidReasons = [...(bet.invalidReasons ?? [])];

      if (!validation.valid) {
        invalidReasons.push(...validation.errors);
      }

      records.push({
        lineNumber,
        nickname: bet.nickname,
        redBalls: validation.valid ? validation.redBalls : bet.redBalls,
        blueBall: validation.valid ? validation.blueBall : bet.blueBall,
        valid: invalidReasons.length === 0,
        invalidReasons,
        rawText: rawLine
      });
    }
  });

  return { records, errors };
}

function parseBettingLine(line) {
  const normalizedLine = stripLeadingIndex(line);
  if (DASH_SEPARATOR_PATTERN.test(normalizedLine)) {
    return parseDashedBettingLine(normalizedLine);
  }
  return parseSequentialBettingLine(normalizedLine);
}

function stripLeadingIndex(line) {
  return line.replace(LEADING_INDEX_PATTERN, '');
}

function normalizeNickname(value) {
  return String(value ?? '').trim().replace(TRAILING_GROUP_NICKNAME_PATTERN, '').trim();
}

function parseSequentialBettingLine(line) {
  const parts = line.split(SEPARATOR_PATTERN).filter(Boolean);
  if (parts.length < 8) {
    if (!parts[0]) {
      return invalidLine('投注行必须包含昵称、6 个红球和 1 个蓝球', '示例：张三 01 02 03 04 05 06 - 07');
    }
    return invalidBet(parts[0], [], 0, ['号码数量缺失']);
  }

  const nickname = normalizeNickname(parts[0]);
  if (!nickname) {
    return invalidLine('缺少昵称', '请把昵称放在每行开头');
  }

  const numberTokens = parts.slice(1);
  if (numberTokens.length !== 7) {
    const parsed = parseNumberTokens(numberTokens);
    return invalidBet(nickname, parsed.values ?? [], parsed.values?.[6] ?? 0, [`号码数量错误，识别到 ${numberTokens.length} 个号码`]);
  }

  const numbers = parseNumberTokens(numberTokens);

  return {
    parsed: true,
    nickname,
    redBalls: numbers.values.slice(0, 6),
    blueBall: numbers.values[6],
    invalidReasons: numbers.parsed ? [] : [numbers.reason]
  };
}

function parseDashedBettingLine(line) {
  const [left, right, ...rest] = line.split(DASH_SEPARATOR_PATTERN);
  if (rest.length > 0 || !left || !right) {
    return invalidLine('短横线格式错误', '示例：张三 01 02 03 04 05 06 - 07');
  }

  const leftParts = left.split(SEPARATOR_PATTERN).filter(Boolean);
  if (leftParts.length < 2) {
    return invalidLine('短横线前必须包含昵称和红球号码', '示例：张三 01 02 03 04 05 06 - 07');
  }

  const nickname = normalizeNickname(leftParts[0]);
  if (!nickname) {
    return invalidLine('缺少昵称', '请把昵称放在每行开头');
  }

  const redTokens = leftParts.slice(1);
  const blueTokens = right.split(SEPARATOR_PATTERN).filter(Boolean);
  if (redTokens.length !== 6 || blueTokens.length < 1) {
    const redNumbers = parseNumberTokens(redTokens);
    const blueNumbers = parseNumberTokens(blueTokens);
    return invalidBet(nickname, redNumbers.values ?? [], blueNumbers.values?.[0] ?? 0, ['号码数量缺失']);
  }

  const redNumbers = parseNumberTokens(redTokens);
  const blueNumbers = parseNumberTokens(blueTokens);

  return {
    parsed: true,
    nickname,
    bets: blueNumbers.values.map((blueBall) => ({
      nickname,
      redBalls: redNumbers.values,
      blueBall,
      invalidReasons: [redNumbers, blueNumbers].filter((item) => !item.parsed).map((item) => item.reason)
    }))
  };
}

function parseNumberTokens(tokens) {
  const values = tokens.map((token) => Number(token));
  if (values.some((value) => !Number.isInteger(value))) {
    return { parsed: false, values, reason: '号码必须是整数', suggestion: '请移除非数字内容' };
  }
  return { parsed: true, values };
}

function invalidLine(reason, suggestion) {
  return { parsed: false, reason, suggestion };
}

function invalidBet(nickname, values, blueBall, invalidReasons) {
  return {
    parsed: true,
    nickname,
    redBalls: values.slice(0, 6),
    blueBall,
    invalidReasons
  };
}

export function findDuplicateParticipants(records) {
  const seen = new Map();
  const duplicates = [];

  for (const record of records) {
    if (seen.has(record.nickname)) {
      duplicates.push({
        nickname: record.nickname,
        firstLine: seen.get(record.nickname),
        duplicateLine: record.lineNumber
      });
    } else {
      seen.set(record.nickname, record.lineNumber);
    }
  }

  return duplicates;
}
