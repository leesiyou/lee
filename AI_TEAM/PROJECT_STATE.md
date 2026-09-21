# AI Team · 项目状态

| 项 | 值 |
|---|---|
| repo | `leesiyou/lee`（origin: github.com/leesiyou/lee.git） |
| 当前分支 | `feature/h5-blog-system` |
| 协议 | `AI_TEAM_PROTOCOL_VERSION=1`（见 [PROTOCOL.md](./PROTOCOL.md)） |
| 通道 | Hermes Kanban board `ai-team`（LEVEL 1）+ 本目录 messages/（LEVEL 4 镜像） |

## 当前在途任务

| TASK_ID | 状态 | 卡片 |
|---|---|---|
| HANDSHAKE-001 | 通讯链路验收（QA_REQUEST→PASS） | kanban |
| HANDSHAKE-002 | 修复链路演练（FIX_REQUEST→FIX_ACK） | kanban |

## 工作区注意事项（开工快照）

- 存在其他会话未提交改动：`ops/nas/prepare-runtime.sh`、`ops/nas/ops-scripts.test.ts`（NAS 部署脚本参数化，非本中枢改动，**不覆盖**）。
- 未跟踪：`apps/web/public/104-print-lab/`、`apps/web/public/h5/2026-08-07/`、`apps/web/src/pages/104-print-lab/`（其他 Agent 产物，**不接管**）。
- 10 个 git worktree 并存于 `.worktrees/`（多条 feature/codex 分支并行开发中）。
