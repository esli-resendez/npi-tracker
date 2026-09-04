import { Fragment, useEffect, useState } from "react";
import {
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  makeStyles,
} from "@fluentui/react-components";
import { getOrderTestPlan, type OrderTestPlanOverview } from "../../../api/ordersApi";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "16px" },
  planHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px",
    backgroundColor: "#fafafa",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
  },
  planDescription: { color: "#666666" },
  summaryRow: { fontWeight: 600, backgroundColor: "#f3f2f1" },
});

export function TestPlanTab({ orderId }: { orderId: number }) {
  const styles = useStyles();
  const [data, setData] = useState<OrderTestPlanOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrderTestPlan(orderId)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) return <Spinner label="Loading test plan..." />;
  if (error)
    return (
      <MessageBar intent="error">
        <MessageBarBody>{error}</MessageBarBody>
      </MessageBar>
    );
  if (!data || !data.test_plan) return <Text>No test plan has been assigned to this order yet.</Text>;

  const { test_plan, test_cases, duration_by_level } = data;

  // Group cases by level in the order each level first appears, then append
  // a "Test Duration" summary row after each level's cases (typically L10
  // and L11, but this works for any level values present in the data).
  const levels: string[] = [];
  for (const c of test_cases) {
    const level = c.test_level || "UNSPECIFIED";
    if (!levels.includes(level)) levels.push(level);
  }

  return (
    <div className={styles.root}>
      <div className={styles.planHeader}>
        <Text weight="semibold" size={500}>
          {test_plan.test_plan_name}
        </Text>
        <Text className={styles.planDescription}>
          {test_plan.test_plan_description ?? "No description provided."}
        </Text>
      </div>

      <Table aria-label="Test plan cases">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Test case name</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell>Level</TableHeaderCell>
            <TableHeaderCell>Duration (min)</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {levels.map((level) => (
            <Fragment key={level}>
              {test_cases
                .filter((c) => (c.test_level || "UNSPECIFIED") === level)
                .map((c) => (
                  <TableRow key={c.test_case_id}>
                    <TableCell>{c.test_name}</TableCell>
                    <TableCell>{c.test_description}</TableCell>
                    <TableCell>{c.test_level}</TableCell>
                    <TableCell>{c.duration_minutes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              <TableRow className={styles.summaryRow}>
                <TableCell colSpan={3}>Test Duration ({level})</TableCell>
                <TableCell>{duration_by_level[level] ?? 0} min</TableCell>
              </TableRow>
            </Fragment>
          ))}
          {test_cases.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>This test plan has no test cases yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
