import { useState } from "react";

// Deliberately self-contained: no FluentUI, no shared API layer, no shared
// styles. This exists purely to simulate what an external test system's
// POST to /api/process-events looks like, and is meant to be deleted once
// real external systems are wired up -- there's no link to it anywhere in
// the app, it's only reachable by typing the URL in directly.

const ENDPOINT = "http://localhost:8000/api/process-events";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; body: unknown }
  | { status: "error"; message: string };

export default function TestBenchPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [processName, setProcessName] = useState("");
  const [result, setResult] = useState("PASS");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: "submitting" });

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial_number: serialNumber,
          process_name: processName,
          result: result,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState({ status: "error", message: typeof body?.detail === "string" ? body.detail : `HTTP ${res.status}` });
        return;
      }

      setState({ status: "success", body });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24, fontFamily: "sans-serif", border: "1px solid #ccc", borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Process Event Test Bench</h2>
      <p style={{ color: "#666", fontSize: 14 }}>
        Simulates an external system POSTing a process result to <code>{ENDPOINT}</code>. Temporary tool -- not
        linked from anywhere in the app.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          serial_number
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="e.g. SN-00123"
            required
            style={{ padding: 8, fontSize: 14 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          process_name
          <input
            type="text"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            placeholder="e.g. BURN_IN"
            required
            style={{ padding: 8, fontSize: 14 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          result
          <select value={result} onChange={(e) => setResult(e.target.value)} style={{ padding: 8, fontSize: 14 }}>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={state.status === "submitting"}
          style={{ padding: "10px 16px", fontSize: 14, cursor: "pointer" }}
        >
          {state.status === "submitting" ? "Sending..." : "Send POST"}
        </button>
      </form>

      {state.status === "success" && (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "#eef9ee",
            border: "1px solid #b7e0b7",
            borderRadius: 4,
            fontSize: 13,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(state.body, null, 2)}
        </pre>
      )}

      {state.status === "error" && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#fbeaea",
            border: "1px solid #eab8b8",
            borderRadius: 4,
            fontSize: 13,
            color: "#8a1f1f",
          }}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
