@echo off
REM RiverAuth Real-time Dashboard Startup Script for Windows
REM This script helps you start all components needed for real-time functionality

echo 🔐 RiverAuth Real-time Model Score Dashboard Setup
echo ==================================================

REM Check if we're in the right directory
if not exist "admin-dashboard" (
    echo ❌ Error: admin-dashboard directory not found
    echo    Please run this script from the RiverAuth root directory
    pause
    exit /b 1
)

if not exist "model" (
    echo ❌ Error: model directory not found
    echo    Please run this script from the RiverAuth root directory
    pause
    exit /b 1
)

echo 📁 Current directory: %CD%
echo.

REM Check prerequisites
echo 🔍 Checking prerequisites...

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Please install Python 3.7+
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%a in ('python --version') do echo ✅ Python found: %%a
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%a in ('node --version') do echo ✅ Node.js found: %%a
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found. Please install npm
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%a in ('npm --version') do echo ✅ npm found: %%a
)

echo.

REM Install Python dependencies
echo 📦 Installing Python dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt
    echo ✅ Python dependencies installed
) else (
    echo ⚠️  No requirements.txt found, continuing...
)

REM Install admin dashboard dependencies
echo 📦 Installing admin dashboard dependencies...
cd admin-dashboard
if exist "package.json" (
    call npm install
    echo ✅ Admin dashboard dependencies installed
) else (
    echo ❌ No package.json found in admin-dashboard directory
    pause
    exit /b 1
)
cd ..

echo.

REM Create initial CSV files
echo 📄 Creating initial CSV files...
python -c "import sys; import os; sys.path.append('model'); from model_score_logger import get_logger; logger1 = get_logger('model_scores.csv'); logger2 = get_logger('admin-dashboard/model_scores.csv'); print('✅ CSV files created successfully'); print(f'   - {logger1.csv_file}'); print(f'   - {logger2.csv_file}')"

echo.

REM Show launch instructions
echo 🚀 Ready to start! Use these commands:
echo.
echo 💻 Option 1 - Manual start (recommended):
echo    1. Open a new Command Prompt and run:
echo       cd %CD%\admin-dashboard ^&^& npm run dev
echo.
echo    2. Open another Command Prompt and run:
echo       cd %CD% ^&^& python simulate_realtime_scores.py 10
echo.
echo 💻 Option 2 - Quick test:
echo    cd model ^&^& python model_score_logger.py
echo.

REM Ask if user wants to auto-start
set /p choice="🤔 Would you like to start the admin dashboard now? (y/N): "
if /i "%choice%"=="y" (
    echo 🔄 Starting admin dashboard...
    echo 📡 Admin dashboard will be available at: http://localhost:3000
    echo 🔗 Model scores page: http://localhost:3000/model-scores
    echo.
    echo 💡 To start real-time simulation, open another Command Prompt and run:
    echo    python simulate_realtime_scores.py
    echo.
    cd admin-dashboard
    npm run dev
) else (
    echo 📋 Setup complete! Use the commands above to start the components.
    echo.
    echo 🎯 Quick start commands:
    echo    cd admin-dashboard ^&^& npm run dev
    echo    python simulate_realtime_scores.py
    echo.
    pause
)
