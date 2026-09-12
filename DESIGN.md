---
version: alpha
name: 工具盒-design-analysis
description: "一个纯静态、无账号、无上传的中文在线工具站(gongjuhe.top,20 个工具)。系统是苹果式的克制:近黑文字 + 大面积白/浅灰 + 单一交互蓝,颜色只以分区强调色与 hero 洗色出现;尺寸阶梯、行高、字距、圆角、阴影全部令牌化,base.css 是唯一真源。动效只做有物理感的进入/悬停/按压,且必须能在关掉 JS 与 prefers-reduced-motion 时降级为静态。"

colors:
  text: "#1d1d1f"
  muted: "#6e6e73"
  band: "#f5f5f7"
  hairline: "rgba(0, 0, 0, 0.08)"
  accent: "#0071e3"
  accent-hover: "#0076df"
  accent-active: "#006edb"
  accent-text: "#0066cc"
  surface-2: "#fafafc"
  line-strong: "#d2d2d7"
  ok: "#008009"
  warn: "#bf4800"
  err: "#e30000"
  a-image: "#0071E3"
  a-image-ink: "#0060C1"
  a-pdf: "#F2416B"
  a-pdf-ink: "#B53050"
  a-util: "#8AA169"
  a-util-ink: "#5E6D47"
  a-id: "#6467E6"
  a-id-ink: "#5457C2"
  a-tarot: "#B6975A"
  a-tarot-ink: "#7A653C"
  a-image-tint: "rgba(0,113,227,.06)"
  a-pdf-tint: "rgba(242,65,107,.06)"
  a-util-tint: "rgba(138,161,105,.06)"
  a-id-tint: "rgba(100,103,230,.06)"
  a-tarot-tint: "rgba(182,151,90,.06)"

typography:
  hero: "clamp(40px, 5.4vw, 72px) / 1.06 / 600"
  h1: "40px / 1.15 / 600"
  h1-mobile: "32px"
  h2: "28px / 1.19 / 600"
  h3: "21px / 1.19 / 600"
  body: "17px / 1.47"
  small: "14px / 1.43"
  caption: "12px / 1.333"
  fontFamily: "Geist, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
  mono: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

radius:
  r-1: 6px
  r-2: 8px
  r-3: 10px
  r-4: 12px
  r-md: 18px
  r-pill: 999px

spacing: [8px, 12px, 16px, 24px, 32px, 48px, 72px, 96px]

elevation:
  sh-1: "0 1px 1px rgba(0,0,0,.02), 0 2px 4px rgba(0,0,0,.04)"
  sh-2: "0 1px 1px rgba(0,0,0,.02), 0 4px 8px -4px rgba(0,0,0,.06)"
  sh-3: "0 2px 4px rgba(0,0,0,.03), 0 10px 20px -10px rgba(0,0,0,.08)"
  sh-4: "0 2px 6px rgba(0,0,0,.04), 0 20px 36px -18px rgba(0,0,0,.14)"
  sh-5: "0 1px 1px rgba(0,0,0,.03), 0 28px 56px -22px rgba(0,0,0,.20)"
  sh-shot: "0 2px 4px rgba(0,0,0,.03), 0 40px 80px -40px rgba(0,0,0,.26)"

motion:
  ease-primary: "cubic-bezier(.22,1,.36,1)"
  ease-alternate: "cubic-bezier(.25,.46,.45,.94)"
  ease-out: "cubic-bezier(.22,1,.36,1)"
  ease-in-out: "cubic-bezier(.4,0,.2,1)"
  ease-nav: "cubic-bezier(.4,0,.6,1)"
  ease-overlay: "cubic-bezier(.175,.885,.32,1.1)"
  duration-micro: 80ms
  duration-quick: 150ms
  duration-interact: 160ms
  duration-fast: 250ms
  duration-reveal-opacity: 450ms
  duration-reveal-transform: 700ms
  duration-hero: 600ms
  duration-nav: 240ms
  duration-hover: 200ms
  press-scale-button: 0.97
  press-scale-card: 0.96
  stagger-card: 40ms
  stagger-card-cap: 240ms
  stagger-block: 150ms
  stagger-block-cap: 6
  reveal-distance: 30px
  reveal-threshold: 0.1
  parallax-factor: 0.05
  wash-duration: 18s

breakpoints: [735px, 1069px, 1441px]

layout:
  home-max: 1080px
  tool-max: 860px
  nav-height: 44px
  touch-target: 44px
