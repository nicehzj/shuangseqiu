import { describe, expect, it } from 'vitest';
import { findDuplicateParticipants, parseBettingText } from '../../src/parser/betting-parser.js';

describe('parseBettingText', () => {
  it('parses valid lines with common separators', () => {
    const result = parseBettingText('张三 1 2 3 4 5 6 7\n李四，1，2，3，4，5，6，8\n王五 | 1 | 2 | 3 | 4 | 5 | 9 | 7');

    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(3);
    expect(result.records[0]).toMatchObject({ nickname: '张三', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 });
    expect(result.records[2]).toMatchObject({ nickname: '王五', redBalls: [1, 2, 3, 4, 5, 9], blueBall: 7 });
  });

  it('parses dashed red-blue separator format', () => {
    const result = parseBettingText('王五 01 02 03 04 05 06 - 07');

    expect(result.errors).toEqual([]);
    expect(result.records[0]).toMatchObject({ nickname: '王五', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 });
  });

  it('expands dashed multiple blue balls into multiple bets', () => {
    const result = parseBettingText('王五 01 02 03 04 05 06 - 01 02 03');

    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(3);
    expect(result.records.map((record) => record.blueBall)).toEqual([1, 2, 3]);
    expect(result.records.every((record) => record.nickname === '王五')).toBe(true);
    expect(result.records.every((record) => record.lineNumber === 1)).toBe(true);
    expect(result.records.every((record) => record.redBalls.join(' ') === '1 2 3 4 5 6')).toBe(true);
  });

  it('ignores leading row index before nickname', () => {
    const result = parseBettingText('1 张三 01 02 03 04 05 06 - 07');

    expect(result.errors).toEqual([]);
    expect(result.records[0]).toMatchObject({ nickname: '张三', redBalls: [1, 2, 3, 4, 5, 6], blueBall: 7 });
  });

  it('removes trailing group nickname in Chinese or English parentheses', () => {
    const result = parseBettingText('2 张三（帅哥） 01 02 03 04 05 06 - 07\n3 李四(hero) 01 02 03 04 05 06 - 08');

    expect(result.errors).toEqual([]);
    expect(result.records[0]).toMatchObject({ nickname: '张三', blueBall: 7 });
    expect(result.records[1]).toMatchObject({ nickname: '李四', blueBall: 8 });
  });

  it('reports empty text', () => {
    const result = parseBettingText('   ');

    expect(result.errors[0]).toMatchObject({ lineNumber: 1, reason: '投注文本不能为空' });
  });

  it('keeps recognizable invalid bets as records', () => {
    const result = parseBettingText('张三 1 2 3\n李四 1 2 3 4 5 5 7\n王五 1 2 3 4 5 6 9');

    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(3);
    expect(result.records.every((record) => record.valid === false)).toBe(true);
    expect(result.records[0].invalidReasons).toContain('号码数量缺失');
    expect(result.records[1].invalidReasons).toContain('红球不能重复');
    expect(result.records[2].invalidReasons[0]).toContain('蓝球必须是');
  });

  it('finds duplicate participants', () => {
    const result = parseBettingText('张三 1 2 3 4 5 6 7\n张三 1 2 3 4 5 6 8');

    expect(findDuplicateParticipants(result.records)).toEqual([{ nickname: '张三', firstLine: 1, duplicateLine: 2 }]);
  });
});
