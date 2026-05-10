# Implementation Plan: 群内双色球统计与战报生成 HTML 工具

**Branch**: `001-lottery-report-tool` | **Date**: 2026-05-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-lottery-report-tool/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a local-first HTML single-page tool that lets a group administrator upload
the historical Excel workbook, paste today's betting records, enter winning
numbers, calculate winners and prize pool changes, update rankings and personal
records, then export a new Excel workbook and copy-ready group report.

The implementation will use browser-only processing, a small modular JavaScript
codebase, centralized lottery rules, sample-data tests for core calculations,
and a workbook adapter that preserves existing workbook data while appending or
updating the approved current date or issue.

## Technical Context

**Language/Version**: JavaScript ES modules targeting modern desktop browsers  
**Primary Dependencies**: SheetJS CE for browser Excel read/write; Vitest for core logic tests  
**Storage**: Local browser memory plus user-selected Excel import/export files; no database or server storage  
**Testing**: Vitest unit tests with sample workbook and betting fixtures; browser smoke checks for the static page  
**Target Platform**: Local desktop browser  
**Project Type**: Static single-page web tool  
**Performance Goals**: Process a normal daily group input of at least 100 betting lines and generate outputs within 5 seconds on a typical desktop browser  
**Constraints**: Browser-local processing only; preserve uploaded workbook history; no login, backend, cloud storage, telemetry, database, or real payment flow  
**Scale/Scope**: One local operator, one workbook per run, one date or issue processed per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Local-first browser processing: PASS. The plan uses a static browser app and no backend, cloud storage, telemetry, database, or network transfer.
- Uploaded Excel remains the sole historical source: PASS. Workbook import is authoritative and export creates a new workbook preserving history.
- Traceable calculations: PASS. Rules, parsed bets, winning numbers, workbook history, and result explanations are modeled explicitly.
- Centralized rules: PASS. `src/domain/rules.js` owns play modes, prize definitions, payout behavior, and no-winner handling.
- Required outputs: PASS. Exported workbook and battle report text are first-class user outputs.
- Line-specific betting validation: PASS. Parser returns per-line parse results and errors.
- Duplicate date or issue confirmation: PASS. Duplicate detection blocks final export until the user chooses overwrite, skip, or new issue.
- Maintainable module boundaries: PASS. Excel I/O, parsing, calculation, pool/ranking updates, report generation, and UI orchestration are separate modules.
- Core sample tests: PASS. Tests cover winning judgment, prize pool updates, rankings, Excel write behavior, and report generation.

Post-design re-check: PASS. The data model, contracts, and quickstart preserve all gates with no justified violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-lottery-report-tool/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── local-tool-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html
package.json
src/
├── app.js
├── styles.css
├── domain/
│   ├── rules.js
│   ├── calculator.js
│   ├── prize-pool.js
│   ├── rankings.js
│   └── report.js
├── excel/
│   ├── workbook-reader.js
│   ├── workbook-writer.js
│   └── workbook-schema.js
├── parser/
│   └── betting-parser.js
└── ui/
    ├── state.js
    ├── validation-view.js
    └── report-view.js

tests/
├── fixtures/
│   ├── sample-history.xlsx
│   ├── ordinary-day-bets.txt
│   └── friday-jackpot-bets.txt
├── unit/
│   ├── betting-parser.test.js
│   ├── calculator.test.js
│   ├── prize-pool.test.js
│   ├── rankings.test.js
│   └── report.test.js
└── integration/
    └── workbook-roundtrip.test.js
```

**Structure Decision**: Use a single static web tool at the repository root.
The code is split by responsibility to satisfy the constitution while keeping
the project lightweight. No backend or database directories are planned.

## Complexity Tracking

No constitution violations identified.
