@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22.9 or newer, then run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\@meta-sam\parser\package.json" (
  echo Installing FixLens dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
if exist "FixLens-startup.log" del /q "FixLens-startup.log"
start "" /b node server.mjs > "FixLens-startup.log" 2>&1
timeout /t 3 /nobreak >nul
findstr /c:"FixLens ready at" "FixLens-startup.log" >nul
if errorlevel 1 (
  echo FixLens server failed to start. The error is below:
  type "FixLens-startup.log"
  pause
  exit /b 1
)
echo FixLens is running. Keep this window open while using the app.
start "" "http://127.0.0.1:4173/"
pause
endlocal
