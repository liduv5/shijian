' Shijian Notes - silent auto-start server at Windows logon.
' A shortcut to this file lives in shell:startup. Starts node server.js
' WITHOUT --open (no browser window pops up at login).
' 2026-11-23 created: after reboot the taskbar app showed
' "localhost refused connection" until the user clicked manually.
' NOTE: this file is pure ASCII on purpose. WSH reads non-BOM files as
' ANSI, so UTF-8 Chinese comments here would trigger error 800A0409.

Option Explicit
On Error Resume Next

Dim WshShell, FSO, baseDir, nodePath, scriptPath, runLine, logPath, f

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Resolve the project folder two ways:
'   1. the folder this script sits in (project copy);
'   2. if server.js is not next to the script, this is the Startup-folder
'      copy - fall back to the known install path (Chr codes spell it in
'      Unicode so this file can stay pure ASCII).
baseDir = FSO.GetParentFolderName(WScript.ScriptFullName)
If Not FSO.FileExists(FSO.BuildPath(baseDir, "server.js")) Then
    baseDir = "D:\Program Files\shijian\" & Chr(25342) & Chr(31546)
End If
logPath = FSO.BuildPath(baseDir, "autostart-failed.log")

If FSO.FileExists(logPath) Then FSO.DeleteFile logPath, True

WshShell.CurrentDirectory = baseDir

nodePath = FindNode()
If nodePath = "" Then
    Call writeLog("Node.js not found.")
    WScript.Quit 1
End If

scriptPath = FSO.BuildPath(baseDir, "server.js")
If Not FSO.FileExists(scriptPath) Then
    Call writeLog("server.js not found: " & scriptPath)
    WScript.Quit 1
End If

' No --open: at logon we only bring the service up, no browser window.
' If the service is already running, server.js exits quietly
' (ALREADY_RUNNING) - safe to run twice.
runLine = """" & nodePath & """ """ & scriptPath & """"
Err.Clear
WshShell.Run runLine, 0, False

If Err.Number <> 0 Then
    Call writeLog("WshShell.Run failed: " & Err.Description & " | cmd=" & runLine)
    WScript.Quit 1
End If

WScript.Quit 0

Function FindNode()
    Dim p, d, parts, i, latest, candidate

    p = FSO.BuildPath(baseDir, "runtime\win\node.exe")
    If FSO.FileExists(p) Then
        FindNode = p
        Exit Function
    End If

    parts = Split(WshShell.ExpandEnvironmentStrings("%PATH%"), ";")
    For i = 0 To UBound(parts)
        If Trim(parts(i)) <> "" Then
            p = FSO.BuildPath(Trim(parts(i)), "node.exe")
            If FSO.FileExists(p) Then
                FindNode = p
                Exit Function
            End If
        End If
    Next

    candidate = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\nodejs\node.exe")
    If FSO.FileExists(candidate) Then
        FindNode = candidate
        Exit Function
    End If
    candidate = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Programs\nodejs\node.exe")
    If FSO.FileExists(candidate) Then
        FindNode = candidate
        Exit Function
    End If

    p = WshShell.ExpandEnvironmentStrings("%USERPROFILE%\.workbuddy\binaries\node\versions")
    If FSO.FolderExists(p) Then
        latest = ""
        For Each d In FSO.GetFolder(p).SubFolders
            If FSO.FileExists(FSO.BuildPath(d.Path, "node.exe")) Then
                If d.Name > latest Then latest = d.Name
            End If
        Next
        If latest <> "" Then
            FindNode = FSO.BuildPath(FSO.BuildPath(p, latest), "node.exe")
            Exit Function
        End If
    End If

    FindNode = ""
End Function

Sub writeLog(msg)
    On Error Resume Next
    Set f = FSO.OpenTextFile(logPath, 8, True)
    If Err.Number = 0 Then
        f.WriteLine Now & "  " & msg
        f.Close
    End If
    Err.Clear
End Sub
