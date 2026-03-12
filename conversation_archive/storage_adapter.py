from core.logger import get_logger

logger = get_logger()

class StorageAdapter:
    """Abstract storage logic for saving transcripts (e.g., S3, Google Cloud, Local HTML file)."""
    
    @staticmethod
    def upload_transcript(conversation_id: str, transcript_data: str) -> str:
        """Uploads transcript and returns a public/signed link for managers to view."""
        logger.info(f"Uploading transcript for {conversation_id} to storage")
        
        # Local mock behavior
        file_path = f"logs/transcript_{conversation_id}.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(transcript_data)
            
        return f"file:///{file_path}"
