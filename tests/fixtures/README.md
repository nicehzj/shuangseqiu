# Fixture Notes

`sample-history.xlsx` is a small workbook for manual quickstart validation.
Integration tests also generate in-memory workbooks. This fixture intentionally
keeps the legacy `PersonalRecords` and `WinningRecords` sheets so import
compatibility can be checked manually.

The fixture workbook contains these sheets:

- `Draws`
- `PrizePool`
- `HistoricalRanking`
- `MonthlyRanking`
- `PersonalRecords`
- `WinningRecords`

Newly exported workbooks use Chinese public sheet names:

- `开奖记录`
- `奖池记录`
- `历史排行榜`
- `月度排行榜`

They no longer include `PersonalRecords` or `WinningRecords`; personal records
are split into one sheet per participant, with Chinese column names.
