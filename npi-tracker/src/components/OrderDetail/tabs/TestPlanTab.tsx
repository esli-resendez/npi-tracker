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
import { getOrderTestPlan, type OrderTestPlanOverview, type TestPlanCase } from "../../../api/ordersApi";

const UNASSIGNED_PROCESS = "Unassigned";

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
  // First grouping: test_level
  levelHeaderRow: { fontWeight: 700, backgroundColor: "#deecf9" },
  levelSummaryRow: { fontWeight: 700, backgroundColor: "#f3f2f1" },
  // Second grouping: process (dbo.processes, via test_cases.process_id)
  processHeaderRow: { fontWeight: 600, backgroundColor: "#f8f8f8" },
  processHeaderCell: { paddingLeft: "24px" },
  processSummaryRow: { fontStyle: "italic", color: "#444444" },
  processSummaryCell: { paddingLeft: "24px" },
});

// Returns the unique process names across `cases`, in first-appearance
// order, falling back to UNASSIGNED_PROCESS for missing process names.
function distinctProcessesInOrder(cases: TestPlanCase[]): string[] {
  const seen: string[] = [];
  for (const c of cases) {
    const process = c.process_name || UNASSIGNED_PROCESS;
    if (!seen.includes(process)) seen.push(process);
  }
  return seen;
}

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

  const { test_plan, test_cases, duration_by_level, duration_by_level_process } = data;

  // Levels in first-appearance order (typically L10 then L11).
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
            <TableHeaderCell>Process</TableHeaderCell>
            <TableHeaderCell>Duration (min)</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {levels.map((level) => {
            const casesForLevel = test_cases.filter((c) => (c.test_level || "UNSPECIFIED") === level);
            const processes = distinctProcessesInOrder(casesForLevel);

            return (
              <Fragment key={level}>
                <TableRow className={styles.levelHeaderRow}>
                  <TableCell colSpan={4}>Level: {level}</TableCell>
                </TableRow>

                {processes.map((process) => {
                  const casesForProcess = casesForLevel.filter(
                    (c) => (c.process_name || UNASSIGNED_PROCESS) === process
                  );
                  const processDuration = duration_by_level_process[level]?.[process] ?? 0;

                  return (
                    <Fragment key={`${level}-${process}`}>
                      <TableRow className={styles.processHeaderRow}>
                        <TableCell className={styles.processHeaderCell} colSpan={4}>
                          {process}
                        </TableCell>
                      </TableRow>

                      {casesForProcess.map((c) => (
                        <TableRow key={c.test_case_id}>
                          <TableCell>{c.test_name}</TableCell>
                          <TableCell>{c.test_description}</TableCell>
                          <TableCell>{c.process_name ?? UNASSIGNED_PROCESS}</TableCell>
                          <TableCell>{c.duration_minutes ?? "—"}</TableCell>
                        </TableRow>
                      ))}

                      <TableRow className={styles.processSummaryRow}>
                        <TableCell className={styles.processSummaryCell} colSpan={3}>
                          Test Duration ({process})
                        </TableCell>
                        <TableCell>{processDuration} min</TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}

                <TableRow className={styles.levelSummaryRow}>
                  <TableCell colSpan={3}>Test Duration ({level})</TableCell>
                  <TableCell>{duration_by_level[level] ?? 0} min</TableCell>
                </TableRow>
              </Fragment>
            );
          })}
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
