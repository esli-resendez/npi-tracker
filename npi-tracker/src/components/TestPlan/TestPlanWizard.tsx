import { useEffect, useState } from "react";
import { Spinner } from "@fluentui/react-components";
import { PickTestPlanStep } from "./steps/PickTestPlanStep";
import { CreateTestPlanStep } from "./steps/CreateTestPlanStep";
import { TestPlanConfirmationStep } from "./steps/TestPlanConfirmationStep";
import { getOrderRacks } from "../../api/ordersApi";

type Step = "pick" | "create" | "done";

export function TestPlanWizard({
  orderId,
  onClose,
  onCompleted,
}: {
  orderId: number;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [step, setStep] = useState<Step>("pick");
  // An order has exactly one rack SKU, so the first rack's SKU is enough
  // for the "Creating a test plan for {rackSku}" label and for looking up
  // reusable plans. null while loading.
  const [rackSku, setRackSku] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrderRacks(orderId).then((racks) => {
      if (!cancelled) setRackSku(racks[0]?.rack_sku ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (rackSku === null) return <Spinner label="Loading order details..." />;

  // Assigning a plan -- whether picked or newly created -- is what moves the
  // order from TESTPLAN to ACTIVE server-side (see app/routers/test_plan.py),
  // so both paths land straight on the confirmation step.
  switch (step) {
    case "pick":
      return (
        <PickTestPlanStep
          orderId={orderId}
          onAssigned={() => setStep("done")}
          onCreateNew={() => setStep("create")}
          onCancel={onClose}
        />
      );
    case "create":
      return (
        <CreateTestPlanStep
          orderId={orderId}
          rackSku={rackSku}
          onAssigned={() => setStep("done")}
          onCancel={onClose}
        />
      );
    case "done":
      return <TestPlanConfirmationStep onClose={onCompleted} />;
  }
}