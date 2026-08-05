# Myhood Daily 公网地址迁移设计

## 目标

将博客主公网地址从 `https://gazidaily.iepose.cn` 迁移到 `https://myhooddaily.iepose.cn`，并让“中国街舞职业舞者”H5、公众号素材、复制链接和后续日更发布脚本统一生成新地址。

## 约束与决策

- 节点小宝当前穿透额度为 `2/2`，现有 `easybreakwebapp` 不修改、不删除。
- 复用博客原有映射，保持内网目标 `http://127.0.0.1:18432` 不变，只修改公网子域名。
- 站点显示品牌继续使用“李思友的思想实验室”；`Myhood Daily` 仅作为英文公网地址标识。
- `PUBLIC_BASE_URL` 继续作为站点链接的单一配置源；静态 H5 的 canonical、Open Graph 和复制结果同步为新地址。
- 旧地址受节点小宝名额限制，不承诺长期兼容；迁移后以新地址为唯一发布入口。

## 验收

- 节点小宝显示 `https://myhooddaily.iepose.cn` 指向 `127.0.0.1:18432`。
- 新首页和街舞 H5 返回 HTTP 200，HTTPS 无证书错误。
- H5 canonical、Open Graph、复制结果及公众号素材均使用新地址。
- NAS 五个容器健康，现有 `easybreakwebapp` 映射不变。
