import { Input, InfoLabel, Dropdown, Option } from "@fluentui/react-components";
import { type BuildData } from "../../models/BuildData";
//import '../styles/App.css';

interface OrderDetailsStepProps {
    buildData: BuildData;
    setBuildData:
        React.Dispatch<React.SetStateAction<BuildData>>;
}

export default function OrderDetailsStep({
    buildData,
    setBuildData}: OrderDetailsStepProps) {
    const updateBuildData = (field: keyof BuildData["orderDetails"], value: string) => {
        setBuildData((current) => ({ ...current, [field]: value }));
    };

const updateRackQty = (value: string) => {
    const qty = Number(value) || 0;
    setBuildData(current => {
        const existing = [...current.racks];
        while (existing.length < qty) {
            existing.push({rackSerial: ""});
        }
        return {...current,
            orderDetails: {
                ...current.orderDetails,
                rackQty: value
            },
            racks:
                existing.slice(0,qty)
        };
    });
};

  return (
    <div
        id="orderdetails_div"
        style={{
            display: "grid",
            gridTemplateColumns: "max-content minmax(0, 1fr)",
            gap: "12px 16px",
            alignItems: "center",
        }}
    >
        <InfoLabel>Build ID Tracking</InfoLabel>
            <Input
                id="order_number_txt"
                value={buildData.orderDetails.buildId ?? ""}
                onChange={(event) => updateBuildData("buildId", event.target.value)}
            />
        <InfoLabel>CRD</InfoLabel>
            <Input
                id="crd_number_txt"
                value={buildData.orderDetails.crdNumber ?? ""}
                onChange={(event) => updateBuildData("crdNumber", event.target.value)}
            />
        <InfoLabel>Revision</InfoLabel>
            <Input
                id="crd_rev_txt"
                value={buildData.orderDetails.crdRevision ?? ""}
                onChange={(event) => updateBuildData("crdRevision", event.target.value)}
            />
        <InfoLabel>Build Stage</InfoLabel>
            <Dropdown
                id="stage"
                value={buildData.orderDetails.buildStage ?? ""}
                onOptionSelect={(_, data) => updateBuildData("buildStage", data.optionValue ?? "")}
            >
                <Option value="EV">EV</Option>
                <Option value="PV">PV</Option>
                <Option value="MP">MP</Option>
                <Option value="CR">CR</Option>
            </Dropdown>
        <InfoLabel>Rack QTY</InfoLabel>
        <Input id="rack_qty" type="number"
            value={
                buildData.orderDetails.rackQty
            }
            onChange={(_, data) =>
                updateRackQty(data.value)}/>

    </div>
  );
}