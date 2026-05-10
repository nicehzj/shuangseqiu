# Tasks: 群内双色球统计与战报生成 HTML 工具

**Input**: Design documents from `/specs/001-lottery-report-tool/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/local-tool-contract.md, quickstart.md

**Tests**: Required for affected core logic: betting parsing, winning judgment,
prize pool updates, ranking statistics, Excel writing, and report generation.

**Organization**: Tasks are grouped by user story so each story can be implemented
and tested independently after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: User story label, used only for user story phases
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the static browser project, dependency baseline, and planned directory structure.

- [X] T001 Create project directories `src/domain/`, `src/excel/`, `src/parser/`, `src/ui/`, `tests/fixtures/`, `tests/unit/`, and `tests/integration/`
- [X] T002 Create static app entry files `index.html`, `src/app.js`, and `src/styles.css`
- [X] T003 Create `package.json` with scripts for `npm run dev`, `npm test`, and `npm run test:watch`
- [X] T004 Install and record project dependencies `xlsx`, `vitest`, `vite`, and `@vitest/browser` in `package.json`
- [X] T005 [P] Create Vitest configuration in `vitest.config.js`
- [X] T006 [P] Create project README usage stub in `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared rules, schemas, fixtures, and module contracts required by all user stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T007 Define centralized ordinary-day and Friday jackpot rule configuration in `src/domain/rules.js`
- [X] T008 Define workbook sheet and column schema constants in `src/excel/workbook-schema.js`
- [X] T009 Create workbook reader skeleton with schema validation result shape in `src/excel/workbook-reader.js`
- [X] T010 Create workbook writer skeleton with non-mutating workbook update contract in `src/excel/workbook-writer.js`
- [X] T011 Create betting parser skeleton with accepted records and line-level errors in `src/parser/betting-parser.js`
- [X] T012 Create calculation skeleton and result explanation shape in `src/domain/calculator.js`
- [X] T013 Create prize pool update skeleton and abnormal result shape in `src/domain/prize-pool.js`
- [X] T014 Create ranking update skeleton for historical and monthly scopes in `src/domain/rankings.js`
- [X] T015 Create battle report generator skeleton in `src/domain/report.js`
- [X] T016 Create shared UI state model in `src/ui/state.js`
- [X] T017 [P] Create sample ordinary-day betting fixture in `tests/fixtures/ordinary-day-bets.txt`
- [X] T018 [P] Create sample Friday jackpot betting fixture in `tests/fixtures/friday-jackpot-bets.txt`
- [X] T019 [P] Create documented sample workbook fixture generation notes in `tests/fixtures/README.md`

**Checkpoint**: Foundation ready; user story implementation can start.

---

## Phase 3: User Story 1 - 完成每日投注统计与战报生成 (Priority: P1) MVP

**Goal**: User uploads a valid historical Excel workbook, pastes valid bets, enters winning numbers, calculates results, downloads a new workbook, and copies the battle report.

**Independent Test**: Use valid sample history, ordinary-day bets, and winning numbers to verify displayed results, exported workbook, and copy-ready report.

### Tests for User Story 1

- [X] T020 [P] [US1] Add parser success tests for valid betting lines in `tests/unit/betting-parser.test.js`
- [X] T021 [P] [US1] Add winning judgment tests for ordinary-day prize levels in `tests/unit/calculator.test.js`
- [X] T022 [P] [US1] Add prize pool update tests for ordinary-day winner and no-winner cases in `tests/unit/prize-pool.test.js`
- [X] T023 [P] [US1] Add historical and monthly ranking update tests in `tests/unit/rankings.test.js`
- [X] T024 [P] [US1] Add battle report required-section tests in `tests/unit/report.test.js`
- [X] T025 [US1] Add workbook roundtrip preservation and append tests in `tests/integration/workbook-roundtrip.test.js`

### Implementation for User Story 1

