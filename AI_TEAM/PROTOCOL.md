# AI Team Protocol v1

> DSH（ENGINEERING_OS）↔ Hermes（QA_RELEASE）双向通讯协议。
> 状态：**已接通**。本文件是协议契约，真实消息存于 Hermes Kanban `ai-team` board（LEVEL 1 通道），`AI_TEAM/messages/` 为审计镜像（LEVEL 4 fallback）。

## 身份

| 常量 | 值 |
|---|---|
| `DSH_ID` | `engineering-os` |
| `HERMES_ID` | `qa-release` |
| `AI_TEAM_PROTOCOL_VERSION` | `1` |

职责分工：

- **DSH / ENGINEERING_OS**：开发、修复、测试、Agent 调度、代码交付。**不自行宣布验收 PASS，不 merge main。**
- **Hermes / QA_RELEASE**：验收、审计、日志、PR、发布检查。不接管大规模开发。

链路：`GPT → DSH → Hermes → PASS/FAIL → DSH 修复 或 GitHub PR`

## 通道（实测可用，2026-09-21 探测）

| 优先级 | 通道 | 实现 | 状态 |
|---|---|---|---|
| LEVEL 1 | Hermes Kanban `ai-team` board | `hermes kanban --board ai-team create/comment/show/complete`（SQLite：`~/.hermes/kanban/boards/ai-team/kanban.db`） | ✅ 已建立 |
| LEVEL 2 | Hermes gateway / peer API | `hermes peer dm`（需对端 api_server + API_SERVER_KEY） | ⚠️ 未配置 peers，预留 |
| LEVEL 3 | GitHub PR / issue / comment | origin `github.com/leesiyou/lee.git` | ✅ 可用 |
| LEVEL 4 | `AI_TEAM/messages/` 文件队列 | `dsh-outbox/ dsh-inbox/ hermes-outbox/ hermes-inbox/` | ✅ 审计镜像 + fallback |

Kanban 上每条消息 = 一张卡片：标题含 `type` 与 `message_id`，正文为 JSON payload；回复以 `comment`（author 区分 `engineering-os` / `qa-release`）或子卡片挂载。卡片 idempotency-key 用 `message_id`，保证幂等（同 id 不重复建卡）。

## 消息信封（所有消息必填）

```json
{
  "protocol_version": 1,
  "message_id": "msg-<ulid-or-uuid>",
  "timestamp": "<ISO-8601>",
  "from": "engineering-os | qa-release",
  "to": "qa-release | engineering-os",
  "type": "<MSG_TYPE>",
  "task_id": "<TASK_ID 或 null>",
  "repo": "leesiyou/lee",
  "branch": "<branch>",
  "base_head": "<sha>",
  "current_head": "<sha>",
  "payload": {},
  "requires_ack": true
}
```

## 消息类型

`HELLO` / `HELLO_ACK` · `TASK_HANDOFF` / `TASK_ACK` · `QA_REQUEST` / `QA_REQUEST_ACK` / `QA_RESULT` · `FIX_REQUEST` / `FIX_ACK` · `LOG_EVENT` / `INCIDENT` · `PR_REQUEST` / `PR_RESULT` · `DEPLOY_REQUEST` / `DEPLOY_RESULT` · `HEARTBEAT` / `HEARTBEAT_ACK` · `ERROR`

## 交付流

1. DSH 完成开发 → `QA_REQUEST`（含 TASK_ID/repo/branch/BASE_HEAD/FINAL_HEAD/changed_files/test_results/build_results/api_changes/db_changes/known_risks/rollback）+ `AI_TEAM/HANDOFF.md`
2. Hermes → `QA_REQUEST_ACK` → 验收 → `QA_RESULT`：`PASS`（validated_head/tests/risks/PR_STATUS/release_notes）| `FAIL`（结构化 P0/P1/P2：files/reason/expected/actual/reproduction/recommended_fix）| `BLOCKED`
3. `FAIL` → Hermes 发 `FIX_REQUEST` → DSH `FIX_ACK` 并修复 → 重新 `QA_REQUEST`
4. `PASS` → Hermes 整理 PR（DSH 不自行 merge main）

## 心跳

`HEARTBEAT` → `HEARTBEAT_ACK`，payload 含 `status: READY|BUSY|DEGRADED|OFFLINE` 与 `protocol_version`。只在开发开始 / 交付 / 验收三个节点检查，不刷频。

## 故障降级与幂等

- Hermes 暂不可达：消息先落 `AI_TEAM/messages/dsh-outbox/`（`status: pending`），恢复后重放；未 ACK 消息不丢。
- 幂等：`message_id` 即 kanban `--idempotency-key`；重发同 id 不产生重复卡片/任务/PR。

## CLI 速查

```bash
HERMES=~/.hermes/hermes-agent/venv/bin/hermes
# 发消息（DSH→Hermes）：建卡，body 为信封 JSON
$HERMES kanban --board ai-team create "<TYPE> <message_id>" \
  --body "$(cat envelope.json)" --idempotency-key "<message_id>" \
  --created-by engineering-os --workspace dir:"$PWD"
# 回消息：对原卡 comment
$HERMES kanban --board ai-team comment <task_id> "<json>" --author qa-release
# 读消息
$HERMES kanban --board ai-team show <task_id> --json
# 列通道
$HERMES kanban --board ai-team list
```
