# 个人主页接入说明（方向 B：HERBARIUM）

> 线上仓库 `D:\项目文件夹\tarot-site-git` 的工作区已应用这一版（**未 commit、未 push**）。
> 备份在 `D:\项目文件夹\_alex-backup-20261019-155416`。
> 线上 `gongjuhe.top` 仍是旧工具站，直到你 commit + push。

---

## 这一版是什么

- **方向 B / HERBARIUM（标本册）**：纸感、衬线、胶带、采集记录、一份一份作品像标本。
- 个人为主：首页首屏是名字、主张和三张作品图；工具盒只作为最后一份标本，并在导航/页脚/`/tools/` 出现。
- 页面：`/`、`/about/`、`/work/`、`/contact/`、`/tools/`；29 个工具页和 `/verify/`、`/licenses/` 未动。
- 没有主题切换（上一版的暖编辑/黑白画廊已移除），全站统一 HERBARIUM。

---

## 文件

| 文件 | 作用 |
|------|------|
| `index.html` | 个人主页 |
| `about/index.html` | 关于：现在、时间线、能力、原则、Now |
| `work/index.html` | 作品目录：四份标本 |
| `contact/index.html` | 联系：明信片 + 联系方式 |
| `tools/index.html` | 工具箱聚合页（29 个工具，搜索） |
| `personal.css` | HERBARIUM 设计系统（含工具箱样式） |
| `personal.js` | 移动菜单、滚动出现、年份 |
| `tools-hub.js` | 工具箱搜索 |
| `og-personal.png` | HERBARIUM 风格分享图（占位名字） |
| `_headers` | CSP 已重算；个人资源缓存规则保留 |
| `_redirects` | `/tools/` 不再 301 到首页 |
| `sitemap.xml` | 新增页面；lastmod 2026-10-19 |
| `sw.js` | 缓存版本 `gongjuhe-v32`，预缓存个人页面 |
| `404.html` | 改成 HERBARIUM 语气 |

---

## 预览

```powershell
cd "D:\项目文件夹\tarot-site-git"
python -m http.server 8080
```

- 首页 http://localhost:8080/
- 关于 http://localhost:8080/about/
- 作品 http://localhost:8080/work/
- 联系 http://localhost:8080/contact/
- 工具箱 http://localhost:8080/tools/
- 抽查工具页 http://localhost:8080/json/、/tarot/、/verify/

> 必须用 HTTP 服务器。根路径 `/personal.css` 在 `file://` 下会失效。

---

## 需要替换的占位

名字已替换为 **Alex**；邮箱已填；剩余占位全局搜索 `[替换`、`href="#"`。

- 名字 / 昵称；`YOUR NAME` 字标
- `[城市]`
- `[项目]`、`[合作 / 工作机会]`
- 关于页：经历、时间线、Now
- 社交链接（当前是 `#`）
- 首页/作品页的作品链接（当前指向 `/tarot/` 等站内路径）
- `og-personal.png` 已按 Alex 重新生成；改名字后重跑 `_integration/gen_og_herbarium.py`。

---

## 部署（确认内容后）

1. 替换占位内容。
2. 如果改了任何**内联脚本**，重跑 CSP：
   ```powershell
   node "D:\项目文件夹\工具盒-内部\构建脚本\update-csp-hash.mjs" "D:\项目文件夹\tarot-site-git"
   ```
3. 确认 `sw.js` 为 `gongjuhe-v32`（改了首页/个人资源就再 bump）。
4. 审查 diff：
   ```powershell
   git -C "D:\项目文件夹\tarot-site-git" status --short
   git -C "D:\项目文件夹\tarot-site-git" diff
   ```
5. commit + push；Cloudflare Pages 自动部署。
6. 上线后跑一次移动端 Lighthouse；GSC 看工具页 4 周流量。

## 回滚

- 应用前备份：`D:\项目文件夹\_alex-backup-20261019-155416`
- 未 commit：`git checkout -- index.html about work contact tools 404.html _headers _redirects sitemap.xml sw.js`，再删除新增的 `personal.css` / `personal.js` / `og-personal.png` / 个人页面目录（如果决定不要）。
- 已 push：Cloudflare Pages 回滚或 `git revert`。

---

## 设计说明（为什么是这些）

- **学校**：自然档案 / 编辑设计。不是“性冷淡极简”，也不是“暗黑科技”。
- **签名手法**：胶带贴图、采集编号、手写箭头、衬线标题、钴蓝墨色、万寿菊印章。
- **颜色**：鼠尾草纸底 `#E7EBE1`、纸白 `#F7F6EF`、墨绿 `#1E2A22`、钴蓝 `#2F4B7C`、万寿菊 `#D9A441`。
- **字体**：Georgia / 宋体做标题，系统无衬线做正文；不加载 Web 字体。
- **反 AI 味**：无渐变、无毛玻璃、无静止阴影堆、无小号全大写标签、无装饰性 01/02 编号、无等宽字体标签。
- **工具盒**：不是主题；只在作品列表最后一份标本 + `/tools/` + 页脚出现。

---

## 已知限制

- 已用 Chrome CDP 在 1440 桌面和 390 移动端验收；截图在 `herbarium-shots/`（宿主工作区目录）。
- 三档宽度（375 / 768 / 1440）、对比度、键盘、reduced motion 还需要在有浏览器的环境补跑 `webapp-testing` / `plugin87`。
- 文案和图片仍是占位/真实作品混合；上线前替换。
