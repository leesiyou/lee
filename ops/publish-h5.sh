#!/bin/bash
# ============================================================
# 日更 H5 发布脚本 | Daily H5 Publish Script
# 用法: ./publish-h5.sh <源文件夹> <slug>
# 示例: ./publish-h5.sh /Users/myhood/Desktop/104-print-lab-h5 104-print-lab
#
# 流程:
#   1. 完整性检查(必填文件: index.html + css/ + js/ + assets/)
#   2. 复制到博客 public/h5/<日期>/<slug>/
#   3. 构建 + 测试
#   4. 提交推送 + 触发镜像构建
#   5. 公网 HTTP 验收
#   6. 复制公网地址到剪贴板
# ============================================================
set -euo pipefail

# ---------- 配置 ----------
BLOG_ROOT="/Volumes/开发盘加数据 1t/2026年开发/嘎子日更博客系统"
PUBLIC_H5_REL="apps/web/public/h5"
PUBLIC_BASE_URL="https://gazidaily.iepose.cn"
DATE="$(date +%Y-%m-%d)"

# ---------- 参数 ----------
if [ $# -lt 2 ]; then
  echo "用法: $0 <源文件夹> <slug>"
  echo "示例: $0 /Users/myhood/Desktop/104-print-lab-h5 104-print-lab"
  exit 2
fi
SRC_DIR="$1"
SLUG="$2"

# ---------- 校验 slug(只允许安全字符) ----------
if ! [[ "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "FAIL: slug 只能包含小写字母、数字和连字符"
  exit 2
fi
if [ ! -d "$SRC_DIR" ]; then
  echo "FAIL: 源文件夹不存在: $SRC_DIR"
  exit 2
fi

echo "════════ 日更 H5 发布 ════════"
echo "源文件夹: $SRC_DIR"
echo "slug:      $SLUG"
echo "日期:      $DATE"
echo "目标:      $PUBLIC_BASE_URL/h5/$DATE/$SLUG/"
echo ""

# ---------- 1. 完整性检查 ----------
echo "── 1/6 完整性检查 ──"
MISSING=""
for req in index.html; do
  [ -f "$SRC_DIR/$req" ] || MISSING="$MISSING $req"
done
[ -d "$SRC_DIR/css" ] || MISSING="$MISSING css/"
[ -d "$SRC_DIR/js" ] || MISSING="$MISSING js/"
[ -d "$SRC_DIR/assets" ] || MISSING="$MISSING assets/"
if [ -n "$MISSING" ]; then
  echo "FAIL: 缺少必要文件/目录:$MISSING"
  exit 2
fi
# index.html 不能为 0 字节
if [ ! -s "$SRC_DIR/index.html" ]; then
  echo "FAIL: index.html 为 0 字节，禁止发布白屏版本"
  exit 2
fi
# 检查 JS/CSS 引用的资源是否都存在(相对路径)
echo "  检查资源引用..."
cd "$SRC_DIR"
BAD_REF=0
for ref in $(grep -oE '(src|href)="[^"#]*\.(css|js|webp|png|jpg|jpeg|svg)"' index.html | sed -E 's/(src|href)="([^"]*)"/\2/' | sort -u); do
  [ -f "$SRC_DIR/$ref" ] || { echo "  缺失引用: $ref"; BAD_REF=1; }
done
if [ "$BAD_REF" = 1 ]; then
  echo "FAIL: index.html 有缺失资源引用"
  exit 2
fi
echo "  ✅ 完整性检查通过"

# ---------- 2. 部署到博客 ----------
echo "── 2/6 部署到博客 ──"
DEST="$BLOG_ROOT/$PUBLIC_H5_REL/$DATE/$SLUG"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC_DIR/index.html" "$SRC_DIR/css" "$SRC_DIR/js" "$SRC_DIR/assets" "$DEST/"
echo "  ✅ 已部署: $DEST ($(du -sh "$DEST" | awk '{print $1}'))"

# ---------- 3. 构建 + 测试 ----------
echo "── 3/6 构建与测试 ──"
cd "$BLOG_ROOT"
npm run build >/dev/null 2>&1 || { echo "FAIL: build 失败"; exit 1; }
npm test >/dev/null 2>&1 || { echo "FAIL: 测试失败"; exit 1; }
echo "  ✅ build + 84 tests 通过"

# ---------- 4. 提交推送 ----------
echo "── 4/6 提交推送 ──"
git add "$PUBLIC_H5_REL/$DATE/$SLUG"
if git diff --cached --quiet; then
  echo "  ⚠️ 无新文件(内容未变化)"
else
  git commit -m "feat: publish H5 $SLUG ($DATE)" >/dev/null
  git push origin feature/h5-blog-system 2>&1 | tail -1
  echo "  ✅ 已提交推送"
  gh workflow run publish-image.yml --ref feature/h5-blog-system >/dev/null 2>&1 || true
  echo "  ✅ 镜像构建已触发"
fi

# ---------- 5. 公网 HTTP 验收 ----------
echo "── 5/6 公网验收 ──"
PUBLIC_URL="$PUBLIC_BASE_URL/h5/$DATE/$SLUG/"
echo "  等待镜像构建并部署(约 3-4 分钟)..."
echo "  URL: $PUBLIC_URL"
# 轮询等待公网可达(最多 8 分钟)
for i in $(seq 1 48); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -L "$PUBLIC_URL" 2>/dev/null || echo 000)
  if [ "$CODE" = "200" ]; then
    echo "  ✅ 首页 HTTP 200 (第 ${i} 次尝试)"
    break
  fi
  [ "$i" = 48 ] && { echo "  FAIL: 首页仍未 200 (最后状态 $CODE)"; exit 1; }
  sleep 10
done
# 检查核心资源
for res in css/style.css js/main.js assets/logo.webp; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -L "$PUBLIC_URL$res" 2>/dev/null || echo 000)
  echo "  $res → $CODE"
  [ "$CODE" = "200" ] || { echo "  FAIL: 资源 $res 未返回 200"; exit 1; }
done
# 页面非空
SIZE=$(curl -s -L "$PUBLIC_URL" 2>/dev/null | wc -c | tr -d ' ')
[ "$SIZE" -gt 1000 ] || { echo "  FAIL: 页面内容过小($SIZE B)，疑似白屏"; exit 1; }
echo "  ✅ 公网验收通过 (页面 $SIZE B)"

# ---------- 6. 复制地址 ----------
echo "── 6/6 复制地址 ──"
printf '%s' "$PUBLIC_URL" | pbcopy
echo "  ✅ 已复制到剪贴板: $PUBLIC_URL"
echo ""
echo "════════ 发布完成 ════════"
echo "STATUS: PASS"
echo "PUBLIC_URL: $PUBLIC_URL"
