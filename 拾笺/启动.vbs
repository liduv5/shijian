' Shijian Notes - local launcher (hide console window)
' Double-click to start; no black command window; browser opens automatically.
' 2026-11-16 修复：原来 server.js 用相对路径 + 依赖 WshShell.CurrentDirectory，
' 在「D:\Program Files\...」这种带空格的路径下 WshShell.Run 解析可能失败且完全无声
' （窗口隐藏、错误被 On Error Resume Next 吞掉），表现为「双击了但服务没起来、
' 浏览器连不上」。改为所有路径都用绝对路径；失败写同目录「启动失败.log」，
' 并短暂弹窗告知，不再无声。

Option Explicit
On Error Resume Next

Dim WshShell, FSO, baseDir, nodePath, scriptPath, runLine, logPath, f

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

baseDir = FSO.GetParentFolderName(WScript.ScriptFullName)
logPath = FSO.BuildPath(baseDir, "启动失败.log")

' 启动前先清掉旧日志
If FSO.FileExists(logPath) Then FSO.DeleteFile logPath, True

WshShell.CurrentDirectory = baseDir

nodePath = FSO.BuildPath(baseDir, "runtime\win\node.exe")
If Not FSO.FileExists(nodePath) Then nodePath = "node"

scriptPath = FSO.BuildPath(baseDir, "server.js")
If Not FSO.FileExists(scriptPath) Then
    Call writeLog("找不到 server.js：" & scriptPath)
    MsgBox "启动失败：找不到 server.js" & vbCrLf & scriptPath, vbExclamation, "拾笺"
    WScript.Quit 1
End If

' 全部用绝对路径并加引号，避免空格路径被截断
runLine = """" & nodePath & """ """ & scriptPath & """ --open"
WshShell.Run runLine, 0, False

If Err.Number <> 0 Then
    Call writeLog("WshShell.Run 失败：" & Err.Description & " | 命令行：" & runLine)
    MsgBox "启动失败：" & Err.Description & vbCrLf & vbCrLf & runLine, vbExclamation, "拾笺"
    WScript.Quit 1
End If

WScript.Quit 0

Sub writeLog(msg)
    On Error Resume Next
    Set f = FSO.OpenTextFile(logPath, 8, True)
    If Err.Number = 0 Then
        f.WriteLine Now & "  " & msg
        f.Close
    End If
    Err.Clear
End Sub
