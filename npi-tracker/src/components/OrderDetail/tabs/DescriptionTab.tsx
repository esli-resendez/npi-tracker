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
  Text,
  makeStyles,
} from "@fluentui/react-components";
import { getOrderOverview, getOrderRacks, type OrderOverview, type OrderRack } from "../../../api/ordersApi";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "20px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    rowGap: "10px",
    columnGap: "12px",
    maxWidth: "560px",
  },
  label: { color: "#666666", fontWeight: 600 },
  racksSection: { display: "flex", flexDirection: "column", gap: "8px" },
});

export function DescriptionTab({ orderId }: { orderId: number }) {
  const styles = useStyles();
  const [overview, setOverview] = useState<OrderOverview | null>(null);
  const [racks, setRacks] = useState<OrderRack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getOrderOverview(orderId), getOrderRacks(orderId)])
      .then(([o, r]) => {
        if (cancelled) return;
        setOverview(o);
        setRacks(r);
      })
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) return <Spinner label="Loading order details..." />;
  if (error)
    return (
      <MessageBar intent="error">
        <MessageBarBody>{error}</MessageBarBody>
      </MessageBar>
    );
  if (!overview) return null;

  // An order can technically have more than one rack (order_racks), but the
  // description fields the user asked for (Rack SKU, generic description)
  // describe the order's primary rack -- the full list still renders below
  // when there's more than one.
  const primaryRack = racks[0];

  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        <Text className={styles.label}>Order number</Text>
        <Text>{overview.order_number}</Text>

        <Text className={styles.label}>Stage</Text>
        <Text>{overview.stage}</Text>

        <Text className={styles.label}>Status</Text>
        <Text>{overview.ord_status}</Text>

        <Text className={styles.label}>Rack SKU</Text>
        <Text>{primaryRack?.rack_sku ?? "—"}</Text>

        <Text className={styles.label}>Rack generic description</Text>
        <Text>{primaryRack?.rack_gen_name ?? "—"}</Text>

        <Text className={styles.label}>CRD number</Text>
        <Text>{overview.crd_number ?? "—"}</Text>

        <Text className={styles.label}>CRD description</Text>
        <Text>{overview.crd_name ?? "—"}</Text>

        <Text className={styles.label}>CRD ID</Text>
        <Text>{overview.crd_id ?? "—"}</Text>

        <Text className={styles.label}>CRD revision</Text>
        <Text>{overview.crd_revision ?? "—"}</Text>
      </div>

      {racks.length > 1 && (
        <div className={styles.racksSection}>
          <Text weight="semibold">Racks on this order</Text>
          <Table aria-label="Order racks">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Sequence</TableHeaderCell>
                <TableHeaderCell>Rack SKU</TableHeaderCell>
                <TableHeaderCell>Rack generic description</TableHeaderCell>
                <TableHeaderCell>Serial</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {racks.map((r) => (
                <TableRow key={r.rack_id}>
                  <TableCell>{r.rack_sequence}</TableCell>
                  <TableCell>{r.rack_sku}</TableCell>
                  <TableCell>{r.rack_gen_name}</TableCell>
                  <TableCell>{r.rack_serial}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
