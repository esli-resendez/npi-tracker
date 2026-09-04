import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
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
  getAssignableRoles,
  getOrderTeam,
  addTeamMembers,
  type RoleOption,
  type OrderMember,
} from "../../../api/ordersApi";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" },
  entry: { display: "flex", gap: "8px", alignItems: "flex-end" },
  actions: { display: "flex", gap: "8px" },
  // Native <select>, same workaround used in TeamAssignmentPanel.tsx --
  // Fluent's Dropdown/Option pairing crashes in this project's dev setup.
  roleSelect: {
    height: "32px",
    padding: "0 8px",
    borderRadius: "4px",
    border: "1px solid #d1d1d1",
    fontFamily: "inherit",
    fontSize: "14px",
    minWidth: "180px",
  },
});

interface NewMemberRow {
  rowKey: string;
  email: string;
  role_name: string | null;
}

let rowKeyCounter = 0;
const newRowKey = () => `new-${++rowKeyCounter}`;

export function TeamRosterTab({ orderId }: { orderId: number }) {
  const styles = useStyles();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [members, setMembers] = useState<OrderMember[]>([]);
  const [newRows, setNewRows] = useState<NewMemberRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = () =>
    Promise.all([getAssignableRoles(orderId), getOrderTeam(orderId)]).then(([roleOptions, existing]) => {
      setRoles(roleOptions);
      setMembers(existing);
    });

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const updateRowRole = (rowKey: string, role_name: string | null) =>
    setNewRows((prev) => prev.map((r) => (r.rowKey === rowKey ? { ...r, role_name } : r)));

  const removeRow = (rowKey: string) => setNewRows((prev) => prev.filter((r) => r.rowKey !== rowKey));

  const addRow = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (members.some((m) => m.email.toLowerCase() === email) || newRows.some((r) => r.email === email)) {
      setError(`${email} is already on this order.`);
      return;
    }
    setNewRows((prev) => [...prev, { rowKey: newRowKey(), email, role_name: null }]);
    setNewEmail("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (newRows.length === 0) {
      setError("Add at least one team member before saving.");
      return;
    }
    const missingRole = newRows.find((r) => !r.role_name);
    if (missingRole) {
      setError(`Select a role for ${missingRole.email}.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await addTeamMembers(
        orderId,
        newRows.map((r) => ({ email: r.email, role_name: r.role_name as string }))
      );
      setNewRows([]);
      setSuccess("Team members added.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading team roster..." />;

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {success && (
        <MessageBar intent="success">
          <MessageBarBody>{success}</MessageBarBody>
        </MessageBar>
      )}

      <Text weight="semibold">Current team</Text>
      <Table aria-label="Team roster">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.user_id}>
              <TableCell>{m.display_name ?? m.email}</TableCell>
              <TableCell>{m.role_name}</TableCell>
            </TableRow>
          ))}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={2}>No team members assigned yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Text weight="semibold">Add team members</Text>
      {newRows.length > 0 && (
        <Table aria-label="New team members">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newRows.map((row) => (
              <TableRow key={row.rowKey}>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  <select
                    className={styles.roleSelect}
                    value={row.role_name ?? ""}
                    onChange={(e) => updateRowRole(row.rowKey, e.target.value || null)}
                  >
                    <option value="" disabled>
                      Select role
                    </option>
                    {roles.map((r) => (
                      <option key={r.role_name} value={r.role_name}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Button size="small" appearance="subtle" onClick={() => removeRow(row.rowKey)}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className={styles.entry}>
        <Field label="Add member by email" style={{ flex: 1 }}>
          <Input
            value={newEmail}
            onChange={(_, data) => setNewEmail(data.value)}
            placeholder="name@example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRow();
              }
            }}
          />
        </Field>
        <Button onClick={addRow} disabled={!newEmail.trim()}>
          Add row
        </Button>
      </div>

      <div className={styles.actions}>
        <Button appearance="primary" onClick={handleSubmit} disabled={submitting || newRows.length === 0}>
          {submitting ? "Saving..." : "Assign team members"}
        </Button>
      </div>
    </div>
  );
}
