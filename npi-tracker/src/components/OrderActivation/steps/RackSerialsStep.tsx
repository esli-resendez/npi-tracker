import { useEffect, useState } from "react";
import { Button, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { getOrderRacks, uploadRackSerials, type OrderRack } from "../../../api/ordersApi";

export function RackSerialsStep({ orderId, onComplete, onCancel }: { orderId: number; onComplete: () => void; onCancel: () => void }) {
  const [racks, setRacks] = useState<OrderRack[]>([]);
  const [files, setFiles] = useState<Record<number, File | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { getOrderRacks(orderId).then(setRacks); }, [orderId]);

  const allFilesSelected = racks.length > 0 && racks.every((r) => files[r.rack_id]);

  const handleSubmit = async () => {
    setUploading(true);
    setError(null);
    try {
      for (const rack of racks) {
        const file = files[rack.rack_id];
        if (file) await uploadRackSerials(orderId, file);
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
      <h3>Upload rack-to-device serial mapping</h3>
      <p>Upload one file per rack ({racks.length} rack{racks.length !== 1 ? "s" : ""} on this order).</p>
      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
      {racks.map((rack) => (
        <div key={rack.rack_id} style={{ marginBottom: 12 }}>
          <label>{rack.rack_sku} — {rack.rack_serial}</label>{" "}
          <input type="file" accept=".xlsx"
            onChange={(e) => setFiles((prev) => ({ ...prev, [rack.rack_id]: e.target.files?.[0] }))} />
        </div>
      ))}
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Button onClick={onCancel} disabled={uploading}>Cancel</Button>
        <Button appearance="primary" onClick={handleSubmit} disabled={!allFilesSelected || uploading}>Continue</Button>
      </div>
      {uploading && <Spinner label="Processing..." />}
    </div>
  );
}
