import { useEffect, useState } from "react";
import {
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  makeStyles,
} from "@fluentui/react-components";
import { getAvailableTestPlans, assignTestPlan, type AvailableTestPlan } from "../../../api/ordersApi";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" },
  actions: { display: "flex", gap: "8px", marginTop: "8px" },
});

export function PickTestPlanStep({
  orderId,
  onAssigned,
  onCreateNew,
  onCancel,
}: {
  orderId: number;
  onAssigned: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
}) {
  const styles = useStyles();
  // null while loading; [] once loaded with no results -- distinguishes
  // "still fetching" from "no plans found for this rack SKU yet".
  const [plans, setPlans] = useState<AvailableTestPlan[] | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAvailableTestPlans(orderId)
      .then((p) => !cancelled && setPlans(p))
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleSelect = async (testPlanId: number) => {
    setAssigningId(testPlanId);
    setError(null);
    try {
      await assignTestPlan(testPlanId, orderId);
      onAssigned();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAssigningId(null);
    }
  };

  if (plans === null) return <Spinner label="Checking for existing test plans..." />;

  return (
    <div className={styles.root}>
      <Text weight="semibold" size={500}>
        Choose a test plan
      </Text>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {plans.length === 0 ? (
        <Text>No existing test plans found for this rack SKU yet -- create a new one below.</Text>
      ) : (
        <Table aria-label="Available test plans">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.test_plan_id}>
                <TableCell>{plan.test_plan_name}</TableCell>
                <TableCell>{plan.test_plan_description ?? "—"}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    appearance="primary"
                    disabled={assigningId !== null}
                    onClick={() => handleSelect(plan.test_plan_id)}
                  >
                    {assigningId === plan.test_plan_id ? "Assigning..." : "Use this plan"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className={styles.actions}>
        <Button appearance="secondary" onClick={onCreateNew} disabled={assigningId !== null}>
          Create new test plan
        </Button>
        <Button onClick={onCancel} disabled={assigningId !== null}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
