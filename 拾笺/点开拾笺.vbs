' Shijian Notes - click-to-run launcher.
' One click: silently start the local server (if not already running),
' wait until the port answers, then open the app in the default browser.
' This is the file the taskbar/desktop shortcut points to.
' NOTE: pure ASCII on purpose - WSH reads non-BOM files as ANSI, so
' UTF-8 Chinese comments would trigger error 800A0409.

Option Explicit
On Error Resume Next

Dim WshShell, FSO, baseDir, nodePath, scriptPath, runLine, logPath, f, i, ok

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

baseDir = FSO.GetParentFolderName(WScript.ScriptFullName)
logPath = FSO.BuildPath(baseDir, "launcher-failed.log")

If FSO.FileExists(logPath) Then FSO.DeleteFile logPath, True

WshShell.CurrentDirectory = baseDir

nodePath = FindNode()
If nodePath = "" Then
    Call writeLog("Node.js not found.")
    MsgBox "Can not find Node.js. Install Node 18+ or put node.exe in runtime\win.", vbExclamation, "Shijian"
    WScript.Quit 1
End If

scriptPath = FSO.BuildPath(baseDir, "server.js")
If Not FSO.FileExists(scriptPath) Then
    Call writeLog("server.js not found: " & scriptPath)
    WScript.Quit 1
End If

' No --open here: we open the browser ourselves AFTER the port answers.
' Starting the server hidden; if it is already running the process exits
' quietly by itself (ALREADY_RUNNING).
runLine = """" & nodePath & """ """ & scriptPath & """"
Err.Clear
WshShell.Run runLine, 0, False

' Wait until the server answers (max ~20s), then open the page.
' Polling via a tiny HTTP GET on 127.0.0.1:5173.
ok = False
For i = 1 To 100
    If PortAnswers() Then
        ok = True
        Exit For
    End If
    WScript.Sleep 200
Next

If ok Then
    OpenApp()
Else
    Call writeLog("Server did not answer on 5173 within 20s.")
    MsgBox "The local server did not start in 20 seconds. See launcher-failed.log in the app folder.", vbExclamation, "Shijian"
End If

WScript.Quit 0

' Prefer an Edge app window (looks like a standalone app, no browser
' chrome) over a plain browser tab; fall back to the default browser.
Sub OpenApp()
    Dim edge
    On Error Resume Next
    edge = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
    If Not FSO.FileExists(edge) Then _
        edge = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
    If FSO.FileExists(edge) Then
        Err.Clear
        WshShell.Run """" & edge & """ --app=""http://localhost:5173/""", 1, False
        If Err.Number = 0 Then Exit Sub
        Err.Clear
    End If
    WshShell.Run "cmd /c start """" ""http://localhost:5173/""", 0, False
End Sub

Function PortAnswers()
    Dim http
    On Error Resume Next
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.open "GET", "http://127.0.0.1:5173/", False
    http.send
    If Err.Number = 0 Then
        PortAnswers = True
    Else
        Err.Clear
        PortAnswers = False
    End If
    Set http = Nothing
End Function

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
