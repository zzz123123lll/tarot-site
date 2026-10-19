# AI 实战通关 · 内容底层

## 目录

- `schema.json`：单关内容契约。
- `tracks/prompt.json`：系列与关卡目录。
- `levels/prompt-01.json`：一关的完整内容、练习、评分项、参考答案。
- `../shared/grading-engine.mjs`：Node 与浏览器共用的判分引擎。
- `../build/render-level.mjs`：从内容生成页面。
- `../tests/grading.test.mjs`：bad / edge / good / needs_review 回归。

## 命令

```bash
# 1. 校验内容并生成页面
node build/render-level.mjs

# 2. 跑判分回归
node tests/grading.test.mjs
```

## 约束

- 页面 HTML 是构建产物，不直接改页面里的评分逻辑。
- 评分项必须有 label、weight、type、groups。
- 开放题只做可解释的结构/关键词检查，不冒充语义判分。
- 需要语义判断的评分项用 `type: "manual"`，引擎会返回 `needs_review`，不自动给分。

## 当前范围

- 已迁移：`prompt/01`。
- 其余 25 关仍是旧版页面，后续按同一套 Schema 逐关迁移。
