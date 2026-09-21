# HANDOFF — DSH↔Hermes 握手通讯建立

| 字段 | 值 |
|---|---|
| TASK_ID | `HANDSHAKE-000`（链路）/ `HANDSHAKE-001`（QA 演练）/ `HANDSHAKE-002`（修复演练） |
| repo | `leesiyou/lee` |
| branch | `feature/h5-blog-system` |
| BASE_HEAD | `1318969b5eddbec02b2357e734a034130769de38` |
| FINAL_HEAD | 待本次 commit（见下方"修改文件"） |
| 日期 | 2026-09-21 |
| 结果 | **COMMUNICATION_STATUS = PASS**（4/4 测试真实闭环） |

## 通讯通道（已接通）

| 层级 | 通道 | 状态 |
|---|---|---|
| LEVEL 1 | Hermes Kanban board `ai-team`（`~/.hermes/kanban/boards/ai-team/kanban.db`），CLI：`hermes kanban --board ai-team` | ✅ 主通道，双向实测 |
| LEVEL 2 | `hermes peer dm`（跨机 API server） | ⚠️ 未配置 peers，预留 |
| LEVEL 3 | GitHub PR / issue（`github.com/leesiyou/lee`） | ✅ PR gate 可用 |
| LEVEL 4 | `AI_TEAM/messages/{dsh,hermes}-{inbox,outbox}/` | ✅ 审计镜像 + 离线 fallback |

适配器：`AI_TEAM/channel.py`（envelope/发卡/回评/镜像/幂等）。

## 完成内容

- 探测 Hermes 真实接口：`hermes_cli` + kanban SQLite 看板（非凭空假设）。
- 建 `ai-team` board 作为协议通道；一消息一卡片、回复走 comment、message_id 作 idempotency-key。
- 四项握手测试全部真实闭环（证据见下）。
- 建协议契约 `AI_TEAM/PROTOCOL.md`、状态 `AI_TEAM/PROJECT_STATE.md`。

## 测试证据（Kanban 卡片 ↔ comment 真实收发）

| TEST | 方向 | 发出 message_id / 卡片 | 回收 message_id | 结果 |
|---|---|---|---|---|
| 1 HELLO | DSH→Hermes | `msg-hello-8398f5550828` / `t_edd2451e` | `msg-hello-ack-8398f5550828`（HELLO_ACK，status=READY，checks 全过） | ✅ PASS |
| 2 QA_REQUEST | DSH→Hermes | `msg-qa-request-70a9aa3315a1` / `t_ebb8cf67` | `msg-qa-request-ack-70a9aa3315a1`（QA_REQUEST_ACK，qa_verdict=PASS，validated_head=1318969） | ✅ PASS |
| 3 HEARTBEAT | Hermes→DSH | `msg-heartbeat-6e6cafabe6f5` / `t_dff245d6` | DSH 回 `msg-heartbeat-ack-fbcbc37d3b19`；Hermes TASK_ACK `msg-task-ack-80f472dd0056` 确认收到 | ✅ PASS |
| 4 FIX_REQUEST | Hermes→DSH | `msg-fix-request-c9edda504ec0` / `t_9137913e` | DSH 回 `msg-fix-ack-bc3939fa5672`；Hermes run#4 completed 确认闭环 | ✅ PASS |

双向证明：DSH 发出的信封出现在 Hermes 侧（卡片 body + Hermes run 摘要回读），Hermes 发出的信封出现在 DSH 侧（`dsh-inbox/` 镜像 + comment 回读）。

## 过程中的真实故障（非伪造记录）

- 初版 `CHANNEL.sh` heredoc 缺陷 → 卡 `t_1533d154` 空载荷、无 assignee，Hermes 回 `ERROR msg-error-20260921-001`（P1）。修复：改用 `channel.py`、卡片加 `--assignee default`、新 idempotency-key 重发。死信卡 t_1533d154 / t_dbd21e15 已 block 标记，勿重放。
- `CHANNEL.sh` 已删除，`channel.py` 为唯一适配器。

## 修改文件（新增）

```
AI_TEAM/PROTOCOL.md        协议 v1 契约
AI_TEAM/PROJECT_STATE.md   项目状态快照
AI_TEAM/HANDOFF.md         本文件
AI_TEAM/channel.py         通道适配器
AI_TEAM/messages/**        双向消息镜像（JSON 留痕）
```

## API/DB/配置变化

无生产代码变化；新增 Hermes kanban board `ai-team`（`~/.hermes/kanban/boards/ai-team/kanban.db`）。

## 已知风险

- Hermes 侧处理是 LLM agent 异步领取卡片（秒~分钟级延迟），非实时 RPC——这是真实语义，已在协议中声明。
- `hermes peer`（跨机）未配置；目前为同机 LEVEL 1。
- 工作区存在其他 Agent 未提交改动（ops/nas/*、apps/web/public/104-print-lab 等），本任务未触碰。

## 回滚

删除 `AI_TEAM/` 目录并 `hermes kanban boards rm ai-team` 即可完全移除本通道。

## 遗留事项

- 生产代码 QA 流程需在新任务中走同一通道（QA_REQUEST→QA_RESULT→PR gate）。
- 如需跨机 Hermes，配置 `hermes peer add` + api_server。

—— DSH / engineering-os
