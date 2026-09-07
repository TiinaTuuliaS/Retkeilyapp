@echo off
setlocal
set "NODE_HOME=%~dp0.tools\node-v22.23.2-win-x64"
if not exist "%NODE_HOME%\node.exe" (
  echo Project Node is missing. Run: powershell -File scripts\setup-node.ps1
  exit /b 1
)
set "PATH=%NODE_HOME%;%PATH%"
if /I "%~1"=="versions" (
  node --version
  call npm.cmd --version
  exit /b
)
if /I "%~1"=="frontend" goto run
if /I "%~1"=="backend" goto run
echo Usage: retki frontend dev ^| retki frontend build ^| retki backend start:dev ^| retki versions
exit /b 1
:run
if "%~2"=="" (
  echo Supply an npm script name, for example: retki frontend dev
  exit /b 1
)
pushd "%~dp0%~1"
if errorlevel 1 exit /b 1
call npm.cmd run "%~2"
set "RETKI_EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %RETKI_EXIT_CODE%
