@echo off
chcp 65001 >nul
title 拾笺 · 本地笔记库
cd /d "%~dp0"

echo.
echo   ============================================
echo      拾笺 · 本地笔记库
echo   ============================================
echo.

set "NODE="
if exist "%~dp0runtime\win\node.exe" set "NODE=%~dp0runtime\win\node.exe"
if not defined NODE (
  where node >nul 2>nul
  if not errorlevel 1 set "NODE=node"
)

if not defined NODE (
  echo   没有找到 Node.js，无法启动。
  echo.
  echo   两种解决办法，任选其一：
  echo   1. 到 https://nodejs.org 下载 LTS 版本安装，装完重新双击本文件
  echo   2. 找一份"完整版"压缩包（内含 runtime 文件夹），解压后直接双击即可
  echo.
  echo   按任意键打开下载页面...
  pause >nul
  start "" https://nodejs.org/zh-cn/download
  exit /b 1
)

echo   正在启动，稍等几秒浏览器会自动打开...
echo   使用期间请不要关闭这个黑窗口，关闭窗口即退出程序。
echo.

"%NODE%" server.js --open
set "CODE=%ERRORLEVEL%"

echo.
if not "%CODE%"=="0" (
  echo   程序异常退出（代码 %CODE%），请把上面的报错信息截图反馈。
) else (
  echo   已退出。
)
echo   按任意键关闭窗口...
pause >nul
