# Data Model: 群内双色球统计与战报生成 HTML 工具

## HistoricalWorkbook

Represents the uploaded Excel file after validation and normalization.

**Fields**:
- `sheets`: available worksheet names
- `drawRecords`: list of `DrawRecord`
- `prizePoolRecords`: list of `PrizePoolRecord`
- `historicalRankings`: list of `RankingRecord`
- `monthlyRankings`: list of `RankingRecord`
- `personalRecords`: list of `PersonalRecord`
- `schemaWarnings`: non-blocking workbook observations

**Validation Rules**:
- Required data areas for draws, prize pool, historical rankings, monthly
  rankings, personal bets, and winning records must exist.
- Required columns must be readable before calculation starts.
- Workbook is never mutated in place; export uses a cloned workbook model.

## ProcessingSession

Represents one attempted daily run.

**Fields**:
- `date`
- `issue`
- `playType`: `ordinary` or `fridayJackpot`
- `winningNumbers`
- `rawBettingText`
- `parseResults`
- `duplicateDecision`: `overwrite`, `skip`, `newIssue`, or unset
- `status`: `editing`, `validated`, `duplicateBlocked`, `ready`, `exported`

**State Transitions**:
- `editing` -> `validated` after workbook, bets, and winning numbers pass validation.
- `validated` -> `duplicateBlocked` when date or issue already exists.
- `duplicateBlocked` -> `ready` after the user chooses a duplicate handling option.
- `validated` -> `ready` when no duplicate is found.
- `ready` -> `exported` after workbook and report are generated.

## WinningNumbers

**Fields**:
- `redBalls`: six unique integers from 1 to 9
- `blueBall`: one integer from 1 to 8

**Validation Rules**:
- Red balls must be exactly six unique values.
- Blue ball must be exactly one value.
- All values must stay within configured ranges.

## BettingRecord

One parsed line from the pasted betting text.

**Fields**:
- `lineNumber`
- `nickname`
- `redBalls`: six unique integers from 1 to 9
- `blueBall`: one integer from 1 to 8
- `rawText`

**Validation Rules**:
- Nickname must be present.
- Red and blue ball counts and ranges must be valid.
- Duplicate red balls are invalid.
- Duplicate participant entries for the same date or issue require user confirmation or correction.

## ParseError

**Fields**:
- `lineNumber`
- `rawText`
- `reason`
- `suggestion`

**Validation Rules**:
- Every rejected line must have one specific reason suitable for display.
- Final generation is blocked while parse errors exist.

## PrizeRuleSet

Central configuration for a play mode.

**Fields**:
- `playType`
- `redRange`
- `blueRange`
- `prizeLevels`
- `payoutFormula`
- `poolIncomeFormula`
- `noWinnerHandling`
- `rankingCounters`

**Validation Rules**:
- Every prize level must have a matching condition and payout behavior.
- No-winner handling must be explicit.
- Rules must be deterministic and covered by sample tests.

## WinningResult

**Fields**:
- `bettingRecord`
- `redMatches`
- `blueMatched`
- `prizeLevel`
- `prizeAmount`
- `explanation`

**Validation Rules**:
- Result must be derivable from the bet, winning numbers, and active rule set.
- Prize amount must be non-negative and finite.

## PrizePoolRecord

**Fields**:
- `date`
- `issue`
- `openingBalance`
- `income`
- `payout`
- `rollover`
- `closingBalance`
- `notes`

**Validation Rules**:
- Closing balance must equal opening balance plus income plus rollover minus payout.
- Negative or non-finite values are abnormal and block final output.
- Insufficient pool conditions must be reported before export.

## RankingRecord

**Fields**:
- `scope`: `historical` or `monthly`
- `period`
- `nickname`
- `winCount`
- `totalPrizeAmount`
- `bestPrizeLevel`
- `rankBefore`
- `rankAfter`
- `change`

**Validation Rules**:
- Historical rankings use all available records.
- Monthly rankings use records in the processing month.
- Ranking changes must compare before and after today's approved updates.

## PersonalRecord

**Fields**:
- `nickname`
- `date`
- `issue`
- `playType`
- `redBalls`
- `blueBall`
- `prizeLevel`
- `prizeAmount`
- `resultExplanation`

**Validation Rules**:
- One approved personal record is written per accepted betting record unless the
  user explicitly confirms a duplicate handling option.

## BattleReport

**Fields**:
- `dateOrIssue`
- `winningNumbers`
- `participantCount`
- `betCount`
- `winnerList`
- `prizeSummary`
- `poolChange`
- `currentPoolBalance`
- `historicalRankingChanges`
- `monthlyRankingChanges`
- `notices`

**Validation Rules**:
- All required report sections must be present.
- No-winner and abnormal handling notes must be explicit.
- Text must be copy-ready without manual rewriting.
