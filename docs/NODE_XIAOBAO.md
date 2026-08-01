# 节点小宝公网映射

## 当前状态

- 节点小宝进程和现有映射未修改、未重启、未覆盖。
- 安装目录：`/vol6/@appcenter/owjdxb`
- 数据目录：`/vol6/@appdata/owjdxb`
- 部署前保护性快照：`/vol6/1000/Docker部署盘/90_备份快照/104-h5-blog-predeploy-20260801-133507`
- 管理界面：`http://192.168.5.104:5666/login`
- 未发现可安全调用的公开映射 API，因此不能在无登录确认的情况下修改映射。

## 唯一人工收口步骤

登录节点小宝管理界面，在保留全部现有规则的前提下新增以下两条 HTTPS 映射，并按界面给出的校验目标完成公共 DNS；不要修改根域名、`www` 或任何旧映射。

| 外部域名 | 外部协议 | 本地目标 | 用途 |
| --- | --- | --- | --- |
| `blog.easybreak.top` | HTTPS，HTTP 跳转 HTTPS | `127.0.0.1:19080` | Astro H5 前台 |
| `blog-admin.easybreak.top` | HTTPS，HTTP 跳转 HTTPS | `127.0.0.1:19081` | Directus 后台 |

转发必须保留 `Host`、真实客户端 IP、`X-Forwarded-For` 和 `X-Forwarded-Proto=https`。不要映射 22、5432、6379、Docker API 或飞牛管理后台。

## 验收

完成映射后逐项检查：

```sh
curl -fsS https://blog.easybreak.top/health && curl -fsS https://blog-admin.easybreak.top/server/ping
```

还需在外网手机微信中检查首页、`/posts/startup-vs-speculation`、后台登录、静态图片、API、404 和横向滚动。当前公共 DNS 尚未解析到真实节点小宝入口，所以这些外网项不能标记 PASS。

## 恢复

若新增规则异常，只删除本次新增的两条规则，不触碰旧规则。保护性快照用于审计和人工恢复；其中可能含节点小宝私密配置，目录权限必须保持受限，禁止进入 Git 或博客备份包。
