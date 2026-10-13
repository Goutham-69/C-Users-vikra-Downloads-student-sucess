@echo off
title EduPulse AI - Student Success Platform
echo ======================================================================
echo           EduPulse AI - Analytics ^& AI Student Success Platform
echo         KPMG in India - Campus Decision Intelligence Challenge
echo ======================================================================
echo.

REM Detect Python executable reliably
set PY_CMD=
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set PY_CMD="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
) else (
    python --version >nul 2>nul
    if %errorlevel% equ 0 (
        set PY_CMD=python
    ) else (
        py -3 --version >nul 2>nul
        if %errorlevel% equ 0 (
            set PY_CMD=py -3
        ) else (
            echo [ERROR] Python 3.10+ not found on system. Please ensure Python is installed.
            pause
            exit /b 1
        )
    )
)

echo [1/2] Verifying St. Mary's student roster and SQLite enterprise database...
%PY_CMD% build_database.py
echo.

echo [2/2] Starting EduPulse AI FastAPI Server on http://127.0.0.1:8000 ...
echo.
echo ======================================================================
echo  Web Application URL:    http://127.0.0.1:8000
echo  Fees Structure:         http://127.0.0.1:8000 (Click Fees Structure Tab)
echo  Lecture Feedback:       http://127.0.0.1:8000 (Click Lecture Feedback Tab)
echo  Assignments ^& Logins:   http://127.0.0.1:8000 (Click Assignments Tab)
echo  AI Copilot Chat Box:    http://127.0.0.1:8000 (Floating widget bottom-right)
echo  API Documentation:      http://127.0.0.1:8000/docs
echo  FastAPI Security Key:   kpmg-edupulse-enterprise-api-key-2026
echo ======================================================================
echo.

%PY_CMD% app.py
pause
