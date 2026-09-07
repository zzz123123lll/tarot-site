// tools-manifest.js — 工具盒单一真相源。status: live/soon/download。section: divination/image/pdf/utility/more
window.TOOLS = {
  sections: [
    { id: 'divination', name: '占卜' },
    { id: 'utility', name: '开发工具' },
    { id: 'image', name: '图片工具' },
    { id: 'pdf', name: 'PDF 工具' }
  ],
  tools: [
    { slug: 'tarot', name: '塔罗占卜', desc: '78 张韦特牌，一次有依据、不套话的解读。', section: 'divination', icon: 'tarot', url: '/tarot/', status: 'live', dark: true },
    { slug: 'img-compress', name: '图片压缩', desc: '批量瘦身，三档预设，没压更小就跳过。', section: 'image', icon: 'compress', url: '/img-compress/', status: 'live' },
    { slug: 'image-convert', name: '图片转换', desc: '缩放尺寸 + PNG/JPG/WebP 格式互转。', section: 'image', icon: 'convert', url: '/image-convert/', status: 'live' },
    { slug: 'images-to-pdf', name: '图片合成 PDF', desc: '多张图片合成一个 PDF。', section: 'image', icon: 'pdf', url: '/images-to-pdf/', status: 'live' },
    { slug: 'pdf-merge', name: 'PDF 合并', desc: '多个 PDF 合成一个。', section: 'pdf', icon: 'pdf', url: '/pdf-merge/', status: 'live' },
    { slug: 'pdf-split', name: 'PDF 拆分/旋转', desc: '提取页面、拆分、旋转。', section: 'pdf', icon: 'pdf', url: '/pdf-split/', status: 'live' },
    { slug: 'pdf-render', name: 'PDF 转图片', desc: 'PDF 转 JPG/PNG（可调 DPI）。', section: 'pdf', icon: 'pdf', url: '/pdf-render/', status: 'live' },
    { slug: 'pdf-compress', name: 'PDF 压缩', desc: '扫描件/图片型 PDF 瘦身。', section: 'pdf', icon: 'pdf', url: '/pdf-compress/', status: 'live' },
    { slug: 'json', name: 'JSON 格式化', desc: '美化、校验、压缩 JSON。', section: 'utility', icon: 'code', url: '/tools/json/', status: 'live' },
    { slug: 'base64', name: 'Base64 编解码', desc: '文本与 Base64 互转。', section: 'utility', icon: 'code', url: '/tools/base64/', status: 'live' },
    { slug: 'regex', name: '正则测试', desc: '正则表达式实时匹配。', section: 'utility', icon: 'code', url: '/tools/regex/', status: 'live' },
    { slug: 'color', name: '颜色工具', desc: 'RGB / HEX / HSL 互转。', section: 'utility', icon: 'color', url: '/tools/color/', status: 'live' },
    { slug: 'qr', name: '二维码生成', desc: '文字/链接生成二维码。', section: 'utility', icon: 'qr', url: '/tools/qr/', status: 'live' },
    { slug: 'jwt', name: 'JWT 解码', desc: '解码 JWT、检查过期。', section: 'utility', icon: 'code', url: '/tools/jwt/', status: 'live' },
    { slug: 'hash', name: 'Hash 摘要', desc: 'SHA / MD5，文本与文件。', section: 'utility', icon: 'code', url: '/tools/hash/', status: 'live' },
    { slug: 'url', name: 'URL 编解码', desc: '编解码、query 解析。', section: 'utility', icon: 'code', url: '/tools/url/', status: 'live' },
    { slug: 'uuid', name: 'UUID / 密码', desc: '生成 UUID 和随机密码。', section: 'utility', icon: 'code', url: '/tools/uuid/', status: 'live' },
    { slug: 'date', name: '日期 & 时间戳', desc: '日期差、加减、时间戳互转。', section: 'utility', icon: 'calc', url: '/tools/date/', status: 'live' },
  ]
};