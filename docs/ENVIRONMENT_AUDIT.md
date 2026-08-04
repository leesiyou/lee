# 环境盘点

盘点时间：2026-08-01（Asia/Shanghai）

## GitHub

- 仓库：`https://github.com/leesiyou/lee`
- 可见性：Public
- 初始状态：真正空仓库，无分支、无文件、无历史
- 当前账号：`leesiyou`，对仓库具有 admin/push 权限
- 本机 GitHub CLI 已登录，Git 操作协议为 HTTPS
- 已创建保护性空 `main` 基线 commit `3472efb`
- 功能分支：`feature/h5-blog-system`

## 本机开发环境

- 项目目录：`/Volumes/开发盘加数据 1t/2026年开发/李思友思想实验室博客系统`
- Node.js：`v22.22.3`
- npm：`10.9.8`
- Git：`2.54.0`
- Docker CLI / Docker Desktop / Colima / OrbStack：未发现
- 结论：Node 单测、类型检查和 Astro build 在本机执行；Compose/Docker 集成验收在飞牛的隔离项目中执行。

## 飞牛主机

- SSH：`104spos@192.168.5.104`，已使用 macOS 钥匙串凭据验证登录；凭据未写入仓库或文档
- 主机名：`REBLES`
- 系统：Debian GNU/Linux 12，x86_64
- 内核：`6.18.18-trim`
- 时区：`Asia/Shanghai`
- 内存：7.7 GiB，总可用约 5.9 GiB；Swap 4 GiB
- Docker Engine：`28.5.2`
- Docker Compose：`v2.40.3`
- Docker data-root：`/vol6/1000/Docker部署盘/01_Docker容器/docker-data`
- Docker 存储驱动：`overlay2`

## 磁盘

| 挂载点 | 类型 | 容量 | 可用 | 使用率 |
| --- | --- | ---: | ---: | ---: |
| `/` | ext4 | 55 GiB | 35 GiB | 33% |
| `/vol1` | btrfs | 466 GiB | 423 GiB | 9% |
| `/vol2` | btrfs | 466 GiB | 432 GiB | 8% |
| `/vol3` | btrfs | 1.9 TiB | 1.5 TiB | 24% |
| `/vol4` | btrfs | 895 GiB | 746 GiB | 17% |
| `/vol5` | btrfs | 447 GiB | 362 GiB | 19% |
| `/vol6` | btrfs | 1.9 TiB | 1.1 TiB | 44% |

`/vol6` 已是现有 Docker 部署盘并有 `03_网站项目` 目录，选作本项目代码、运行数据和备份所在稳定卷。

## 现有 Docker 与端口基线

- Docker daemon 正常；盘点时没有运行中的业务容器。
- 旧容器均为 Exited，包含 n8n、GAZI、Easybreak、SPOS、AI WebUI 等；本项目不删除、重建或改动这些容器。
- 现有 Docker 网络和 volume 已记录；本项目使用独立 `blog_internal` 网络和 `blog-*` 容器名。
- 系统已占用 22、80、443、445、5666、5667、18088 等端口。
- 选择未占用的 `19080`（博客）和 `19081`（后台），避免影响现有服务和未来旧容器恢复。
- PostgreSQL 和 Redis 不映射宿主机端口。

## 节点小宝

- 进程：`NodeBabyLinkService`
- 网络接口：`NodeBabyLink`，地址 `10.222.222.1/32`
- 安装目录：`/vol6/@appcenter/owjdxb`
- 数据目录：`/vol6/@appdata/owjdxb`
- 当前服务运行正常；未修改配置、未删除映射、未重启服务。
- 配置包含私钥文件，后续只做受限备份，不读取或提交私钥内容。
- 未发现可安全调用的公开映射 API；如后续仍无可用 API，只把新增两个映射保留为最后一次人工 UI 操作。

## 域名

公共 Cloudflare DoH 结果：

- `blog.easybreak.top`：NXDOMAIN
- `blog-admin.easybreak.top`：NXDOMAIN
- `daily.easybreak.top`：NXDOMAIN
- `thoughts.easybreak.top`：NXDOMAIN
- `cms-blog.easybreak.top`：NXDOMAIN
- `easybreak.top`：已有 Cloudflare A 记录且 HTTPS 200
- `www.easybreak.top`：已有 Cloudflare A 记录且 HTTPS 200

因此采用默认两个博客子域名，不修改根域名和 `www`。

## 明确未执行的操作

- 未删除、启动、停止或修改任何旧容器
- 未修改旧网络、volume、Nginx 或节点小宝映射
- 未执行 Docker prune
- 未读取或输出节点小宝私钥
- 仅在独立的 `104-h5-blog` Compose 项目中创建了五个博客容器；旧容器、旧网络、旧 volume 和原有节点小宝映射保持不变
