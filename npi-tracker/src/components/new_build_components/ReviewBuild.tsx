import {
  Button,
  Card,
  Title2
} from "@fluentui/react-components";
import type { BuildData, RackInfo, AssignedUsers } from "../../models/BuildData";

interface ReviewBuildProps {
  buildData: BuildData;
  onSubmit: () => void;
}

export default function ReviewBuild({
  buildData,
  onSubmit
}: ReviewBuildProps) {

  return (
    <div>
      <Title2>Review Build</Title2>
      <Card>
        <h3>Order Details</h3>
        <p>
          Build ID:
          {buildData.orderDetails.buildId}
        </p>
        <p>
          CRD Revision:
          {buildData.orderDetails.crdRevision}
        </p>
        <p>
          Build Stage:
          {buildData.orderDetails.buildStage}
        </p>
        <p>
          Rack Quantity:
          {buildData.orderDetails.rackQty.toString()}
        </p>
      </Card>

      <Card>
        <h3>Rack Serials</h3>
        {
          buildData.racks.map(
            (
              rack: RackInfo,
              index: number
            ) => (
              <p key={index}>
                {rack.rackSerial}
              </p>
            )
          )
        }

      </Card>

      <Card>
        <h3>Assigned Users</h3>
        {
          buildData.team.length > 0
            ? buildData.team.map(
                (member: AssignedUsers) => (
                  <p key={member.user_email}>
                    {member.user_email}
                  </p>
                )
              )
            : <p>No users assigned.</p>
        }
      </Card>


    </div>
  );
}