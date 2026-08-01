# 真实阻塞项

## BLOCKED：公网 HTTPS

`blog.easybreak.top` 和 `blog-admin.easybreak.top` 的公共权威解析尚未建立，节点小宝也没有新增两条映射。原因是节点小宝没有安全可调用的映射 API，界面停留在登录页，且公共 DNS 变更需要域名管理权限。

解除条件：登录节点小宝完成 `127.0.0.1:19080/19081` 两条 HTTPS 映射，并按界面提供的目标设置公共 DNS。完成后需在外网微信和普通浏览器重新验收。

## BLOCKED：NAS 内容定时推送

缺少仅限 `leesiyou/lee`、`Contents: Read and write` 的细粒度 GitHub Token。导出器、同步脚本、缺失凭据保护、`content-backup` 分支和真实文章均已验证；为避免把本机宽权限登录复制到 NAS，没有安装会失败的 cron。

解除条件：将细粒度 Token 保存到 `secrets/github-content-token`，权限设为 `600`，运行 `ops/nas/install-content-cron.sh`。

## 非阻塞可选项：微信公众号

微信公众号凭据未提供，`WECHAT_DRAFT_ENABLED=false`。后台会明确显示“尚未配置公众号接口”，不会假成功；博客发布链路不依赖该功能。

## 对验收结论的影响

核心系统、LAN 内容流程、GitHub CI/GHCR、NAS 自动部署与回滚、备份/恢复和容器持久化均已通过。由于强制验收要求外网 HTTPS、微信外网打开和 NAS 内容定时推送，整体状态必须保持 `BLOCKED`，Draft PR 不转 Ready、不合并。
