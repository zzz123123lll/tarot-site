# AI神功 发布说明

## 权威来源

- 线上部署仓库：`D:\项目文件夹\tarot-site-git`
- 构建/内容工作区：`C:\Users\HZSM\Documents\deepseek-harness\default-workspace\gongjuhe-site-work`
- 线上域名：https://gongjuhe.top/
- 部署方式：GitHub `main` → Cloudflare Pages（静态站）

> 工作区不是权威 Git 仓库。不要把工作区的旧 HEAD 当作线上版本；发布前必须把构建产物同步到部署仓库，并以部署仓库 commit 为准。

## 构建与测试

```bash
node tests/grading.test.mjs
node tests/all-levels.test.mjs
node build/render-all.mjs
```

构建后检查：

- 36 个关卡页面 + 10 个目录/工具页面；
- sitemap 45 个 URL；
- manifest 描述为 15 册 36 关；
- 搜索页/错题本页 `noindex`；
- 隐私说明页存在；
- 生成的 HTML 与 content 一致。

## 发布

1. 同步 `content/`、`build/`、`tests/`、`ai/notes/`、`shared/`、根 HTML、`sw.js`、`sitemap.xml`、`manifest.webmanifest`、`icons/`、`og-knowledge.png`、`favicon.ico` 到部署仓库。
2. `git -C D:\项目文件夹\tarot-site-git status` 确认变更范围。
3. 提交并推送 `main`。
4. 等待 GitHub Actions `validate` 成功，再刷新线上页面验证。
5. 记录部署 commit；回滚使用 Git revert 到上一个已验证 commit。

## 当前已知遗留

- 24 关客观题与部分评分组仍需逐题做新 PDF 来源映射（内容 QA，不是运行时错误）。
- Cloudflare Pages 后台的分析/日志/回滚配置不在仓库内，需要单独核验。
- PDF 再分发授权未在项目内证明。
