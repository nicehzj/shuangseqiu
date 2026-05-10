# Local Tool Contract

This document defines the user-visible contracts for the local HTML tool. It is
not a network API contract; all data remains in the browser unless the user
downloads the generated workbook or copies the report.

## Input Contract: Historical Excel

The user provides one workbook file.

**Required historical data areas**:
- Historical draw data
- Prize pool records
- Historical winning rankings
- Monthly winning rankings
- Personal betting records
- Personal winning records

**System behavior**:
- If required sheets or columns are missing, show a blocking validation error.
- If the workbook is valid, treat it as the sole historical source.
- Preserve existing history when generating the new workbook.

## Input Contract: Betting Text

The user pastes one betting record per line.

**Line content**:
- Participant nickname
- Six red ball numbers
- One blue ball number

**Accepted separators**:
- Space
- English comma
- Chinese comma
- Vertical bar
- Common combinations of the above

**Validation behavior**:
- Empty text is a blocking error.
- Each invalid line reports line number, raw text, and reason.
- Accepted red balls are exactly six unique numbers from 1 to 9.
- Accepted blue ball is exactly one number from 1 to 8.

## Input Contract: Winning Numbers

The user enters or selects today's winning numbers.

**Validation behavior**:
- Red balls: exactly six unique numbers from 1 to 9.
- Blue ball: exactly one number from 1 to 8.
- Invalid winning numbers block calculation.

## Duplicate Handling Contract

Before writing today's data, the system checks whether the workbook already
contains the same date or issue.

**If duplicate data is found, the user must choose one**:
- `overwrite`: replace the matching current date or issue records.
- `skip`: do not write today's records; no final updated workbook is generated for the duplicate run.
- `newIssue`: generate records under a new user-confirmed issue.

No duplicate date or issue may be written silently.

## Output Contract: Updated Excel

After successful calculation and duplicate handling, the system provides a new
downloadable workbook.

**Required behavior**:
- Original uploaded workbook remains unchanged.
- Existing history is preserved.
- Today's approved draw, pool, ranking, personal betting, and winning records are appended or updated.
- Abnormal prize pool or non-finite calculation results block export.

## Output Contract: Battle Report

After successful calculation, the system provides copy-ready report text.

**Required sections**:
- Today's date or issue
- Winning numbers
- Participant count
- Total bet count
- Winner list
- Prize-level winner counts and payouts
- Today's prize pool change
- Current prize pool balance
- Historical ranking changes
- Monthly ranking changes
- Important notices, including no-winner or duplicate handling notes

## Error Contract

Errors must be user-actionable.

**Required error details**:
- Workbook errors identify missing sheet or column when known.
- Betting text errors identify line number and reason.
- Duplicate processing errors identify matching date or issue.
- Calculation errors identify the affected rule, participant, prize level, or pool value when known.
