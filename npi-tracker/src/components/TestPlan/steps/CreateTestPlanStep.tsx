import { useState } from "react";
import {
  Button,
  Field,
  Input,
  Textarea,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  makeStyles,
} from "@fluentui/react-components";
import { createTestPlan, uploadTestPlanCases, assignTestPlan } from "../../../api/ordersApi";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" },
  actions: { display: "flex", gap: "8px", marginTop: "8px" },
});

export function CreateTestPlanStep({
  orderId,
  rackSku,
  onAssigned,
  onCancel,
}: {
  orderId: number;
  rackSku: string;
  onAssigned: () => void;
  onCancel: () => void;
}) {
  const styles = useStyles();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !file) return;
    setSubmitting(true);
    setError(null);
    try {
      const { test_plan_id } = await createTestPlan(name.trim(), description.trim() || null);
      await uploadTestPlanCases(test_plan_id, file);
      await assignTestPlan(test_plan_id, orderId);
      onAssigned();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.root}>
      <Text weight="semibold" size={500}>
        Creating a test plan for {rackSku}
      </Text>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <Field label="Name" required>
        <Input value={name} onChange={(_, d) => setName(d.value)} disabled={submitting} />
      </Field>
      <Field label="Description">
        <Textarea value={description} onChange={(_, d) => setDescription(d.value)} disabled={submitting} />
      </Field>
      <Field label="Test cases file (.xlsx)" required>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={submitting}
        />
      </Field>

      <div className={styles.actions}>
        <Button onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button appearance="primary" onClick={handleSubmit} disabled={!name.trim() || !file || submitting}>
          {submitting ? "Processing..." : "Create and assign"}
        </Button>
      </div>
      {submitting && <Spinner label="Processing test plan..." />}
    </div>
  );
}
