@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-outlook-coordination-sync.ps1" %*
exit /b %ERRORLEVEL%
