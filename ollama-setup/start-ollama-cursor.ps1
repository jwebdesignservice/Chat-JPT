# ============================================
# Ollama + Ngrok Startup Script for Cursor
# ============================================
# Run this script to start both Ollama and Ngrok
# Then configure Cursor with the Ngrok URL shown
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ollama + Cursor Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is installed
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaPath) {
    Write-Host "[ERROR] Ollama is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Ollama first:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://ollama.ai/download" -ForegroundColor White
    Write-Host "  2. Download and run the Windows installer" -ForegroundColor White
    Write-Host "  3. Restart PowerShell and run this script again" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Ollama is installed" -ForegroundColor Green

# Check if Ngrok is installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "[ERROR] Ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Download Windows version and unzip" -ForegroundColor White
    Write-Host "  3. Add ngrok.exe location to your PATH" -ForegroundColor White
    Write-Host "  4. Sign up at https://ngrok.com and get your authtoken" -ForegroundColor White
    Write-Host "  5. Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Ngrok is installed" -ForegroundColor Green

# Check for GLM model
Write-Host ""
Write-Host "Checking for GLM model..." -ForegroundColor Cyan
$models = ollama list 2>&1

if ($models -match "glm") {
    Write-Host "[OK] GLM model found" -ForegroundColor Green
} else {
    Write-Host "[WARN] GLM model not found. Downloading now..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes (5.5GB download)..." -ForegroundColor Yellow
    ollama pull glm4
    Write-Host "[OK] GLM model downloaded" -ForegroundColor Green
}

# Show available models
Write-Host ""
Write-Host "Available models:" -ForegroundColor Cyan
ollama list

# Start Ollama server in background
Write-Host ""
Write-Host "Starting Ollama server..." -ForegroundColor Cyan
$ollamaProcess = Start-Process -FilePath "ollama" -ArgumentList "serve" -PassThru -WindowStyle Minimized

# Wait for Ollama to start
Start-Sleep -Seconds 3

# Check if Ollama is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Ollama server is running on http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Waiting for Ollama to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Start Ngrok
Write-Host ""
Write-Host "Starting Ngrok tunnel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  IMPORTANT: Copy the HTTPS URL below" -ForegroundColor Yellow
Write-Host "  and paste it in Cursor settings!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Cursor Settings:" -ForegroundColor Cyan
Write-Host "  1. Open Cursor Settings (Ctrl + ,)" -ForegroundColor White
Write-Host "  2. Go to 'Models' section" -ForegroundColor White
Write-Host "  3. Enable 'Override OpenAI Base URL'" -ForegroundColor White
Write-Host "  4. Set Base URL to: [NGROK_URL]/v1" -ForegroundColor White
Write-Host "  5. Set API Key to: ollama" -ForegroundColor White
Write-Host "  6. Add model name: glm4" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop when done." -ForegroundColor Gray
Write-Host ""

# Run Ngrok (this will block and show the URL)
# --host-header rewrites the Host header to localhost:11434 so Ollama accepts the request
ngrok http 11434 --host-header="localhost:11434"

# Cleanup when script exits
Write-Host ""
Write-Host "Stopping Ollama server..." -ForegroundColor Yellow
if ($ollamaProcess) {
    Stop-Process -Id $ollamaProcess.Id -Force -ErrorAction SilentlyContinue
}
Write-Host "Done!" -ForegroundColor Green
