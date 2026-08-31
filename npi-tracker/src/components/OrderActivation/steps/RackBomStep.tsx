import { useState } from "react";
import { Button, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { uploadRackBom } from "../../../api/ordersApi";

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
      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
      <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Button onClick={onCancel} disabled={uploading}>Cancel</Button>
        <Button appearance="primary" onClick={handleSubmit} disabled={!file || uploading}>Continue</Button>
      </div>
      {uploading && <Spinner label="Processing BOM..." />}
    </div>
  );
}
