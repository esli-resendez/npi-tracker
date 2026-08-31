import { useState } from "react";
import { Spinner, MessageBar, Button } from "@fluentui/react-components";
import { uploadRackBom } from "../api/ordersApi";

export function RackBomStep({ orderId, onComplete, onCancel }: { orderId: number; onComplete: () => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadRackBom(orderId, file);
      onComplete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3>Upload RACK BOM</h3>
      <p>Expected columns: part number, revision, description, class</p>
      {error && <MessageBar typeof="error">{error}</MessageBar>}
      <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Button appearance="secondary" onClick={onCancel} disabled={uploading}>Cancel</Button>
      <Button appearance="primary" onClick={handleSubmit} disabled={!file || uploading}>Continue</Button>
      {uploading && <Spinner label="Processing BOM..." />}
    </div>
  );
}