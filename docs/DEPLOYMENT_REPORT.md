# 24 项部署报告

报告时间：2026-08-01（Asia/Shanghai）

1. **GitHub 仓库地址**：`https://github.com/leesiyou/lee`
2. **使用分支**：`feature/h5-blog-system`
3. **最新 commit SHA**：最终交付时以该分支 `HEAD` 和 PR 页面显示的完整 SHA 为准；本文件避免嵌入无法自洽的自引用提交号。
4. **Pull Request 地址**：`https://github.com/leesiyou/lee/pull/1`（Draft，未合并）
5. **飞牛实际部署目录**：`/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog`
6. **博客局域网地址**：`http://192.168.5.104:19080`
7. **后台局域网地址**：`http://192.168.5.104:19081`
8. **博客外网 HTTPS 地址**：计划为 `https://blog.easybreak.top`；当前未建立公共解析/映射，未通过
9. **后台外网 HTTPS 地址**：计划为 `https://blog-admin.easybreak.top`；当前未建立公共解析/映射，未通过
10. **Docker 容器清单**：`104-h5-blog-caddy-1`、`104-h5-blog-web-1`、`104-h5-blog-directus-1`、`104-h5-blog-postgres-1`、`104-h5-blog-redis-1`
11. **容器健康状态**：五个容器均 `healthy`
12. **数据持久化目录**：`runtime/postgres`、`runtime/redis`、`runtime/directus-uploads`、`runtime/directus-extensions`、`runtime/caddy-data`、`runtime/caddy-config`、`runtime/logs`
13. **自动部署方式**：GitHub Actions 发布 GHCR；NAS cron 每两分钟检查 digest，只重建 web，失败自动回滚
14. **GitHub Actions 运行结果**：最新实现分支 push 与 Draft PR 的 CI 均成功；`v0.1.0-rc.3` GHCR 发布成功
15. **备份路径**：`/vol6/1000/Docker部署盘/03_网站项目/104-h5-blog/backups/blog`
16. **最近一次备份结果**：每日归档 `daily/blog-daily-20260801-152738.tar.gz` PASS；最近周归档 `weekly/blog-weekly-20260801-143305.tar.gz` PASS；均有 SHA256
17. **恢复测试结果**：临时数据库隔离恢复、正式完整数据库/uploads 恢复、恢复后内容与权限门禁均 PASS
18. **节点小宝新增映射**：尚未新增；待添加前台 `127.0.0.1:19080` 和后台 `127.0.0.1:19081` 两条 HTTPS 映射
19. **未修改的原有映射说明**：节点小宝进程、私密配置和全部旧映射未修改、未删除、未重启；已有根域名和 `www` 未改动
20. **仍需用户提供的唯一凭据**：不能诚实归并为一个凭据；强制闭环仍需节点小宝/域名管理授权，以及一个仅限本仓库 Contents Read/Write 的细粒度 GitHub Token。微信公众号凭据为可选项
21. **管理员账号名称**：`admin@easybreak.top`
22. **管理员密码保存位置**：NAS `.../104-h5-blog/secrets/.env` 中的受限变量；聊天、文档和 GitHub 不记录明文
23. **已完成验收项目**：架构、建模、H5、Editor、局域网发布链路、CI、GHCR、自动部署/回滚、内容导出、备份、恢复、持久化、安全门禁和移动尺寸均已完成
24. **未完成项目及真实原因**：公网 HTTPS/外网微信测试因节点小宝和公共 DNS 权限阻塞；NAS 内容定时推送因细粒度 Token 缺失阻塞；公众号真实草稿因 AppID/AppSecret 未提供而保持默认关闭

整体结论：`BLOCKED`。核心运行系统为 `PASS`，但未达到任务规定的全部外网与自动内容推送验收门槛。
