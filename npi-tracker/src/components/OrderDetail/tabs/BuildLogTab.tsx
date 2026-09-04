import { useEffect, useState } from "react";
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
  makeStyles,
} from "@fluentui/react-components";
import { getOrderLog, type OrderLogEntry } from "../../../api/ordersApi";

type SortKey = "event_date" | "event_type";
type SortDir = "asc" | "desc";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "12px" },
  sortableHeader: { cursor: "pointer", userSelect: "none" },
});

export function BuildLogTab({ orderId }: { orderId: number }) {
  const styles = useStyles();
  const [entries, setEntries] = useState<OrderLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("event_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    let cancelled = false;
    getOrderLog(orderId)
      .then((e) => !cancelled && setEntries(e))
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...entries].sort((a, b) => {
    const cmp = a[sortKey].localeCompare(b[sortKey]);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  if (loading) return <Spinner label="Loading build log..." />;

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {/* Placeholder until dbo.log_order (order_id, event_type, event_date,
          log_text) lands -- the table below is already wired to that shape,
          so this just needs a real endpoint response once the table exists. */}
      <MessageBar intent="info">
        <MessageBarBody>
          Build Log isn't connected to a data source yet. Once event logging is added, entries will appear here
          automatically.
        </MessageBarBody>
      </MessageBar>

      <Table aria-label="Build log">
        <TableHeader>
          <TableRow>
            <TableHeaderCell className={styles.sortableHeader} onClick={() => toggleSort("event_date")}>
              Timestamp{sortIndicator("event_date")}
            </TableHeaderCell>
            <TableHeaderCell className={styles.sortableHeader} onClick={() => toggleSort("event_type")}>
              Event type{sortIndicator("event_type")}
            </TableHeaderCell>
            <TableHeaderCell>Log text</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry, i) => (
            <TableRow key={i}>
              <TableCell>{entry.event_date}</TableCell>
              <TableCell>{entry.event_type}</TableCell>
              <TableCell>{entry.log_text}</TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>No log entries yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