- [X] T026 [US1] Implement valid betting text parsing with common separators in `src/parser/betting-parser.js`
- [X] T027 [US1] Implement winning number validation and match counting in `src/domain/calculator.js`
- [X] T028 [US1] Implement ordinary-day prize calculation and result explanations in `src/domain/calculator.js`
- [X] T029 [US1] Implement ordinary-day prize pool balance update in `src/domain/prize-pool.js`
- [X] T030 [US1] Implement historical and monthly ranking recalculation in `src/domain/rankings.js`
- [X] T031 [US1] Implement report text generation with required report sections in `src/domain/report.js`
- [X] T032 [US1] Implement Excel workbook reading and normalization in `src/excel/workbook-reader.js`
- [X] T033 [US1] Implement Excel workbook writing that preserves history and appends today in `src/excel/workbook-writer.js`
- [X] T034 [US1] Build upload, betting text, winning number, and play type controls in `index.html`
- [X] T035 [US1] Implement page orchestration for valid generate flow in `src/app.js`
- [X] T036 [US1] Implement report rendering and copy action in `src/ui/report-view.js`
- [X] T037 [US1] Implement result styling for inputs, actions, summaries, and report area in `src/styles.css`

**Checkpoint**: User Story 1 is independently usable as the MVP.

---

## Phase 4: User Story 2 - 识别投注文本问题并指导修正 (Priority: P2)

**Goal**: User receives precise line-numbered validation errors for empty, malformed, out-of-range, duplicated, or incomplete betting text.

**Independent Test**: Paste mixed valid and invalid betting text and verify final generation is blocked until errors are fixed.

### Tests for User Story 2

- [X] T038 [P] [US2] Add parser error tests for empty text, missing nickname, insufficient red balls, missing blue ball, duplicate red balls, and out-of-range numbers in `tests/unit/betting-parser.test.js`
- [X] T039 [P] [US2] Add UI validation rendering tests for line-specific errors in `tests/unit/validation-view.test.js`

### Implementation for User Story 2

- [X] T040 [US2] Implement detailed ParseError reasons and suggestions in `src/parser/betting-parser.js`
- [X] T041 [US2] Implement generation blocking when parse errors exist in `src/app.js`
- [X] T042 [US2] Implement line-specific validation display in `src/ui/validation-view.js`
- [X] T043 [US2] Add validation error styling in `src/styles.css`
- [X] T044 [US2] Document accepted betting separators and correction guidance in `README.md`

**Checkpoint**: User Story 2 validates pasted text independently and prevents bad data from entering calculations.

---

## Phase 5: User Story 3 - 防止重复处理同一天或同一期 (Priority: P3)

**Goal**: User is warned when the workbook already contains the same date or issue and must choose overwrite, skip, or new issue before export.

**Independent Test**: Use a workbook containing the same date or issue and verify each duplicate handling option behaves as specified.

### Tests for User Story 3

- [X] T045 [P] [US3] Add duplicate date and duplicate issue detection tests in `tests/integration/workbook-roundtrip.test.js`
- [X] T046 [P] [US3] Add writer tests for overwrite, skip, and new issue decisions in `tests/integration/workbook-roundtrip.test.js`

### Implementation for User Story 3

- [X] T047 [US3] Implement duplicate date and issue detection in `src/excel/workbook-reader.js`
- [X] T048 [US3] Add duplicate decision state transitions in `src/ui/state.js`
- [X] T049 [US3] Implement duplicate choice UI for overwrite, skip, and new issue in `index.html`
- [X] T050 [US3] Implement duplicate choice handling and export blocking in `src/app.js`
- [X] T051 [US3] Implement overwrite, skip, and new issue write behavior in `src/excel/workbook-writer.js`
- [X] T052 [US3] Include duplicate handling notices in battle report generation in `src/domain/report.js`

**Checkpoint**: User Story 3 prevents silent duplicate writes.

---

## Phase 6: User Story 4 - 支持普通日与大乐透玩法 (Priority: P4)

**Goal**: User can select ordinary-day or Friday jackpot play and get rule-correct prize results, pool behavior, and report notices.

**Independent Test**: Run ordinary-day and Friday jackpot fixtures, including a Friday jackpot no-grand-prize case, and compare expected results.

### Tests for User Story 4

- [X] T053 [P] [US4] Add Friday jackpot prize-level tests in `tests/unit/calculator.test.js`
- [X] T054 [P] [US4] Add Friday jackpot no-grand-prize pool handling tests in `tests/unit/prize-pool.test.js`
- [X] T055 [P] [US4] Add report notice tests for Friday jackpot no-grand-prize handling in `tests/unit/report.test.js`

### Implementation for User Story 4

- [X] T056 [US4] Complete Friday jackpot rule definitions in `src/domain/rules.js`
- [X] T057 [US4] Implement play-type-specific prize calculation in `src/domain/calculator.js`
- [X] T058 [US4] Implement Friday jackpot no-grand-prize pool behavior in `src/domain/prize-pool.js`
- [X] T059 [US4] Include selected play type and special notices in report output in `src/domain/report.js`
- [X] T060 [US4] Wire play type selection into calculation flow in `src/app.js`
- [X] T061 [US4] Add play type controls and labels in `index.html`

