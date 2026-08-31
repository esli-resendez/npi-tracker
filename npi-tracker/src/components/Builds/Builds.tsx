import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Spinner,
} from "@fluentui/react-components";
import { getBuilds, type Build } from "../../api/ordersApi";
import { OrderActivationWizard } from "../OrderActivation/OrderActivationWizard";

export function Builds() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingOrderId, setActivatingOrderId] = useState<number | null>(null);

  useEffect(() => {
    getBuilds().then(setBuilds).finally(() => setLoading(false));
  }, []);

  if (activatingOrderId) {
    return (
      <OrderActivationWizard
        orderId={activatingOrderId}
        onClose={() => setActivatingOrderId(null)}
        onCompleted={() => {
          setActivatingOrderId(null);
          getBuilds().then(setBuilds);
        }}
      />
    );
  }

  if (loading) return <Spinner label="Loading builds..." />;

  return (
    <Table aria-label="Builds">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Order #</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Progress</TableHeaderCell>
          <TableHeaderCell></TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {builds.map((item) => (
          <TableRow key={item.order_id}>
            <TableCell>{item.order_number}</TableCell>
            <TableCell>{item.ord_status}</TableCell>
            <TableCell>{item.progress}</TableCell>
            <TableCell>
              {item.ord_status === "DRAFT" && (
                <Button appearance="primary" onClick={() => setActivatingOrderId(item.order_id)}>
                  Complete order
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
