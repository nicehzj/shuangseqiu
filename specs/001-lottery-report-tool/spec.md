# Feature Specification: 群内双色球统计与战报生成 HTML 工具

**Feature Branch**: `001-lottery-report-tool`  
**Created**: 2026-05-10  
**Status**: Draft  
**Input**: User description: "实现一个本地运行的 HTML 单页工具，用于处理群内双色球玩法的每日投注统计、中奖计算、奖池更新、排行榜更新，并生成新的 Excel 文件和群内战报文案。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 完成每日投注统计与战报生成 (Priority: P1)

群管理员打开工具，上传历史 Excel，粘贴今日所有投注记录，输入今日开奖号码，
系统完成解析、计算、更新并生成可下载的新 Excel 与可复制的今日战报。

**Why this priority**: 这是工具的核心闭环，只有完成该流程，用户才能把每日群内玩法统计从手工处理变成稳定流程。

**Independent Test**: 使用一份包含必要工作表的历史 Excel、有效投注文本和开奖号码，
验证用户能得到更新后的 Excel 文件和完整战报文案。

**Acceptance Scenarios**:

1. **Given** 用户已上传有效历史 Excel、粘贴有效投注记录并输入今日开奖号码，**When** 用户执行生成，**Then** 系统显示计算结果，提供新 Excel 下载，并生成可复制战报文案。
2. **Given** 今日有多人参与且存在不同奖项中奖者，**When** 系统完成计算，**Then** 战报包含参与人数、投注总数、中奖名单、各奖项人数和奖金、奖池变化、排行榜变化。
3. **Given** 今日无人中奖，**When** 系统完成计算，**Then** 战报明确说明无人中奖，并按玩法规则更新奖池。

---

### User Story 2 - 识别投注文本问题并指导修正 (Priority: P2)

用户将群消息复制到文本框后，系统识别每行投注记录中的昵称、红球和蓝球。
如果出现空文本、号码数量错误、号码范围错误、重复号码或无法识别的格式，
系统给出具体行号和原因，帮助用户快速修正。

**Why this priority**: 投注文本来自群聊，格式容易不一致；明确提示能避免错误数据进入 Excel 和战报。

**Independent Test**: 输入混合了有效行和错误行的投注文本，验证系统逐行指出错误，
且不会在错误未解决时生成最终结果。

**Acceptance Scenarios**:

1. **Given** 投注文本为空，**When** 用户执行生成，**Then** 系统提示投注文本不能为空。
2. **Given** 第 3 行红球不足 6 个或蓝球缺失，**When** 用户执行生成，**Then** 系统提示第 3 行的具体错误。
3. **Given** 投注记录使用空格、逗号、中文逗号或竖线分隔，**When** 系统解析，**Then** 常见分隔符格式能被正确识别。

---

### User Story 3 - 防止重复处理同一天或同一期 (Priority: P3)

用户上传的历史 Excel 中可能已经包含当天或相同期次的记录。系统在写入前检测重复，
并要求用户选择覆盖、跳过或生成新期次，避免重复写入。

**Why this priority**: 重复写入会破坏历史排名、奖池和个人记录，是数据可信度的关键风险。

**Independent Test**: 使用已包含相同日期或期次的 Excel 重新处理同一天数据，
验证系统在最终写入前给出明确选择，并按用户选择处理。

**Acceptance Scenarios**:

1. **Given** Excel 中已存在相同日期记录，**When** 用户执行生成，**Then** 系统提示重复日期并提供覆盖、跳过或生成新期次选项。
2. **Given** Excel 中已存在相同期次记录，**When** 用户执行生成，**Then** 系统提示重复期次并等待用户确认处理方式。

---

### User Story 4 - 支持普通日与大乐透玩法 (Priority: P4)

用户按当天玩法输入投注与开奖号码，系统根据普通日或大乐透规则计算奖项、
奖金、无人中奖处理和奖池变化。

**Why this priority**: 群内玩法存在不同日期规则；规则错误会直接影响战报和资金统计。

**Independent Test**: 分别使用普通日和大乐透样例数据，验证相同投注在不同玩法下得到符合规则的奖项和奖池结果。

**Acceptance Scenarios**:

1. **Given** 今日为普通日玩法，**When** 系统计算中奖结果，**Then** 奖项、奖金和奖池变化按普通日规则生成。
2. **Given** 今日为大乐透玩法且无人中特等奖，**When** 系统计算中奖结果，**Then** 系统按大乐透无人中特等奖规则处理奖池和战报提示。

### Edge Cases

