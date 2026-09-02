import { useState } from "react";
import { Button, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { startOrder } from "../../../api/ordersApi";

export function StartDateStep({ orderId, onComplete, onCancel }: { orderId: number; onComplete: () => void; onCancel: () => void }) {
  const [date, setDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date) return;
    setSubmitting(true);
    setError(null);
    try {
      await startOrder(orderId, date);
      onComplete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3>Pick a target start date</h3>
      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
      {/* Native date input -- Fluent v9's DatePicker lives in the separate
          @fluentui/react-datepicker-compat package, not yet a dependency here. */}
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Button onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button appearance="primary" onClick={handleSubmit} disabled={!date || submitting}>
          {submitting ? "Submitting..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}