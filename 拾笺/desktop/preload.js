/**
 * 拾笺 · 预加载脚本
 * 渲染进程与主进程之间只开一道很窄的口子：把一段二进制存到用户选的位置。
 * 导出备份、加密备份要用。contextIsolation 保持开着，不往页面里塞 Node。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('SJDesktop', {
  /* defaultName：建议文件名；bytes：Uint8Array。返回 'saved' | 'canceled' */
  saveFile: (defaultName, bytes) => ipcRenderer.invoke('sj:save-file', { defaultName, bytes }),
});
