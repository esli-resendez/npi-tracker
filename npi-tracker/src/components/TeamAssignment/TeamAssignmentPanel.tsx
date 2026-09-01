import { useEffect, useState } from "react";
import {
  Button,
  Dropdown,
  Option,
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
  assignTeamRoles,
  type RoleOption,
  type OrderMember,
} from "../../api/ordersApi";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" },
  entry: { display: "flex", gap: "8px", alignItems: "flex-end" },
  actions: { display: "flex", gap: "8px", marginTop: "8px" },
});

// A row in the form. Existing members carry a user_id from the server;
// newly added rows don't -- the backend resolves the user by email
// (get-or-create) when the form is submitted.
interface MemberRow {
  rowKey: string;
  user_id: number | null;
  email: string;
  role_name: string | null;
}

let rowKeyCounter = 0;
const newRowKey = () => `new-${++rowKeyCounter}`;

export function TeamAssignmentPanel({
  orderId,
  onAssigned,
  onCancel,
}: {
  orderId: number;
  onAssigned: () => void;
  onCancel: () => void;
}) {
  const styles = useStyles();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getAssignableRoles(orderId), getOrderTeam(orderId)])
      .then(([roleOptions, members]: [RoleOption[], OrderMember[]]) => {
        if (cancelled) return;
        setRoles(roleOptions);
        setRows(
          members.map((m) => ({
            rowKey: `existing-${m.user_id}`,
            user_id: m.user_id,
            email: m.email,
            // Guard against a stale ADMIN row -- shouldn't happen since the
            // backend excludes ADMIN, but don't silently pre-select it if it does.
            role_name: roleOptions.some((r) => r.role_name === m.role_name) ? m.role_name : null,
          }))
        );
      })
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const updateRowRole = (rowKey: string, role_name: string | null) => {
    setRows((prev) => prev.map((r) => (r.rowKey === rowKey ? { ...r, role_name } : r)));
  };

  const removeRow = (rowKey: string) => {
    setRows((prev) => prev.filter((r) => r.rowKey !== rowKey));
  };

  const addMember = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (rows.some((r) => r.email.toLowerCase() === email)) {
      setError(`${email} is already in this list.`);
      return;
    }
    setRows((prev) => [...prev, { rowKey: newRowKey(), user_id: null, email, role_name: null }]);
    setNewEmail("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (rows.length === 0) {
      setError("Add at least one team member before assigning roles.");
      return;
    }
    const missingRole = rows.find((r) => !r.role_name);
    if (missingRole) {
      setError(`Select a role for ${missingRole.email}.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await assignTeamRoles(
        orderId,
        rows.map((r) => ({ email: r.email, role_name: r.role_name as string }))
      );
      onAssigned();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading team..." />;

  return (
    <div className={styles.root}>
      <Text weight="semibold" size={500}>Assign team roles</Text>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <Table aria-label="Order team">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell></TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowKey}>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                <Dropdown
                  placeholder="Select role"
                  value={row.role_name ?? ""}
                  selectedOptions={row.role_name ? [row.role_name] : []}
                  onOptionSelect={(_, data) => updateRowRole(row.rowKey, data.optionValue ?? null)}
                >
                  {roles.map((r) => (
                    <Option key={r.role_name} value={r.role_name}>
                      {r.role_name}
                    </Option>
                  ))}
                </Dropdown>
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

      <div className={styles.entry}>
        <Field label="Add member by email" style={{ flex: 1 }}>
          <Input
            value={newEmail}
            onChange={(_, data) => setNewEmail(data.value)}
            placeholder="name@example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMember();
              }
            }}
          />
        </Field>
        <Button onClick={addMember} disabled={!newEmail.trim()}>
          Add member
        </Button>
      </div>

      <div className={styles.actions}>
        <Button appearance="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Assigning..." : "Assign roles"}
        </Button>
        <Button onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
