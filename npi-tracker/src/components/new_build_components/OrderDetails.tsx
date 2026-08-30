import React from "react";
import {
  Input,
  InfoLabel,
  Slider,
} from "@fluentui/react-components";

import type { BuildData } from "../../models/BuildData";
import FormField from "./FormField";

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

  const updateRackQty = (value:number) => {

    setBuildData((current) => {
      const existing = [...current.racks];
      while (existing.length < value) {
        existing.push({
          rackSerial: "",
        }); }

      return {
        ...current,
        orderDetails: {
          ...current.orderDetails,
          rackQty: value,
        },
        racks: existing.slice(0, value),
      };
    });
  };

  return (
    <div id="ord-details-main" className="order-details-grid">
      <InfoLabel>Build ID Tracking</InfoLabel>
      <Input
        className="ord-details-input"
        value={buildData.orderDetails.buildId}
        disabled={true}
        onChange={(event) =>
          updateBuildData("buildId", event.target.value)
        }
      />
      
      <FormField
      label="Rack SKU Number"
      field="rackSku"
      value={buildData.orderDetails.rackSku}
      maxlen={20}
      onChange={updateBuildData}
      />
      
      <FormField
      label="Rack Assy Name"
      field="rackGenName"
      value={buildData.orderDetails.rackGenName}
      maxlen={100}
      onChange={updateBuildData}
      />

      <FormField
      label="CRD DOC SKU"
      field="crdNumber"
      value={buildData.orderDetails.crdNumber}
      maxlen={20}
      onChange={updateBuildData}
      />

      <FormField
      label="CRD Revision"
      field="crdRevision"
      value={buildData.orderDetails.crdRevision}
      maxlen={4}
      onChange={updateBuildData}
      />

      <InfoLabel htmlFor="build-stage-select">Build Stage</InfoLabel>
      <select
        id="build-stage-select"
        className="ord-details-native-select"
        value={buildData.orderDetails.buildStage}
        onChange={(event) =>
          updateBuildData("buildStage", event.target.value)
        }
      >
        <option value="" disabled>
          Select a stage
        </option>
        <option value="EV">EV Build</option>
        <option value="PV">PV Build</option>
        <option value="MP">Mass Prod validation</option>
        <option value="CR">Control Run</option>
      </select>

      <InfoLabel>Rack QTY</InfoLabel>
      <Slider min={1} max={5} step={1} defaultValue={1}
      onChange={(event) => updateRackQty(event.target.valueAsNumber)}
      />
    </div>
  );
}