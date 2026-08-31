import os
from dotenv import load_dotenv

load_dotenv()

AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "UseDevelopmentStorage=true")
BOM_UPLOAD_CONTAINER: str = os.getenv("BOM_UPLOAD_CONTAINER", "order-activation-uploads")
