' Shijian Notes - local launcher (hide console window)
' Double-click to start; no black command window; browser opens automatically.
Option Explicit
On Error Resume Next

Dim WshShell, FSO, baseDir, nodePath, runLine

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

baseDir = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = baseDir

If FSO.FileExists(FSO.BuildPath(baseDir, "runtime\win\node.exe")) Then
    nodePath = """" & FSO.BuildPath(baseDir, "runtime\win\node.exe") & """"
Else
    nodePath = "node"
End If

runLine = nodePath & " server.js --open"

WshShell.Run runLine, 0, False

If Err.Number <> 0 Then
    MsgBox "Failed to start: " & Err.Description & vbCrLf & _
           "Make sure runtime\win\node.exe exists or Node.js is installed.", _
           vbExclamation, "Shijian"
    WScript.Quit 1
End If

WScript.Quit 0
