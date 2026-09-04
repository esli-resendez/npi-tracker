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
import { TeamAssignmentPanel } from "../TeamAssignment/TeamAssignmentPanel";
import { TestPlanWizard } from "../TestPlan/TestPlanWizard";
import { OrderDetailPanel } from "../OrderDetail/OrderDetailPanel";

export function Builds() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingOrderId, setActivatingOrderId] = useState<number | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);
  const [testPlanOrderId, setTestPlanOrderId] = useState<number | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Build | null>(null);

  const refreshBuilds = () => getBuilds().then(setBuilds);

  useEffect(() => {
    refreshBuilds().finally(() => setLoading(false));
  }, []);

  if (activatingOrderId) {
    return (
      <OrderActivationWizard
        orderId={activatingOrderId}
        onClose={() => setActivatingOrderId(null)}
        onCompleted={() => {
          setActivatingOrderId(null);
          refreshBuilds();
        }}
      />
    );
  }

  if (assigningOrderId) {
    return (
      <TeamAssignmentPanel
        orderId={assigningOrderId}
        onCancel={() => setAssigningOrderId(null)}
        onAssigned={() => {
          setAssigningOrderId(null);
          refreshBuilds();
        }}
      />
    );
  }

  if (testPlanOrderId) {
    return (
      <TestPlanWizard
        orderId={testPlanOrderId}
        onClose={() => setTestPlanOrderId(null)}
        onCompleted={() => {
          setTestPlanOrderId(null);
          refreshBuilds();
        }}
      />
    );
  }

  if (viewingOrder) {
    return (
      <OrderDetailPanel
        orderId={viewingOrder.order_id}
        orderNumber={viewingOrder.order_number}
        onClose={() => setViewingOrder(null)}
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
              {item.ord_status === "UNASIGNED" && (
                <Button appearance="primary" onClick={() => setAssigningOrderId(item.order_id)}>
                  Assign roles
                </Button>
              )}
              {item.ord_status === "TESTPLAN" && (
                <Button appearance="primary" onClick={() => setTestPlanOrderId(item.order_id)}>
                  Define test plan
                </Button>
              )}
              {item.ord_status === "ACTIVE" && (
                <Button appearance="secondary" onClick={() => setViewingOrder(item)}>
                  View details
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
