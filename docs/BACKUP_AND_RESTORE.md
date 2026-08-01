# 备份与恢复

## 自动策略

- 每日 03:00：PostgreSQL、自描述清单、Directus schema、Compose/Caddy 配置、镜像与容器版本；保留 7 份。
- 每周日 03:30：在每日内容基础上增加 Directus uploads；保留 4 份。
- 持久化目录：`/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/backups/blog`，独立于仓库和运行数据目录。
- 每份归档生成同名 `.sha256`，创建前检查剩余空间。
- 明文 `secrets/.env` 明确排除。凭据必须另存到密码管理器中的加密条目，恢复时写回原路径并设置权限 `600`。
- 节点小宝的私钥配置不进入常规博客备份；其安装位置、保护性快照和映射恢复说明记录于 `docs/NODE_XIAOBAO.md`。

## 手工备份

```sh
PROJECT_ROOT='/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog'; export PROJECT_ROOT; "$PROJECT_ROOT/repo/scripts/backup.sh" weekly
```

成功输出会给出归档和校验文件的绝对路径。不要在备份目录外移动其中一个而漏掉另一个。

## 恢复

恢复必须明确指定归档，并显式设置确认变量：

```sh
PROJECT_ROOT='/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog'; export PROJECT_ROOT; CONFIRM_RESTORE=YES "$PROJECT_ROOT/repo/scripts/restore.sh" '/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/backups/blog/weekly/blog-weekly-YYYYMMDD-HHMMSS.tar.gz'
```

脚本依次校验 SHA256 和归档路径、创建当前数据库快照、停止 Caddy/Web/Directus 写入、恢复 PostgreSQL、在周备份中恢复 uploads、重启所有服务，并检查 H5 与 Directus 健康端点。旧 uploads 会移动到 `backups/blog/pre-restore/uploads-pre-restore-*`，不会直接删除。

恢复失败时脚本会尝试重新拉起服务，并保留恢复前快照；不会自动进行第二次破坏性恢复。根据失败日志选定刚生成的每日快照，再由人工执行同一条显式恢复命令。

## 2026-08-01 恢复演练证据

- 周备份：`backups/blog/weekly/blog-weekly-20260801-143305.tar.gz`，SHA256 校验通过，包含数据库 dump、uploads、schema、Caddy/Compose、镜像状态及秘密排除说明。
- 隔离恢复：dump 成功恢复到临时数据库 `blog_restore_drill_20260801`，正式文章 `startup-vs-speculation` 数量为 1，随后删除该临时数据库。
- 完整恢复：正式恢复脚本先生成 `backups/blog/daily/blog-daily-20260801-143354.tar.gz`，再恢复周备份；PostgreSQL 与 uploads 恢复成功，五个项目容器重新启动。
- 恢复后验收：Directus 健康状态 `ok`；正式文章 200；草稿公开 API 数量 0、公开页面 404；错误预览密钥 404、正确密钥 200；到期排期文章 200，未来排期文章 404。

演练结论：`PASS`。
