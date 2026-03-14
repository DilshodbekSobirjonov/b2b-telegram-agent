$env:PATH = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Users\Administrator\AppData\Local\Programs\Python\Python314;C:\Users\Administrator\AppData\Local\Programs\Python\Python314\Scripts;" + $env:PATH

$ROOT = "D:\project\b2b-telegram-agent"

Write-Host "Starting Backend (API + Webhook receiver)..." -ForegroundColor Cyan
Start-Process -FilePath "python" -ArgumentList "-m uvicorn api_server:app --host 0.0.0.0 --port 8000" -WorkingDirectory $ROOT -NoNewWindow

Start-Sleep -Seconds 2

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$ROOT\admin-frontend" -NoNewWindow

Write-Host ""
Write-Host "Services started:" -ForegroundColor Green
Write-Host "  API + Webhooks  -> http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs        -> http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend        -> http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Webhook endpoint: POST http://localhost:8000/webhook/{bot_token}" -ForegroundColor DarkGray
Write-Host "For local testing, expose port 8000 via ngrok:" -ForegroundColor DarkGray
Write-Host "  ngrok http 8000" -ForegroundColor DarkGray
Write-Host "Then set WEBHOOK_BASE_URL in .env to the ngrok HTTPS URL." -ForegroundColor DarkGray
