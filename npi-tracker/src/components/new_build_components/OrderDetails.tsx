import { Title1 } from "@fluentui/react-components";
import {Input, InfoLabel, Dropdown} from "@fluentui/react-components"
import '../styles/App.css';

export default function OrderDetailsStep() {
  return (
    <div id="orderdetails_div">
        <Title1>Create New Build for tracking</Title1>
        <InfoLabel>Build ID Tracking</InfoLabel>
            <Input id="order_number_txt"/>
        <InfoLabel>CRD</InfoLabel>
            <Input id="crd_txt"/>
        <InfoLabel>Revision</InfoLabel>
            <Input id="crd_rev_txt"/>
        <InfoLabel>Build Stage</InfoLabel>
            <Dropdown id="stage">
                EV
                PV
                MP
                CR
            </Dropdown>
        <InfoLabel>Rack QTY</InfoLabel>
        <Input id="rack_qty"/>
    </div>
  );
}