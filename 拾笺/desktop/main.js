/**
 * 拾笺 · 桌面版入口（Electron）
 * 启动本地服务 → 打开独立窗口。数据存放在系统用户目录，卸载/升级不丢。
 */
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const net = require('net');

// 数据目录放到用户目录（macOS: ~/Library/Application Support/拾笺/data）
process.env.SHIJIAN_DATA_DIR = process.env.SHIJIAN_DATA_DIR
  || path.join(app.getPath('userData'), 'data');

const PORT = Number(process.env.PORT || 5173);
let mainWindow = null;
let serverHandle = null;

function waitForPort(port, timeout = 10000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started > timeout) reject(new Error('本地服务启动超时'));
        else setTimeout(tick, 120);
      });
    };
    tick();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 900,
    minHeight: 560,
    title: '拾笺',
    backgroundColor: '#f4f3ef',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const realPort = serverHandle.address().port;
  await waitForPort(realPort);
  await mainWindow.loadURL(`http://127.0.0.1:${realPort}`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新载入' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '数据目录',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '数据目录',
              message: '所有笔记与附件保存在：',
              detail: process.env.SHIJIAN_DATA_DIR,
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  try {
    const mod = require('../server.js');
    serverHandle = await mod.start(PORT, '127.0.0.1');
    buildMenu();
    await createWindow();
  } catch (e) {
    dialog.showErrorBox('启动失败', e.message);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverHandle && serverHandle.close) {
    try { serverHandle.close(); } catch (e) { /* ignore */ }
  }
});
