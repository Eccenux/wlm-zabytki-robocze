@echo off

echo This will take time... Close if you are not sure...
timeout /t 30

echo dbExportMw...
node src/dbExportMw.js
if %errorlevel% neq 0 (
    echo dbExportMw failed with exit code %errorlevel%
    exit /b %errorlevel%
)

echo wikiploy...
node wikiploy.mjs
if %errorlevel% neq 0 (
    echo wikiploy failed with exit code %errorlevel%
    exit /b %errorlevel%
)

echo All commands seemd to executed successfully
pause
