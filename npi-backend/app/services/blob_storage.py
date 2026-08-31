import uuid
from datetime import datetime
from azure.storage.blob import BlobServiceClient, ContentSettings

from app.core.config import AZURE_STORAGE_CONNECTION_STRING, BOM_UPLOAD_CONTAINER


class BlobStorageService:
    def __init__(self):
        self._client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        self._container = self._client.get_container_client(BOM_UPLOAD_CONTAINER)
        try:
            self._container.create_container()
        except Exception:
            pass  # already exists

    def upload(self, order_id: int, stage: str, filename: str, content: bytes) -> str:
        blob_name = f"orders/{order_id}/{stage}/{datetime.utcnow():%Y%m%dT%H%M%S}_{uuid.uuid4().hex[:8]}_{filename}"
        self._container.get_blob_client(blob_name).upload_blob(
            content,
            overwrite=False,
            content_settings=ContentSettings(
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ),
        )
        return blob_name

    def download(self, blob_name: str) -> bytes:
        return self._container.get_blob_client(blob_name).download_blob().readall()


blob_storage_service = BlobStorageService()