---

# 工具盒 · DESIGN.md

> 这份文件是给 AI 与人的同一份设计契约:任何 agent 读它就能产出与现有页面一致的 UI。
> 格式沿用 Google Stitch 的 DESIGN.md 约定(该约定由 github.com/VoltAgent/awesome-design-md 收录使用)。
> 它不是愿望清单:front matter 里的每个值都必须等于仓库里真实的 CSS 令牌,
> 构建脚本 check-consistency.mjs 会逐条核对,不一致就拒绝发布。

## Overview

- 产品:纯静态在线工具站,20 个工具(图片 4 / PDF 5 / 文本小工具 10 / 塔罗 1)。全部在浏览器本地完成,文件不上传。
- 气质:苹果式的安静的自信——大字号、留白足、层次靠字号与间距而不是靠颜色和线条;颜色是点缀,不是主角。
- 三条不可动摇的约束:
  1. 不上传:任何界面文案都不得暗示需要上传或联网处理;
  2. 可自证:涉及隐私、体积、达标的说法必须是页面当场能测出来的事实;
  3. 降级可用:关掉 JS 内容全在;prefers-reduced-motion 下不动;断网时工具页要能打开(文本类工具要能用)。

## Colors

| 角色 | 值 | 用在哪 | 不用在哪 |
| --- | --- | --- | --- |
| text | #1d1d1f | 标题、正文、卡片名 | — |
| muted | #6e6e73 | 副标题、说明、元信息 | 不要用于正文主体 |
| band | #f5f5f7 | 目录区底色、图标底、结果面板 | 不要用于大面积正文区 |
| hairline | rgba(0,0,0,.08) | 1px 分隔线、卡片描边 | 不要加粗到 2px |
| accent | #0071e3 | 实心按钮底(白字 4.70)、焦点环、选中描边 | 不要用于正文文字(正文链接用 accent-text) |
| accent-text | #0066cc | 浅底上的文字链接(5.57) | 不要用于实心按钮底(白字会掉到 4.0) |
| ok / warn / err | #008009 / #bf4800 / #e30000 | 达标、注意、失败(5.13 / 5.07 / 4.92) | 不得被品牌色或分区色覆盖 |
| a-* (anchor) | 见 front matter | 只用于图标/色点/描边的**本色**(需 ≥3:1) | 不要直接当浅底上的文字 |
| a-*-ink | 见 front matter | 浅底上的图标色与文字色(全部 ≥4.84,最低那档出现在 16% tint 上) | 不要用于大面积填充 |

