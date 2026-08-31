import { useState } from "react";
import { Button, MessageBar } from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { startOrder } from "../api/ordersApi";

export function StartDateStep({ orderId, onComplete, onCancel }: { orderId: number; onComplete: () => void; onCancel: () => void }) {
  const [date, setDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!date) return;
    try {
      await startOrder(orderId, date.toISOString().slice(0, 10));
      onComplete();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      <h3>Pick a start date</h3>
      {error && <MessageBar typeof="error">{error}</MessageBar>}
      <DatePicker value={date ?? undefined} onSelectDate={(d) => setDate(d ?? null)} />
      <Button appearance="secondary" onClick={onCancel}>Cancel</Button>
      <Button appearance="primary" onClick={handleSubmit} disabled={!date}>Activate order</Button>
    </div>
  );
}