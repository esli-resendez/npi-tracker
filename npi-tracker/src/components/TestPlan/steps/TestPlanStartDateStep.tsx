import { useState } from "react";
import { Button, MessageBar, MessageBarBody, Text } from "@fluentui/react-components";
import { startOrder } from "../../../api/ordersApi";

export function TestPlanStartDateStep({
  orderId,
  onComplete,
  onCancel,
}: {
  orderId: number;
  onComplete: () => void;
  onCancel: () => void;
}) {
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
      <Text weight="semibold" size={500}>
        Test plan assigned -- pick a start date
      </Text>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {/* Native date input, same as OrderActivation/steps/StartDateStep.tsx --
          Fluent v9's DatePicker isn't a dependency here. */}
      <div style={{ marginTop: 12 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Button onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button appearance="primary" onClick={handleSubmit} disabled={!date || submitting}>
          {submitting ? "Activating..." : "Activate order"}
        </Button>
      </div>
    </div>
  );
}
