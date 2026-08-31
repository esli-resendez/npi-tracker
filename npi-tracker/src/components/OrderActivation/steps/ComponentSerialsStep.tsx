import { useState } from "react";
import { Button, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { uploadComponentSerials } from "../../../api/ordersApi";

export function ComponentSerialsStep({ orderId, onComplete, onCancel }: { orderId: number; onComplete: () => void; onCancel: () => void }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of selectedFiles) {
        await uploadComponentSerials(orderId, file);
      }
      onComplete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3>Upload device-to-component serial mapping</h3>
      <p>One combined file, or several -- select as many as you need.</p>
      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
      <input
        type="file"
        accept=".xlsx"
        multiple
        onChange={(e) => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
      />
      {selectedFiles.length > 0 && (
        <ul>
          {selectedFiles.map((f) => <li key={f.name}>{f.name}</li>)}
        </ul>
      )}
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Button onClick={onCancel} disabled={uploading}>Cancel</Button>
        <Button appearance="primary" onClick={handleSubmit} disabled={selectedFiles.length === 0 || uploading}>Continue</Button>
      </div>
      {uploading && <Spinner label="Processing..." />}
    </div>
  );
}
