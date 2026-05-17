import { validateBallSet } from '../domain/rules.js';

const NUMBER_PATTERN = /(?<!\d)\d{1,2}(?!\d)/gu;
const DASH_PATTERN = /[-－–—]/u;
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
  const numberTokens = findNumberTokens(normalizedLine);
  const nickname = extractNickname(normalizedLine, numberTokens[0]);

  if (!nickname) {
    return invalidLine('缺少昵称', '请把昵称放在每行开头');
  }

  if (hasDashBetweenRedAndBlue(normalizedLine, numberTokens)) {
    return parseDashedBettingLine(nickname, numberTokens);
  }

  return parseSequentialBettingLine(nickname, numberTokens);
}

function stripLeadingIndex(line) {
  return line.replace(LEADING_INDEX_PATTERN, '');
}

function normalizeNickname(value) {
  const nickname = String(value ?? '')
    .trim()
    .replace(/[|,，\s]+$/u, '')
    .replace(TRAILING_GROUP_NICKNAME_PATTERN, '')
    .trim();
  const mojibakeParenIndex = nickname.lastIndexOf('锛堝');
  return mojibakeParenIndex >= 0 ? nickname.slice(0, mojibakeParenIndex).trim() : nickname;
}

function findNumberTokens(line) {
  return [...line.matchAll(NUMBER_PATTERN)].map((match) => ({
    raw: match[0],
    value: Number(match[0]),
    index: match.index,
    end: match.index + match[0].length
  }));
}

function extractNickname(line, firstNumberToken) {
  if (!firstNumberToken) {
    return '';
  }
  return normalizeNickname(line.slice(0, firstNumberToken.index));
}

function parseSequentialBettingLine(nickname, numberTokens) {
  if (numberTokens.length < 7) {
    return invalidBet(nickname, tokenValues(numberTokens), 0, ['号码数量缺失']);
  }

  if (numberTokens.length !== 7) {
    return invalidBet(nickname, tokenValues(numberTokens), numberTokens[6]?.value ?? 0, [`号码数量错误，识别到 ${numberTokens.length} 个号码`]);
  }

  const numbers = tokenValues(numberTokens);

  return {
    parsed: true,
    nickname,
    redBalls: numbers.slice(0, 6),
    blueBall: numbers[6],
    invalidReasons: []
  };
}

function parseDashedBettingLine(nickname, numberTokens) {
  if (numberTokens.length < 7) {
    return invalidBet(nickname, tokenValues(numberTokens), 0, ['号码数量缺失']);
  }

  const redNumbers = tokenValues(numberTokens.slice(0, 6));
  const blueNumbers = tokenValues(numberTokens.slice(6));

  return {
    parsed: true,
    nickname,
    bets: blueNumbers.map((blueBall) => ({
      nickname,
      redBalls: redNumbers,
      blueBall,
      invalidReasons: []
    }))
  };
}

function hasDashBetweenRedAndBlue(line, numberTokens) {
  if (numberTokens.length < 7) {
    return DASH_PATTERN.test(line);
  }
  const betweenSixthAndSeventh = line.slice(numberTokens[5].end, numberTokens[6].index);
  return DASH_PATTERN.test(betweenSixthAndSeventh);
}

function tokenValues(tokens) {
  return tokens.map((token) => token.value);
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
