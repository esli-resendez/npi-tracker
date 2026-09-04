import { useState } from "react";
import { Button, Tab, TabList, Text, makeStyles } from "@fluentui/react-components";
import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import { DescriptionTab } from "./tabs/DescriptionTab";
import { TeamRosterTab } from "./tabs/TeamRosterTab";
import { BomTab } from "./tabs/BomTab";
import { TestPlanTab } from "./tabs/TestPlanTab";
import { BuildLogTab } from "./tabs/BuildLogTab";

type DetailTab = "description" | "team" | "bom" | "test-plan" | "build-log";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  content: { minHeight: "320px" },
  // Bottom nav (rather than a step-by-step wizard) since every tab here is
  // just displaying information the user should be able to jump to in any
  // order once an order has an ACTIVE detail view.
  bottomNav: { borderTop: "1px solid #e0e0e0", paddingTop: "8px" },
});

export function OrderDetailPanel({
  orderId,
  orderNumber,
  onClose,
}: {
  orderId: number;
  orderNumber: string;
  onClose: () => void;
}) {
  const styles = useStyles();
  const [tab, setTab] = useState<DetailTab>("description");

  const onTabSelect = (_: SelectTabEvent, data: SelectTabData) => setTab(data.value as DetailTab);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Text weight="semibold" size={500}>
          Order {orderNumber}
        </Text>
        <Button appearance="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className={styles.content}>
        {tab === "description" && <DescriptionTab orderId={orderId} />}
        {tab === "team" && <TeamRosterTab orderId={orderId} />}
        {tab === "bom" && <BomTab orderId={orderId} />}
        {tab === "test-plan" && <TestPlanTab orderId={orderId} />}
        {tab === "build-log" && <BuildLogTab orderId={orderId} />}
      </div>

      <TabList className={styles.bottomNav} selectedValue={tab} onTabSelect={onTabSelect}>
        <Tab value="description">Description</Tab>
        <Tab value="team">Team Roster</Tab>
        <Tab value="bom">BOM</Tab>
        <Tab value="test-plan">Test Plan</Tab>
        <Tab value="build-log">Build Log</Tab>
      </TabList>
    </div>
  );
}
