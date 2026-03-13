$env:PATH = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Users\Administrator\AppData\Local\Programs\Python\Python314;C:\Users\Administrator\AppData\Local\Programs\Python\Python314\Scripts;" + $env:PATH

Write-Host "Starting Backend API..."
Start-Process -FilePath "py" -ArgumentList "api_server.py" -WorkingDirectory "c:\Users\Administrator\.gemini\antigravity\scratch\b2b-telegram-agent" -NoNewWindow

Write-Host "Starting Telegram Bot Engine..."
Start-Process -FilePath "py" -ArgumentList "main.py" -WorkingDirectory "c:\Users\Administrator\.gemini\antigravity\scratch\b2b-telegram-agent" -NoNewWindow

Write-Host "Starting Frontend..."
# Run frontend in background
Set-Location "c:\Users\Administrator\.gemini\antigravity\scratch\b2b-telegram-agent\admin-frontend"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "c:\Users\Administrator\.gemini\antigravity\scratch\b2b-telegram-agent\admin-frontend" -NoNewWindow

Write-Host "Servers are starting in background."
