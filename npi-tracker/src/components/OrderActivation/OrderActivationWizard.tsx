import { useState } from "react";
import { RackBomStep } from "./steps/RackBomStep";
import { BuildingBlockBomStep } from "./steps/BuildingBlockBomStep";
import { RackSerialsStep } from "./steps/RackSerialsStep";
import { ComponentSerialsStep } from "./steps/ComponentSerialsStep";
import { StartDateStep } from "./steps/StartDateStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";

type Step = "rack-bom" | "building-block-bom" | "rack-serials" | "component-serials" | "start-date" | "done";
const STEP_ORDER: Step[] = ["rack-bom", "building-block-bom", "rack-serials", "component-serials", "start-date", "done"];

export function OrderActivationWizard({
  orderId, onClose, onCompleted,
}: { orderId: number; onClose: () => void; onCompleted: () => void }) {
  const [step, setStep] = useState<Step>("rack-bom");
  const goNext = () => setStep(STEP_ORDER[STEP_ORDER.indexOf(step) + 1]);

  switch (step) {
    case "rack-bom": return <RackBomStep orderId={orderId} onComplete={goNext} onCancel={onClose} />;
    case "building-block-bom": return <BuildingBlockBomStep orderId={orderId} onComplete={goNext} onCancel={onClose} />;
    case "rack-serials": return <RackSerialsStep orderId={orderId} onComplete={goNext} onCancel={onClose} />;
    case "component-serials": return <ComponentSerialsStep orderId={orderId} onComplete={goNext} onCancel={onClose} />;
    case "start-date": return <StartDateStep orderId={orderId} onComplete={goNext} onCancel={onClose} />;
    case "done": return <ConfirmationStep onClose={onCompleted} />;
  }
}