**Checkpoint**: User Story 4 supports both planned play modes with sample verification.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete tool, improve usability, and finish documentation.

- [X] T062 [P] Add quickstart validation notes and sample commands in `README.md`
- [X] T063 Run and fix full test suite with `npm test` covering `tests/unit/` and `tests/integration/`
- [X] T064 Run browser smoke validation for the full flow described in `specs/001-lottery-report-tool/quickstart.md`
- [X] T065 Verify generated battle report includes all required fields from `specs/001-lottery-report-tool/contracts/local-tool-contract.md`
- [X] T066 Verify no backend, cloud storage, telemetry, database, login, or external data transfer was introduced in `src/`
- [X] T067 Review workbook export behavior against original-data preservation requirements in `src/excel/workbook-writer.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1 MVP**: Depends on Phase 2.
- **Phase 4 US2**: Depends on Phase 2 and integrates with US1 UI flow, but parser validation can be developed independently.
- **Phase 5 US3**: Depends on Phase 2 and workbook reader/writer contracts from US1.
- **Phase 6 US4**: Depends on Phase 2 and calculation/pool contracts from US1.
- **Phase 7 Polish**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Core MVP; implement first for end-to-end value.
- **US2 (P2)**: Can start after foundational parser skeleton; final integration follows US1 app flow.
- **US3 (P3)**: Can start after workbook schema and writer skeleton; final behavior builds on US1 export flow.
- **US4 (P4)**: Can start after centralized rules and calculator skeleton; final behavior builds on US1 calculation flow.

### Within Each User Story

- Write mandatory tests before implementation where practical.
- Implement domain logic before UI orchestration.
- Implement workbook write behavior before final download wiring.
- Complete and validate each story before moving to the next priority when working sequentially.

## Parallel Opportunities

- T005 and T006 can run in parallel after T003.
- T017, T018, and T019 can run in parallel during foundation setup.
- US1 test tasks T020-T024 can run in parallel before implementation.
- US2 test tasks T038-T039 can run in parallel.
- US3 test tasks T045-T046 can run in parallel.
- US4 test tasks T053-T055 can run in parallel.
- After Phase 2, US2 parser validation, US3 duplicate detection, and US4 rule tests can be developed in parallel if file ownership is coordinated.

## Parallel Example: User Story 1

```bash
# Launch independent US1 test tasks together:
Task: "Add parser success tests for valid betting lines in tests/unit/betting-parser.test.js"
Task: "Add winning judgment tests for ordinary-day prize levels in tests/unit/calculator.test.js"
Task: "Add prize pool update tests for ordinary-day winner and no-winner cases in tests/unit/prize-pool.test.js"
Task: "Add historical and monthly ranking update tests in tests/unit/rankings.test.js"
Task: "Add battle report required-section tests in tests/unit/report.test.js"
```

## Parallel Example: User Story 2

```bash
Task: "Add parser error tests in tests/unit/betting-parser.test.js"
Task: "Add UI validation rendering tests in tests/unit/validation-view.test.js"
```

## Parallel Example: User Story 3

```bash
Task: "Add duplicate detection tests in tests/integration/workbook-roundtrip.test.js"
Task: "Add writer decision tests in tests/integration/workbook-roundtrip.test.js"
```

## Parallel Example: User Story 4

```bash
Task: "Add Friday jackpot prize-level tests in tests/unit/calculator.test.js"
Task: "Add Friday jackpot no-grand-prize pool handling tests in tests/unit/prize-pool.test.js"
Task: "Add report notice tests in tests/unit/report.test.js"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for the ordinary-day end-to-end flow.
3. Validate with sample workbook, valid betting text, generated Excel, and battle report.

### Incremental Delivery

1. MVP: upload Excel, parse valid bets, calculate ordinary-day results, export workbook, generate report.
2. Add robust text error handling from US2.
3. Add duplicate date or issue protection from US3.
4. Add Friday jackpot behavior from US4.
5. Finish polish and full quickstart validation.

### Validation Gates

- Parser and calculation tests pass.
- Workbook roundtrip test proves existing history is preserved.
- Report test proves required sections are present.
- Manual browser smoke test proves the local page can complete the full flow.
- Review confirms no server, cloud, database, login, telemetry, or payment behavior exists.

