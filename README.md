# 星辉塔罗（星辉 · 塔罗阅读器）

一个诚实、会展示推理的塔罗阅读器：不预测，只映射；敢说不好听的。
- 78 张真实 Rider–Waite–Smith 卡图（公有领域，1910）
- 确定性解读内核：定位 / 组合 / 联问，反 Barnum
- 牌义溯源：韦特《Pictorial Key》(1910) + 金色黎明《Liber LXXVIII》(1912)（StarTarot 数据，CC BY 4.0）

## 部署（Cloudflare Pages）
纯静态站，无需构建。Cloudflare Pages 连接本仓库时：
- Build command：（留空）
- Build output directory：`/`（根目录）
- Root directory：`/`

每次 `git push` 自动重新发布。
