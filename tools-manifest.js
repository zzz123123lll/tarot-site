// tools-manifest.js — 工具盒的单一真相源。加工具 = 在这里加一条。
// status: live(上线可点) / soon(敬请期待) / download(下载卡片)
// icon: 见 index.html 里的 ICONS 表
window.TOOLS = {
  sections: [
    { id: 'divination', name: '占卜' },
    { id: 'file', name: '文件工具' },
    { id: 'utility', name: '小工具' }
  ],
  tools: [
    { slug: 'tarot', name: '塔罗占卜', desc: '78 张韦特牌，一次有依据、不套话的解读。', section: 'divination', icon: 'tarot', url: '/tarot/', status: 'live', dark: true },
    { slug: 'img-compress', name: '图片压缩', desc: '本地压缩图片，不上传、不限数量。', section: 'file', icon: 'compress', url: '/img-compress/', status: 'live' },
    { slug: 'disk-scanner', name: '磁盘扫描', desc: '找出占用硬盘空间的大文件。', section: 'file', icon: 'disk', url: '/disk-scanner/', status: 'soon' },
    { slug: 'json', name: 'JSON 格式化', desc: '美化、校验、压缩 JSON。', section: 'utility', icon: 'code', url: '/tools/json/', status: 'soon' },
    { slug: 'base64', name: 'Base64 编解码', desc: '文本与 Base64 互转。', section: 'utility', icon: 'code', url: '/tools/base64/', status: 'soon' },
    { slug: 'regex', name: '正则测试', desc: '正则表达式实时匹配。', section: 'utility', icon: 'code', url: '/tools/regex/', status: 'soon' },
    { slug: 'color', name: '颜色工具', desc: 'RGB / HEX / HSL 互转。', section: 'utility', icon: 'color', url: '/tools/color/', status: 'soon' },
    { slug: 'uuid', name: 'UUID / 密码', desc: '生成 UUID 和随机密码。', section: 'utility', icon: 'code', url: '/tools/uuid/', status: 'soon' },
    { slug: 'unit', name: '单位换算', desc: '长度、重量、温度、面积。', section: 'utility', icon: 'calc', url: '/tools/unit/', status: 'soon' },
    { slug: 'bmi', name: 'BMI 计算器', desc: '身体质量指数计算。', section: 'utility', icon: 'calc', url: '/tools/bmi/', status: 'soon' },
    { slug: 'date', name: '日期计算', desc: '日期差、加减天数、年龄。', section: 'utility', icon: 'calc', url: '/tools/date/', status: 'soon' },
    { slug: 'qr', name: '二维码生成', desc: '文字/链接生成二维码。', section: 'utility', icon: 'qr', url: '/tools/qr/', status: 'soon' },
    { slug: 'labor-law-ai', name: '劳动法维权 AI', desc: '引导式填表，一键生成仲裁申请书。', section: 'utility', icon: 'law', url: null, status: 'soon' },
    { slug: 'wensu', name: '文序 Wensu', desc: 'AI 原生写作系统（桌面应用）。', section: 'utility', icon: 'pen', url: 'https://github.com/zzz123123lll/wensu/releases', status: 'download' },
    { slug: 'workbench', name: '文成 Workbench', desc: '微信公众号写作台（桌面应用）。', section: 'utility', icon: 'pen', url: 'https://github.com/zzz123123lll/wencheng-workbench', status: 'download' }
  ]
};
