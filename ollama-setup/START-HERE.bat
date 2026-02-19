@echo off
echo ========================================
echo   Ollama + Cursor Quick Start
echo ========================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ollama is NOT installed.
    echo.
    echo Please install Ollama first:
    echo   1. Go to: https://ollama.ai/download
    echo   2. Download and run the Windows installer
    echo   3. Restart your computer
    echo   4. Run this script again
    echo.
    echo Opening Ollama download page...
    start https://ollama.ai/download
    pause
    exit /b 1
)

echo [OK] Ollama is installed
echo.

REM Check if Ngrok is installed
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ngrok is NOT installed.
    echo.
    echo Please install Ngrok:
    echo   1. Go to: https://ngrok.com/download
    echo   2. Download Windows ZIP and extract
    echo   3. Move ngrok.exe to C:\ngrok\ or add to PATH
    echo   4. Sign up at ngrok.com for free
    echo   5. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    echo Opening Ngrok download page...
    start https://ngrok.com/download
    pause
    exit /b 1
)

echo [OK] Ngrok is installed
echo.

REM Pull GLM model if not present
echo Checking for GLM model...
ollama list | findstr /i "glm" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo GLM model not found. Downloading GLM-4 (5.5GB)...
    echo This may take several minutes...
    ollama pull glm4
)

echo [OK] GLM model ready
echo.

REM Start Ollama in a new window
echo Starting Ollama server...
start "Ollama Server" cmd /k "ollama serve"

REM Wait for Ollama to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   STARTING NGROK TUNNEL
echo ========================================
echo.
echo Look for the "Forwarding" line below.
echo Copy the HTTPS URL (e.g., https://xxxx.ngrok-free.app)
echo.
echo Then in Cursor:
echo   1. Settings ^> Models
echo   2. Override OpenAI Base URL = [YOUR_NGROK_URL]/v1
echo   3. API Key = ollama
echo   4. Model = glm4
echo.
echo ========================================
echo.

ngrok http 11434

pause
