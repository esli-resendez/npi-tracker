import { Button, MessageBar, MessageBarBody } from "@fluentui/react-components";

export function ConfirmationStep({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <MessageBar intent="success">
        <MessageBarBody>The order is ready for team assignment.</MessageBarBody>
      </MessageBar>
      <div style={{ marginTop: 12 }}>
        <Button appearance="primary" onClick={onClose}>Back to builds</Button>
      </div>
    </div>
  );
}