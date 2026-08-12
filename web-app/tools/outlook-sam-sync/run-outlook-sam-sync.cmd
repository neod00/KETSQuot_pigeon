@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-outlook-sam-sync.ps1" %*
