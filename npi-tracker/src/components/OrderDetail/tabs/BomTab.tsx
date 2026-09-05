import { Fragment, useEffect, useState } from "react";
import {
  Button,
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  makeStyles,
} from "@fluentui/react-components";
import {
  getOrderRacks,
  getRackDevices,
  getDeviceComponents,
  type OrderRack,
  type RackDevice,
  type DeviceComponent,
} from "../../../api/ordersApi";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "12px" },
  hint: { color: "#666666" },
  deviceRow: { backgroundColor: "#fafafa" },
  componentRow: { backgroundColor: "#f3f2f1" },
  expandCell: { width: "40px" },
  // Stage cell colors: PASS light green, FAIL light orange, UNTESTED light gray.
  stagePass: { backgroundColor: "#dff6dd", fontWeight: 600 },
  stageFail: { backgroundColor: "#fde7d9", fontWeight: 600 },
  stageUntested: { backgroundColor: "#e8e8e8", color: "#555555" },
});

type Stage = "PASS" | "FAIL" | "UNTESTED";

function useStageClass(styles: ReturnType<typeof useStyles>) {
  return (stage: Stage) => {
    if (stage === "PASS") return styles.stagePass;
    if (stage === "FAIL") return styles.stageFail;
    return styles.stageUntested;
  };
}

export function BomTab({ orderId }: { orderId: number }) {
  const styles = useStyles();
  const stageClass = useStageClass(styles);

  const [racks, setRacks] = useState<OrderRack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lazily-fetched expansion state, keyed by rack_id / device_id. `undefined`
  // means "not expanded / not fetched yet", an array (possibly empty) means
  // "expanded, here's what came back".
  const [rackDevices, setRackDevices] = useState<Record<number, RackDevice[] | undefined>>({});
  const [deviceComponents, setDeviceComponents] = useState<Record<number, DeviceComponent[] | undefined>>({});
  const [rackLoading, setRackLoading] = useState<Record<number, boolean>>({});
  const [deviceLoading, setDeviceLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    getOrderRacks(orderId)
      .then((r) => !cancelled && setRacks(r))
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const toggleRack = async (rackId: number) => {
    if (rackDevices[rackId] !== undefined) {
      setRackDevices((prev) => ({ ...prev, [rackId]: undefined }));
      return;
    }
    setRackLoading((prev) => ({ ...prev, [rackId]: true }));
    try {
      const devices = await getRackDevices(orderId, rackId);
      setRackDevices((prev) => ({ ...prev, [rackId]: devices }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRackLoading((prev) => ({ ...prev, [rackId]: false }));
    }
  };

  const toggleDevice = async (deviceId: number) => {
    if (deviceComponents[deviceId] !== undefined) {
      setDeviceComponents((prev) => ({ ...prev, [deviceId]: undefined }));
      return;
    }
    setDeviceLoading((prev) => ({ ...prev, [deviceId]: true }));
    try {
      const components = await getDeviceComponents(orderId, deviceId);
      setDeviceComponents((prev) => ({ ...prev, [deviceId]: components }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeviceLoading((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  if (loading) return <Spinner label="Loading BOM..." />;

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      <Text size={200} className={styles.hint}>
        Expand a rack to see the devices installed on it, then expand a device to see its sub-components. Stage
        reflects the most recent PASS/FAIL result reported for that rack or device.
      </Text>

      <Table aria-label="Order BOM">
        <TableHeader>
          <TableRow>
            <TableHeaderCell className={styles.expandCell}></TableHeaderCell>
            <TableHeaderCell>Serial number</TableHeaderCell>
            <TableHeaderCell>Part number</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell>Position</TableHeaderCell>
            <TableHeaderCell>Stage</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {racks.map((rack) => {
            const devices = rackDevices[rack.rack_id];
            return (
              <Fragment key={`rack-${rack.rack_id}`}>
                <TableRow>
                  <TableCell className={styles.expandCell}>
                    <Button size="small" appearance="subtle" onClick={() => toggleRack(rack.rack_id)}>
                      {rackLoading[rack.rack_id] ? "…" : devices ? "▾" : "▸"}
                    </Button>
                  </TableCell>
                  <TableCell>{rack.rack_serial}</TableCell>
                  <TableCell>{rack.rack_sku}</TableCell>
                  <TableCell>{rack.rack_gen_name}</TableCell>
                  <TableCell>RACK</TableCell>
                  <TableCell className={stageClass(rack.status)}>{rack.status}</TableCell>
                </TableRow>

                {devices?.map((device) => {
                  const components = deviceComponents[device.device_id];
                  return (
                    <Fragment key={`device-${device.device_id}`}>
                      <TableRow className={styles.deviceRow}>
                        <TableCell className={styles.expandCell}>
                          <Button size="small" appearance="subtle" onClick={() => toggleDevice(device.device_id)}>
                            {deviceLoading[device.device_id] ? "…" : components ? "▾" : "▸"}
                          </Button>
                        </TableCell>
                        <TableCell>{device.serial_number}</TableCell>
                        <TableCell>{device.part_number}</TableCell>
                        <TableCell>{device.device_description}</TableCell>
                        <TableCell>{device.position}</TableCell>
                        <TableCell className={stageClass(device.status)}>{device.status}</TableCell>
                      </TableRow>

                      {components?.map((component) => (
                        <TableRow key={`component-${component.component_id}`} className={styles.componentRow}>
                          <TableCell></TableCell>
                          <TableCell>{component.serial_number}</TableCell>
                          <TableCell>{component.part_number}</TableCell>
                          <TableCell>
                            {component.component_name}
                            {component.component_role ? ` (${component.component_role})` : ""}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                      {components && components.length === 0 && (
                        <TableRow className={styles.componentRow}>
                          <TableCell></TableCell>
                          <TableCell colSpan={5}>No components recorded for this device.</TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
                {devices && devices.length === 0 && (
                  <TableRow className={styles.deviceRow}>
                    <TableCell></TableCell>
                    <TableCell colSpan={5}>No devices recorded for this rack.</TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {racks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>No racks linked to this order yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
