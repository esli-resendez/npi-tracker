import {
  Button,
  Card,
  Title2
} from "@fluentui/react-components";

interface ReviewBuildProps {
  buildData: any;
  onSubmit: () => void;
}

export default function ReviewBuild({
  buildData,
  onSubmit
}: ReviewBuildProps) {

  return (
    <div>

      <Title2>
        Review Build
      </Title2>

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
          {buildData.orderDetails.rackQty}
        </p>

      </Card>

      <Card>

        <h3>Rack Serials</h3>

        {
          buildData.racks.map(
            (
              rack: string,
              index: number
            ) => (
              <p key={index}>
                {rack}
              </p>
            )
          )
        }

      </Card>

      <Button
        appearance="primary"
        onClick={onSubmit}
      >
        Create Build
      </Button>

    </div>
  );
}