颜色纪律(来自真实评审教训 + 苹果生产 CSS 实测):
- 白底上的成功绿 #1d9e4e 只有 3.47:1,不够 AA,已换成 #008009(5.13);灰字 #86868b 3.62:1 也不够,统一为 #6e6e73(5.07:1)。
- **5 个分区色与语义色全部取自 apple.com 生产 CSS 的实测值**(抓了 10 个页面 + 49 个 CSS,共 157 条 gradient 规则;原始件与实算对比度见 工具盒-内部/内部文档/配色方案-苹果实测.md)。
- 苹果自己的彩色渐变**全站只有 2 处,且都不在按钮或卡片上**(AI 标题文字、导航 pill 光晕,后者 opacity .5 + blur 4px)——所以"高级"不等于"多处用彩色"。
- tint 只用 6 / 10 / 16 三档:6% 是默认图标底,10% 是悬停,16% 是选中;任何浅底上的文字/图标改用 -ink 变体。
- 分区强调色最多 5 个,不新增第六个;已知限制:图片(#0071E3,212°)与证件照(#6467E6,237°)色相只差 25°,尚未做 ΔE2000 量化,小图标上可能偏近——这一点是公开记录,不是没发现。

## Typography

字号阶梯(相邻步长 >= 1.15):40 / 28 / 21 / 17 / 14 / 12;首页 hero 用 clamp(40px, 5.4vw, 72px)。
每一档都显式写行高与字距,不写 normal;中文页面的字距一律 0(拉丁文的负字距会把汉字侧边削掉)。
字体:Geist(自托管,仅子集)+ 系统中文字体回退;等宽用 Geist Mono。

## Layout & Spacing

- 4px 基准的间距阶梯:8 / 12 / 16 / 24 / 32 / 48 / 72 / 96。
- 首页内容轴 1080px;工具页内容轴 860px;两者都以左对齐为默认。
- 区块纵向节奏:桌面 hero 88px 起、区块 88-96px;<=1069px 收到 72px;<=735px 收到 40-56px。
- 触控目标 >= 44x44(例外:正文里的行内链接)。

## Elevation & Depth

| 层 | 令牌 | 用途 |
| --- | --- | --- |
| L1 | --sh-1 | 平面卡片、结果行、输入框默认 |
| L2 | --sh-2 | 轻微抬起:结果卡悬停、聚焦 |
| L3 | --sh-3 | 卡片悬停、分段控件 |
| L4 | --sh-4 | 浮层卡片、页脚跳转卡悬停 |
| L5 | --sh-5 | 提示气泡、对话框 |
| — | --sh-shot | 产品截图:全站唯一允许的大范围柔和投影 |

规则:层次由多个小偏移叠加构成,禁止单层大模糊投影;卡片边缘靠 1px 发丝线保持利落。
首页三件事的图片投影带同色柔光(该行强调色 30% 透明度),这是唯一允许的彩色阴影。

## Motion

| 场景 | 参数 | 出处 |
| --- | --- | --- |
| 滚入显现 | 位移 30px;透明度 450ms ease-out;位移 700ms `--ease-primary`;观察器 `{rootMargin:'0px', threshold:.1}` + 一次性标记 + 可见性守卫 | 位移/时长取自 Apple `--staggered-translate-y:30px`、`opacity .45s`;观察器配置逐字取自 Vercel 线上原码;守卫用 `checkVisibility({opacityProperty:true})` |
| 卡片错峰 | 每列 40ms、封顶 240ms | transitions.dev 的 `--duration-stagger:40ms` + 我们的封顶(20 张卡不能等 1 秒) |
| 区块错峰 | 每项 150ms、封顶 6 项(三件事与目录标题) | Apple `--staggered-delay:0.15` |
| hero 进入 | 500-800ms,标题→副标题→搜索→截图每级 60-70ms | 递进量级对齐 Apple 的分组错峰 40-80ms |
| 导航状态切换 | 240ms `--ease-nav`;滚动只变背景与模糊,高度恒定 44px | Apple globalheader.css 主导曲线(78 次);localnav 的 320ms 是子导航,不用在我们这根单条上 |
| 悬停 | 200ms ease 抬起 2px;图标 1.08 倍轻转;图片 1.015 缓推;箭头右移 4px | 对齐 Apple 最常用的 `opacity 100ms linear, transform .2s ease` |
| 按压 | 按钮 0.97、卡片 0.96,80-150ms | 0.97 是四条独立来源的共识(Kowalski / animations.dev / transitions.dev / Linear);Apple 自己用 0.95 |
| 视差 | hero 截图 5%,上限 34px,仅 >=1069px | **与 Apple 不同**:Apple 是滚动进度映射(caption 系数 2.6x + 淡出),我们刻意用更便宜的位移近似 |
| hero 洗色 | 苹果实测的 180deg 浅蓝→#F9F9F9→白 打底,18s 缓慢呼吸,仅 transform/opacity | 渐变值取自 Apple macbook-air;呼吸是我们加的 |
| 搜索过滤 | 原生 view transition 240ms 交叉淡入 | 我们自己的做法 |
| reduced-motion | 动画与初态一律包在 `@media (prefers-reduced-motion: no-preference)` 里(默认态本身就没有动画) | Linear 的反向包裹写法;苹果导航组件自身 0 处兜底,不照抄 |
| JS 失效可见 | `html.js-motion` 门控 + head 内联 2s 兜底计时器 + `<noscript>` 三条保险 | 苹果用 `html.enhanced` 门控(实测 66 处),我们多两层 |

比 Apple 多做的一点:Apple 的导航组件没有 prefers-reduced-motion 兜底(globalheader.css 实测 0 处),我们全站都有。

**刻意不跟的三处**(调研里给了原值,但我们选择更省的实现,原因写在这里):
1. Linear 的显现用 `filter: blur(10px)` 起步 —— 大面积 blur 合成成本高,我们只用位移+透明度(调研自身的规范也只允许 2px 级 blur 用在面板上)。
2. Linear 的显现时长 1s —— 那是叙事级;我们取 700ms,和 Apple 的 0.7s 位移一致。
3. 苹果/Linear 的弹簧物理(阻尼谐振子) —— 我们只有 CSS 曲线,没有弹簧库;工具站不需要回弹,省一个 JS 依赖。

**动效调研原始件**:工具盒-内部/内部文档/动效规范-调研结论.md 及其三份追加(含 Apple / Vercel / Linear / transitions.dev / Motion / Animista 的实测字节与出处 URL)。

硬约束:只动 transform / opacity / filter;reveal 的初态挂在 html.js-motion 上(关 JS 时内容全在);
prefers-reduced-motion: reduce 下不做任何动画;瞬间跳转导致 IntersectionObserver 跳过时,按几何位置兜底补显。

## Components

- 按钮:实心主按钮(accent 底、白字、胶囊形、min-height 44px)、幽灵按钮(accent 字 + 发丝线)、危险态用 --c-err。禁用态透明度 .4,且不得改变尺寸。
- 卡片:白底 + 发丝线 + --sh-1,悬停升到 --sh-3 并上移 2px;图标 44x44、圆角 12、底色取分区 tint。
- 分段控件:浅灰容器(圆角 12)+ 白色选中块(inset 0 0 0 1px 描边 + --sh-1),每项 min-height 44px。
- 文件投放区:虚线发丝线 + 圆角 14,悬停/拖入时描边转 accent 且底色转淡蓝。
- 结果卡:缩略图 48px + 名称/体积 + 状态徽标(达标绿 / 未达标橙 / 失败红 / 未加载灰)。
- 提示气泡:深色 #1d1d1f、12px、圆角 6、--sh-5;库不可用时退化为原生 title。
- 导航:44px、rgba(251,251,253,.82) + saturate(180%) blur(20px);首页滚过 8px 后底色加深到 .94 并加一层柔和投影。塔罗页是唯一的深色例外(深色导航 + 鎏金强调)。

## Do's and Don'ts

Do
- 让字号与间距承担层次;颜色只做三处点缀(分区色点 / 图标底 / 强调线)。
- 每个对外说法都要能当场自证(体积、达标、上传 0 个文件)。
- 每个交互都问一句:关掉 JS、断网、reduced-motion、只用键盘时,它还成立吗?
- 图片一律给 width/height 与 alt;产品图必须是真实截图,不用插画冒充。

Don't
- 不要新增第六个强调色,不要让强调色出现在正文/表格数字上。
- 不要用单层大模糊投影,不要用渐变文字,不要用 emoji 当图标。
- 不要让内容依赖 JS 才可见(禁止先 opacity:0 等 JS 显示而不做兜底)。
- 不要用无限循环或高频闪烁的动效;不要做视差超过 5% 的位移。
- 不要承诺未经验证的能力(曾有 /verify/ 写断网也能用而当时根本打不开)。

## Pre-delivery Checklist(每次发布前逐条过)

- [ ] 对比度:正文 >=4.5:1,大字(>=21px 或 600 字重)>=3:1(含 muted 灰与彩色底)
- [ ] 触控目标 >=44x44;可点元素 cursor: pointer;禁用态 not-allowed
- [ ] 键盘:焦点环可见(2px accent + 2px offset),Tab 顺序合理,按 / 可聚焦搜索
- [ ] prefers-reduced-motion: reduce 下无动画、无位移
- [ ] 关掉 JS:正文、20 张工具卡、页脚全部可见
- [ ] 375 / 768 / 1024 / 1440 四个宽度无横向溢出
- [ ] 无文字截断/挤压(徽标、状态标签、卡片名不裁切)
- [ ] 无 emoji 当图标;所有装饰性 SVG 加 aria-hidden
- [ ] 断网:工具页能打开,文本类工具能用,提示文案不冤枉用户的文件
- [ ] 数字/承诺与实测一致(体积、DPI、页数、上传 0 个文件)

## Verification

1) 令牌与文档一致(本文档 front matter 对 仓库真实 CSS):
   node "D:\项目文件夹\工具盒-内部\构建脚本\check-consistency.mjs" "D:\项目文件夹\tarot-site-git"
2) 界面检查清单自动化(对比度 / 触控 / 焦点 / 裁剪 / 断点 / 无 JS / 减动效):
   node "D:\项目文件夹\工具盒-内部\构建脚本\ui-audit.mjs"
3) 稿源:本文件的结构参考 awesome-design-md 收录的 DESIGN.md 格式;elevation 阶梯与颜色纪律参考其中 vercel / linear.app 两份的设计分析。
