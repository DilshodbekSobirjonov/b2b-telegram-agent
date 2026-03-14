"""
DEPRECATED — polling mode removed.

The bot now runs in webhook mode, fully integrated into api_server.py.
There is no longer a separate bot process.

Start everything with a single command:
    uvicorn api_server:app --host 0.0.0.0 --port 8000

Or use the run_app.ps1 script.
"""
print(
    "\n[main.py] This file is no longer used.\n"
    "Run: uvicorn api_server:app --host 0.0.0.0 --port 8000\n"
)
