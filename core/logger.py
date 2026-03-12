import os
from loguru import logger

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Configure loguru logger
logger.add("logs/app.log", rotation="10 MB", retention="10 days", level="INFO")
logger.add("logs/ai_calls.log", rotation="10 MB", retention="10 days", level="DEBUG", filter=lambda record: "ai" in record["extra"])
logger.add("logs/errors.log", rotation="10 MB", retention="10 days", level="ERROR")

def get_logger():
    return logger
