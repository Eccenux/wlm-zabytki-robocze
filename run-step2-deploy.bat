@echo off

echo This will take a minute... Close to break...
timeout /t 15

echo dbExportMw...
node src/dbExportMw.js
if %errorlevel% neq 0 (
    echo dbExportMw failed with exit code %errorlevel%
    exit /b %errorlevel%
)

timeout /t 10

echo wikiploy...
node wikiploy.mjs
if %errorlevel% neq 0 (
    echo wikiploy failed with exit code %errorlevel%
    exit /b %errorlevel%
)

echo All commands seemd to executed successfully
pause