- Excel 文件缺失历史开奖、奖池、历史中奖排名、月度中奖排名、个人投注或中奖记录所需工作表。
- Excel 文件存在必要工作表但关键列缺失或数据无法识别。
- 投注文本为空或只包含空白行。
- 投注行缺少昵称、红球、蓝球，或包含无法识别的号码。
- 红球不是 1-9 范围内的 6 个不重复号码。
- 蓝球不是 1-8 范围内的 1 个号码。
- 同一用户在同一天重复投注。
- Excel 中已存在同一天或相同期次记录。
- 今日无人中奖。
- 多人命中同一奖项。
- 大乐透无人中特等奖。
- 奖池不足以覆盖计算出的派奖金额。
- 奖池变化或奖金计算出现负数、非数字或不一致结果。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the user to upload one historical Excel file before generating final results.
- **FR-002**: System MUST validate that the uploaded Excel contains the required historical data areas for draws, prize pool, historical ranking, monthly ranking, personal betting records, and winning records.
- **FR-003**: System MUST preserve existing historical Excel data when producing the updated Excel output.
- **FR-004**: System MUST allow the user to paste today's betting records into a text box, with one person's bet per line.
- **FR-005**: System MUST parse each betting line into nickname, six red ball numbers, and one blue ball number.
- **FR-006**: System MUST accept common separators including spaces, commas, Chinese commas, and vertical bars.
- **FR-007**: System MUST reject empty betting text with a clear message.
- **FR-008**: System MUST report line-specific parsing errors with line number and reason.
- **FR-009**: System MUST validate that red balls are exactly 6 unique numbers from 1 to 9.
- **FR-010**: System MUST validate that the blue ball is exactly 1 number from 1 to 8.
- **FR-011**: System MUST detect duplicate bets by the same user for the same processing date or issue and require user confirmation or correction before final output.
- **FR-012**: System MUST allow the user to enter or select today's winning numbers.
- **FR-013**: System MUST validate today's winning numbers using the same red ball and blue ball ranges.
- **FR-014**: System MUST support ordinary-day play rules.
- **FR-015**: System MUST support Friday jackpot play rules.
- **FR-016**: System MUST calculate each participant's winning status, prize level, and prize amount according to the selected play rules.
- **FR-017**: System MUST calculate prize counts and total payout per prize level.
- **FR-018**: System MUST update the prize pool according to today's participation, winnings, payout rules, and no-winner handling rules.
- **FR-019**: System MUST detect and clearly report prize pool insufficiency or abnormal calculation results before producing final output.
- **FR-020**: System MUST update historical winning rankings based on today's results.
- **FR-021**: System MUST update monthly winning rankings based on today's results and processing date.
- **FR-022**: System MUST append or update each participant's personal betting and winning record for today's date or issue.
- **FR-023**: System MUST detect whether the uploaded Excel already contains the same date or issue before writing today's data.
- **FR-024**: System MUST ask the user to choose overwrite, skip, or create a new issue when duplicate date or issue data is detected.
- **FR-025**: System MUST generate a new Excel file containing preserved history plus today's approved updates.
- **FR-026**: System MUST NOT modify or destroy the user's original uploaded Excel file.
- **FR-027**: System MUST generate a copy-ready battle report text after successful calculation.
- **FR-028**: Battle report MUST include today's date or issue, winning numbers, participant count, total bet count, winner list, prize-level counts and payouts, today's prize pool change, current prize pool balance, historical ranking changes, and monthly ranking changes.
- **FR-029**: System MUST clearly state when there are no winners for a prize level or for the whole day.
- **FR-030**: System MUST keep calculation results explainable from the input bets, winning numbers, rules, and Excel history.
- **FR-031**: System MUST NOT require user login, online collaboration, server upload, database storage, or real payment processing.

### Key Entities *(include if feature involves data)*

- **Historical Excel File**: The authoritative source of prior draw data, prize pool records, rankings, personal betting records, and winning records.
- **Draw Record**: A dated or issued lottery result containing winning red balls, winning blue ball, play type, participation summary, and result summary.
- **Betting Record**: One participant's submitted nickname, selected red balls, selected blue ball, date or issue, and validation state.
- **Participant**: A nickname-based group member whose daily bets, wins, historical ranking, and monthly ranking are tracked.
- **Prize Rule**: The selected play mode's prize levels, winning conditions, payout amounts or ratios, prize pool behavior, and no-winner handling.
- **Winning Result**: The calculated outcome for a participant, including matched numbers, prize level, prize amount, and explanation.
- **Prize Pool Record**: The prize pool balance before and after today's processing, including income, payout, rollover, and abnormal states.
- **Ranking Record**: Historical or monthly ranking entries derived from accumulated winning results.
- **Battle Report**: A copy-ready text summary for group posting after the day's results are processed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the full flow from opening the page to downloading the updated Excel and copying the battle report within 5 minutes using valid sample data.
- **SC-002**: For a sample day with at least 20 betting lines, 100% of winning judgments match the expected results from the documented play rules.
- **SC-003**: For valid input, the generated Excel preserves 100% of pre-existing historical rows and adds or updates only the approved current date or issue.
- **SC-004**: For malformed betting input, 100% of unparseable lines are reported with line number and a specific reason.
- **SC-005**: For duplicate date or issue data, the system prevents silent duplicate writing in 100% of tested cases.
- **SC-006**: The generated battle report includes all required report fields and can be copied directly without manual rewriting.
- **SC-007**: For prize pool insufficiency or abnormal calculation samples, the system stops final output and displays a clear problem message.

## Assumptions

- The user operating the tool is a group administrator or statistician who has the current historical Excel file.
- A "bet count" means the number of accepted betting lines unless the play rules define a different counting unit.
- Participant identity is based on the nickname text in the betting record.
- Today's date or issue is provided by the user or derived from the current processing context before final output.
- Ordinary-day and Friday jackpot rules are known project rules and will be expressed as configurable rules during planning.
- Duplicate user bets require confirmation or correction because some groups may allow intentional multiple entries only when explicitly approved.
- The generated Excel may use the existing workbook structure when it is valid and must clearly report missing required structure when it is not.
