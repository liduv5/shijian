@echo off
chcp 65001 >nul
title 拾笺 · 停止本地服务
echo 正在停止拾笺本地服务...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0停止.ps1"
echo.
echo 按任意键关闭窗口...
pause >nul
