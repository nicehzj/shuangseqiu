# Research: 群内双色球统计与战报生成 HTML 工具

## Decision: Static browser-only single-page app

**Rationale**: The constitution requires local-first processing and no server by
default. A static page with JavaScript modules lets users open the tool locally,
upload a workbook, process data in browser memory, and download a new workbook
without sending data anywhere.

**Alternatives considered**:
- Hosted web app: rejected because it introduces server and data transfer risk.
- Desktop app: rejected because it adds packaging complexity for a lightweight tool.
- Command-line tool: rejected because the core user workflow is paste, inspect,
  download, and copy report text in a browser.

## Decision: SheetJS CE for Excel import/export

**Rationale**: SheetJS CE supports reading workbook data from browser-supplied
file bytes with `XLSX.read`, and supports writing workbook objects back to Excel
formats for browser download with write helpers. This matches the requirement to
use the uploaded Excel as the source and generate a new Excel file locally.

**Alternatives considered**:
- Manual XLSX ZIP/XML manipulation: rejected as error-prone and harder to preserve data.
- CSV-only export: rejected because the feature requires a multi-sheet Excel workbook.
- Server-side Excel processing: rejected by local-first and no-backend constraints.

**References**:
- SheetJS CE Reading Files: https://docs.sheetjs.com/docs/api/parse-options
- SheetJS CE Writing Files: https://docs.sheetjs.com/docs/api/write-options/

## Decision: Centralized rule configuration

**Rationale**: Ordinary-day and Friday jackpot behavior must remain adjustable
without scattering prize and pool logic across the application. A single rule
configuration module will define ball ranges, prize levels, matching conditions,
payout behavior, no-winner handling, and ranking counters.

**Alternatives considered**:
- Hard-code rules inside calculation functions: rejected because rule changes
  would be difficult to audit.
- Store rules only in Excel: rejected for v1 because rule interpretation still
  needs stable code contracts and sample tests.

## Decision: Parse input into line-level results before calculation

**Rationale**: The spec requires common separators and specific line-numbered
errors. The parser will produce accepted betting records and parse errors before
any calculation runs. Final output is blocked while parse errors remain.

**Alternatives considered**:
- Best-effort parse with silent skips: rejected because it could produce
  untraceable or incomplete results.
- One strict format only: rejected because group chat records commonly vary in separators.

## Decision: Workbook adapter with schema validation

**Rationale**: The workbook is the sole historical source, but uploaded files can
be missing sheets or columns. A workbook schema layer will validate required
areas, normalize rows into domain entities, and write approved updates back into
a cloned workbook model before export.

**Alternatives considered**:
- Direct worksheet writes from UI code: rejected because it would mix concerns
  and increase corruption risk.
- Replace the whole workbook with generated sheets: rejected because existing
  history and user formatting may be lost.

## Decision: Vitest for core logic and roundtrip tests

**Rationale**: Core calculations and report generation are plain JavaScript and
fit fast unit tests. Vitest is a Vite-native JavaScript test runner and can also
support browser-mode checks when needed. Tests will use sample betting text and a
sample workbook to verify critical results.

**Alternatives considered**:
- Manual browser-only testing: rejected because core calculations require repeatable sample verification.
- End-to-end tests only: rejected because failures would be harder to diagnose than focused unit tests.

**References**:
- Vitest overview: https://vitest.dev/
- Vitest Browser Mode guide: https://main.vitest.dev/guide/browser/
