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


## 监控与回滚

- CI：GitHub Actions `validate` 是发布前唯一自动门禁；最近一次通过后才能认为推送可用。
- 线上监控：Cloudflare Pages/Cloudflare Analytics 的具体告警、日志保留和 Uptime 监控未在本仓库配置，发布负责人必须在 Cloudflare 后台确认。
- 静态站没有自建健康检查端点；可用 `/`、`/ai/notes/`、`/ai/notes/search/`、`/ai/notes/privacy/` 四个 URL 作为人工 smoke check。
- 回滚：使用 `git revert <bad-commit>` 生成回滚提交并推送；Cloudflare Pages 会从 `main` 重新部署。回滚后重新跑 CI，并验证根路径、搜索、练习数据 JSON、manifest 与 sitemap。
- 备份：内容与页面以 Git 历史为准；浏览器 localStorage 不属于服务端备份。
- 发布后检查：`/sitemap.xml` 45 个 URL、`manifest` 15 册/36 关、搜索/错题本 noindex、隐私页面 200、移动菜单 6 项、PWA 离线根页。

## 已知未完成

- 24 关客观题的 sourceRef/sourceQuote 已补，但题目措辞仍需逐题对照新 PDF 做内容审校；`sourceQuote` 只能证明定位，不能自动证明题目表述完全一致。
- Firefox/Safari/真实移动设备仍需回归。
- Cloudflare 后台日志、告警、真实用户性能数据未取得。
- PDF 再分发授权未在项目内证明。
