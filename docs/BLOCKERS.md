# 真实阻塞项

## BLOCKED：公网 /sitemap.xml 被节点小宝层拦截

`https://gazidaily.iepose.cn/sitemap.xml` 返回 404（openresty 404 页）。博客本身正常：web 容器直连、Caddy LAN（`127.0.0.1:18432`）均返回 200。根因是节点小宝的 openresty 对该路径有拦截或缓存。其余路径（`/`、`/rss.xml`、`/robots.txt`、`/favicon.svg`、文章页、素材页、API）公网均 200。

解除条件：登录节点小宝刷新该路径缓存或调整转发规则。完成后重新验证 `https://gazidaily.iepose.cn/sitemap.xml` 返回 200。

## BLOCKED：NAS 内容定时推送

缺少仅限 `leesiyou/lee`、`Contents: Read and write` 的细粒度 GitHub Token。导出器、同步脚本、缺失凭据保护、`content-backup` 分支和真实文章均已验证；为避免把本机宽权限登录复制到 NAS，没有安装会失败的 cron。

解除条件：将细粒度 Token 保存到 `secrets/github-content-token`，权限设为 `600`，运行 `ops/nas/install-content-cron.sh`。

## 非阻塞可选项：微信公众号

微信公众号凭据未提供，`WECHAT_DRAFT_ENABLED=false`。后台会明确显示“尚未配置公众号接口”，不会假成功；博客发布链路不依赖该功能。

## 对验收结论的影响

核心系统、LAN 内容流程、GitHub CI/GHCR、公网 HTTPS、NAS 自动部署与回滚、备份/恢复和容器持久化均已通过。剩余限制仅为：节点小宝层 `/sitemap.xml` 404 拦截（博客本身 200）、NAS 内容定时推送缺 Token、公众号草稿凭据未配置。整体状态 `PASS_WITH_LIMITATIONS`，Draft PR 不转 Ready、不合并。
