/**
 * 拾笺 · 桌面版入口（Electron）
 * 启动本地服务 → 打开独立窗口。数据存放在系统用户目录，卸载/升级不丢。
 */
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const net = require('net');
const fsp = require('fs').promises;

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
      /* 只为一件事开 preload：导出时弹系统「另存为」。
         Electron 没有 showSaveFilePicker，网页里那套选位置的办法用不了，
         不给这条通道的话导出只能静默落到下载目录（用户 2026-11-22 反馈）。 */
      preload: path.join(__dirname, 'preload.js'),
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

/* 导出备份：弹系统保存框，写到用户选的位置。
   defaultPath 指到下载目录 + 建议文件名，用户只改目录就行。 */
ipcMain.handle('sj:save-file', async (event, payload) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const name = String((payload && payload.defaultName) || '拾笺导出.bin');
  const res = await dialog.showSaveDialog(win, {
    title: '选择保存位置',
    defaultPath: path.join(app.getPath('downloads'), name),
    buttonLabel: '保存',
  });
  if (res.canceled || !res.filePath) return 'canceled';
  try {
    await fsp.writeFile(res.filePath, Buffer.from(payload.bytes));
    return 'saved';
  } catch (e) {
    return 'error:' + (e && e.message ? e.message : e);
  }
});

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
