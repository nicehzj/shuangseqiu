import { BALL_RULES, normalizeNumbers } from './rules.js';

export function generateWinningNumbers(randomInt = secureRandomInt) {
  const pool = [];
  for (let value = BALL_RULES.red.min; value <= BALL_RULES.red.max; value += 1) {
    pool.push(value);
  }

  const redBalls = [];
  while (redBalls.length < BALL_RULES.red.count) {
    const index = randomInt(pool.length);
    redBalls.push(pool.splice(index, 1)[0]);
  }

  return {
    redBalls: normalizeNumbers(redBalls),
    blueBall: randomInt(BALL_RULES.blue.max - BALL_RULES.blue.min + 1) + BALL_RULES.blue.min
  };
}

function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }

  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.getRandomValues) {
    throw new Error('当前浏览器不支持安全随机数生成');
  }

  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const values = new Uint32Array(1);
  let value;
  do {
    cryptoObject.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return value % maxExclusive;
}
