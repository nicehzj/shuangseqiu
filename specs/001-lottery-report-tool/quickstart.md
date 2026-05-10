# Quickstart: 群内双色球统计与战报生成 HTML 工具

## Prerequisites

- A modern desktop browser.
- A historical Excel workbook with the required data areas.
- Today's betting text, one participant per line.
- Today's winning numbers and play type.

## Install For Development

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the local page shown by the dev command. The tool must work without login,
server-side storage, cloud upload, or database setup.

## Validate The Core Flow

1. Upload `tests/fixtures/sample-history.xlsx`.
2. Paste the contents of `tests/fixtures/ordinary-day-bets.txt`.
3. Select ordinary-day play.
4. Enter valid winning numbers.
5. Generate results.
6. Confirm that the page shows winners, prize pool changes, rankings, and report text.
7. Download the generated Excel.
8. Confirm the original Excel file remains unchanged.
9. Confirm the generated battle report can be copied directly.

## Validate Friday Jackpot

1. Upload the sample history workbook.
2. Paste `tests/fixtures/friday-jackpot-bets.txt`.
3. Select Friday jackpot play.
4. Use sample numbers that produce no grand-prize winner.
5. Confirm the no-grand-prize handling appears in both prize pool results and battle report notices.

## Validate Error Handling

1. Try generating with empty betting text.
2. Try a line with fewer than six red balls.
3. Try a line with duplicated red balls.
4. Try an invalid blue ball outside 1-8.
5. Try a workbook missing a required sheet.
6. Try processing a date or issue that already exists in the workbook.

Each error must identify the exact user action needed. Betting text errors must
show the specific line number and reason.

## Run Tests

```bash
npm test
```

The test suite must include sample verification for:
- Betting parser validation
- Winning calculation
- Prize pool update
- Historical and monthly ranking update
- Workbook roundtrip preservation and append/update behavior
- Battle report required sections
