export const API_BASE = 'http://192.168.0.113:3300';

export const services = [
  { id: 'vaultwarden', name: 'Vaultwarden', desc: '密码管理器', domain: 'vw.ygxpro.online', url: 'https://vw.ygxpro.online', iframeUrl: 'https://vw.ygxpro.online', icon: 'shield', category: 'core', canIframe: true },
  { id: 'nas', name: 'DSM', desc: 'NAS 管理后台', domain: 'nas.ygxpro.online', url: 'https://nas.ygxpro.online', iframeUrl: 'https://nas.ygxpro.online:5001', icon: 'server', category: 'core', canIframe: false },
  { id: 'bill', name: 'Bill Import', desc: '账单导入 Notion', domain: 'bill.ygxpro.online', url: 'https://bill.ygxpro.online', iframeUrl: 'https://bill.ygxpro.online', icon: 'receipt', category: 'tools', canIframe: true },
  { id: 'aliyunpan', name: 'Aliyun Pan', desc: '阿里云盘', domain: 'pan.ygxpro.online', url: 'https://pan.ygxpro.online', iframeUrl: 'https://pan.ygxpro.online', icon: 'cloud', category: 'storage', canIframe: true },
  { id: 'webdav', name: 'WebDAV', desc: '文件服务', domain: 'webdav.ygxpro.online', url: 'https://webdav.ygxpro.online', iframeUrl: 'https://webdav.ygxpro.online', icon: 'folder', category: 'storage', canIframe: true },
];

export const bookmarks = [
  { name: 'Notion', url: 'https://notion.so', icon: '📝' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎' },
  { name: '豆包', url: 'https://www.doubao.com', icon: '🤖' },
  { name: '元宝', url: 'https://yuanbao.tencent.com', icon: '🪙' },
  { name: 'ToDesk', url: 'https://www.todesk.com', icon: '🖥' },
  { name: 'BoardMix', url: 'https://boardmix.cn', icon: '🎨' },
  { name: 'Electerm', url: 'https://electerm.github.io', icon: '⚡' },
  { name: 'MarkText', url: 'https://marktext.app', icon: '📋' },
];
