@echo off

echo This will take time... Close if you are not sure...
timeout /t 30

echo download_pl...
node src/download_pl.js
if %errorlevel% neq 0 (
    echo download_pl failed with exit code %errorlevel%
    exit /b %errorlevel%
)

timeout /t 10

echo dbInsert...
node src/dbInsert.js
if %errorlevel% neq 0 (
    echo dbInsert failed with exit code %errorlevel%
    exit /b %errorlevel%
)

echo All commands seemd to executed successfully
pause
