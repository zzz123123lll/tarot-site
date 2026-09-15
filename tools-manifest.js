// tools-manifest.js — 工具盒单一真相源。status: live/soon/download。section: image/pdf/text/data/fun
// 分类依据（2026-05 重做，证据见 内部文档/计划-内部打磨阶段.md）：
//   · 15 个同类站点里 14 个按「文件对象」或「任务」分一级，只有 PDF24 把隐私单列 —— 所以本站不做「隐私」分类，
//     把「不上传」留作徽标/自证，避免和对象维度混层（NNG:同一层只能用一个分类维度）。
//   · 生成类要独立成区：TinyWow 单列 write(54)、PDF24 单列 Create、nologin.tools 单列 AI/Media。
//     原来把节奏玩具/文字星图塞进「小工具」，与该区里 12 个编码工具没有共同身份（NNG:每类要有唯一身份）。
window.TOOLS = {
  sections: [
    { id: 'image', name: '图片处理', icon: 'image', desc: '压小、换格式、加水印，或者把照片里带的信息去掉。' },
    { id: 'pdf', name: 'PDF 与发票', icon: 'file-text', desc: '合成、拆分、转换，还有报销要用的发票。' },
    { id: 'text', name: '文字处理', icon: 'code', desc: '处理复制来的文字、代码和表格内容。' },
    { id: 'data', name: '编码与标识', icon: 'binary', desc: '二维码、颜色、Hash、UUID 这类一次算完的小事。' },
    { id: 'fun', name: '生成与好玩', icon: 'play', desc: '打开就能玩，或者一键出图：抽张牌、敲出节奏、把文字变成星星。' }
  ],
  tools: [
    // ---- 图片处理 ----
    { slug: 'img-compress', name: '图片压缩', desc: '批量变小，也可以压到指定大小（如 500KB 以内）。', section: 'image', icon: 'image-down', url: '/img-compress/', status: 'live' },
    { slug: 'image-convert', name: '图片转换', desc: '缩放尺寸 + PNG/JPG/WebP 格式互转。', section: 'image', icon: 'arrow-left-right', url: '/image-convert/', status: 'live' },
    { slug: 'id-photo', name: '证件照', desc: '按官方要求输出精确像素、DPI 与体积上限。', section: 'image', icon: 'user', url: '/id-photo/', status: 'live' },
    { slug: 'watermark', name: '批量加水印', desc: '文字/logo 批量打水印，位置透明度旋转可调，可打包下载。', section: 'image', icon: 'image-down', url: '/watermark/', status: 'live' },
    { slug: 'exif-clean', name: '照片去信息', desc: '删掉照片里的拍摄时间、设备与 GPS 位置；无损，像素一个字节不动。', section: 'image', icon: 'shield', url: '/exif-clean/', status: 'live' },
    { slug: 'receipt-clean', name: '票据清理', desc: '手机拍的发票去灰底、自动裁边、自动摆正，支持扫描件 PDF。', section: 'image', icon: 'scan-clean', url: '/receipt-clean/', status: 'live' },
    // ---- PDF 与发票 ----
    { slug: 'pdf-merge', name: 'PDF 合并', desc: '多个 PDF 合成一个。', section: 'pdf', icon: 'merge', url: '/pdf-merge/', status: 'live' },
    { slug: 'pdf-split', name: 'PDF 拆分/旋转', desc: '提取页面、拆分、旋转。', section: 'pdf', icon: 'scissors', url: '/pdf-split/', status: 'live' },
    { slug: 'pdf-compress', name: 'PDF 压缩', desc: '扫描件/图片型 PDF 瘦身。', section: 'pdf', icon: 'archive', url: '/pdf-compress/', status: 'live' },
    { slug: 'pdf-render', name: 'PDF 转图片', desc: 'PDF 转 JPG/PNG（可调 DPI）。', section: 'pdf', icon: 'file-image', url: '/pdf-render/', status: 'live' },
    { slug: 'images-to-pdf', name: '图片合成 PDF', desc: '多张图片合成一个 PDF。', section: 'pdf', icon: 'images', url: '/images-to-pdf/', status: 'live' },
    { slug: 'invoice-nup', name: '发票拼版', desc: '多张发票按原比例排到 A4，输出一份 PDF。', section: 'pdf', icon: 'receipt', url: '/invoice-nup/', status: 'live' },
    { slug: 'invoice-check', name: '发票查重', desc: '本地读电子发票 PDF 的号码/日期/金额，标出重复提交并导出报销清单。', section: 'pdf', icon: 'receipt-search', url: '/invoice-check/', status: 'live' },
    // ---- 文字处理 ----
    { slug: 'json', name: 'JSON 格式化', desc: '美化、校验、压缩 JSON。', section: 'text', icon: 'braces', url: '/json/', status: 'live' },
    { slug: 'text-clean', name: '文本整理与对比', desc: '清理复制来的多余换行与空格；两份文本逐字符比对。', section: 'text', icon: 'code', url: '/text-clean/', status: 'live' },
    { slug: 'md-wechat', name: '公众号排版', desc: 'Markdown 转公众号排版，内联样式一键复制不变形。', section: 'text', icon: 'code', url: '/md-wechat/', status: 'live' },
    { slug: 'base64', name: 'Base64 编解码', desc: '文本与 Base64 互转。', section: 'text', icon: 'binary', url: '/base64/', status: 'live' },
    { slug: 'url', name: 'URL 编解码', desc: '编解码、query 解析。', section: 'text', icon: 'link', url: '/url/', status: 'live' },
    { slug: 'regex', name: '正则测试', desc: '正则表达式实时匹配。', section: 'text', icon: 'regex', url: '/regex/', status: 'live' },
    // ---- 编码与标识 ----
    { slug: 'qr', name: '二维码生成', desc: '文字/链接生成二维码。', section: 'data', icon: 'qr-code', url: '/qr/', status: 'live' },
    { slug: 'color', name: '颜色工具', desc: 'RGB / HEX / HSL 互转。', section: 'data', icon: 'palette', url: '/color/', status: 'live' },
    { slug: 'date', name: '日期 & 时间戳', desc: '日期差、加减、时间戳互转。', section: 'data', icon: 'calendar', url: '/date/', status: 'live' },
    { slug: 'uuid', name: 'UUID / 密码', desc: '生成 UUID 和随机密码。', section: 'data', icon: 'fingerprint', url: '/uuid/', status: 'live' },
    { slug: 'hash', name: 'Hash 摘要', desc: 'SHA / MD5，文本与文件。', section: 'data', icon: 'hash', url: '/hash/', status: 'live' },
    { slug: 'jwt', name: 'JWT 解码', desc: '解码 JWT、检查过期。', section: 'data', icon: 'key-round', url: '/jwt/', status: 'live' },
    // ---- 生成与好玩 ----
    { slug: 'tarot', name: '塔罗占卜', desc: '78 张韦特牌，一次有依据、不套话的解读。', section: 'fun', icon: 'tarot', url: '/tarot/', status: 'live', dark: true },
    { slug: 'cover-gen', name: '封面图生成', desc: '输入标题，一键出小红书/公众号/视频封面，本机排版。', section: 'fun', icon: 'image-down', url: '/cover-gen/', status: 'live' },
    { slug: 'star-map', name: '文字星图', desc: '把一段文字变成星空，每个字一颗星，可导出分享图。', section: 'fun', icon: 'play', url: '/star-map/', status: 'live' },
    { slug: 'beat-toy', name: '节奏玩具', desc: '点开即玩：敲击发声、画面留痕，可导出分享图。', section: 'fun', icon: 'play', url: '/beat-toy/', status: 'live' }
  ]
};
