import React from "react";
import {
  Input,
  InfoLabel,
  Dropdown,
  Option,
} from "@fluentui/react-components";

import type { BuildData } from "../../models/BuildData";

interface OrderDetailsStepProps {
  buildData: BuildData;
  setBuildData: React.Dispatch<React.SetStateAction<BuildData>>;
}

export default function OrderDetailsStep({
  buildData,
  setBuildData,
}: OrderDetailsStepProps) {
  const updateBuildData = (
    field: keyof BuildData["orderDetails"],
    value: string
  ) => {
    setBuildData((current) => ({
      ...current,
      orderDetails: {
        ...current.orderDetails,
        [field]: value,
      },
    }));
  };

  const updateRackQty = (value: string) => {
    const qty = Number(value) || 0;

    setBuildData((current) => {
      const existing = [...current.racks];

      while (existing.length < qty) {
        existing.push({
          rackSerial: "",
        });
      }

      return {
        ...current,
        orderDetails: {
          ...current.orderDetails,
          rackQty: value,
        },
        racks: existing.slice(0, qty),
      };
    });
  };

  return (
    <div id="ord-details-main" className="order-details-grid">
      <InfoLabel>Build ID Tracking</InfoLabel>
      <Input
        className="ord-details-input"
        value={buildData.orderDetails.buildId}
        onChange={(event) =>
          updateBuildData("buildId", event.target.value)
        }
      />

      <InfoLabel>CRD</InfoLabel>
      <Input
        className="ord-details-input"
        value={buildData.orderDetails.crdNumber}
        onChange={(event) =>
          updateBuildData("crdNumber", event.target.value)
        }
      />

      <InfoLabel>Revision</InfoLabel>
      <Input
        className="ord-details-input"
        value={buildData.orderDetails.crdRevision}
        onChange={(event) =>
          updateBuildData("crdRevision", event.target.value)
        }
      />

      <InfoLabel>Build Stage</InfoLabel>
      <Dropdown
        className="ord-details-dropdown"
        selectedOptions={[
          buildData.orderDetails.buildStage,
        ]}
        onOptionSelect={(_, data) =>
          updateBuildData(
            "buildStage",
            data.optionValue ?? ""
          )
        }
      >
        <Option className="ord-details-listbox" value="EV">EV</Option>
        <Option className="ord-details-listbox" value="PV">PV</Option>
        <Option className="ord-details-listbox" value="MP">MP</Option>
        <Option className="ord-details-listbox" value="CR">CR</Option>
      </Dropdown>

      <InfoLabel>Rack QTY</InfoLabel>
      <Input
        className="ord-details-input"
        value={buildData.orderDetails.rackQty}
        onChange={(event) => updateRackQty(event.target.value)}
      />
    </div>
  );
}