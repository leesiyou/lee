# 安全说明

## 已实施控制

- PostgreSQL、Redis、Directus 和 web 不直接映射公网；宿主机只暴露 Caddy 的 `19080/19081`。
- 固定基础镜像版本、容器健康检查、资源限制、日志轮转和独立网络已配置。
- `.env` 位于 NAS `secrets/.env`，目录 `700`、文件 `600`，已被 Git 忽略；前端 bundle、GHCR 和 workflow 不包含管理员 Token。
- Directus SECRET、数据库/Redis/管理员/预览/自动化秘密使用随机值。
- CORS 精确到正式域名和两个 LAN 验收入口；上传仅允许常见图片 MIME，限制为 20 MB，请求限制为 25 MB。
- Caddy 设置 CSP、`nosniff`、Referrer Policy、Permissions Policy 和 `X-Frame-Options: DENY`。
- 富文本和结构化内容块在 SSR 输出前经过白名单清理，脚本标签回归测试通过。
- 匿名策略只读已发布内容；草稿、未来排期和系统集合不公开。Editor 无系统管理权限。
- 预览响应设置 `no-store` 和 `noindex`，错误预览密钥返回 404。
- 公众号接口具备独立共享秘密、默认关闭、不自动群发。
- 自动部署不安装公开 PR 可触发的 self-hosted runner，只由 NAS 主动拉取公开 GHCR。

## 秘密位置

| 秘密 | 位置 |
| --- | --- |
| 应用、数据库、管理员、预览、微信环境变量 | NAS `.../104-h5-blog/secrets/.env` |
| 内容备份细粒度 Token（待提供） | NAS `.../104-h5-blog/secrets/github-content-token` |
| 可选私有 GHCR 只读 Token | NAS `.../104-h5-blog/secrets/github-packages-token` |

只记录位置，不在文档、聊天和日志中记录值。`.env` 被常规备份明确排除，必须另存在用户控制的加密密码管理器中。

## 已处置事件

部署验收中发现一次 Directus schema snapshot 曾写入实际预览秘密。已立即把 snapshot 改为环境变量占位符、旋转 NAS 预览秘密、重建依赖服务并执行错误/正确预览门禁回归；历史值现已失效。未通过 force push 重写公共 Git 历史。

## 尚未完成的边界

- 公网 HTTPS 尚未建立，因此外网 TLS、HTTP 跳转、真实代理头和公网攻击面尚未实测。
- 公众号 AppID/AppSecret 未配置；功能保持关闭，不影响博客。
- 内容同步 Token 未提供；代码和 `content-backup` 分支已验证，但 NAS 定时推送未安装。
