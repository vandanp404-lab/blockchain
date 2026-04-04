import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getConfig, registerParticipant, getParticipant } from "../services/api";

const ROLE_COLORS = {
  admin:        "var(--accent-cyan)",
  manufacturer: "var(--accent-purple)",
  supplier:     "#4da6ff",
  distributor:  "var(--accent-yellow)",
  retailer:     "var(--accent-green)",
  customs:      "var(--accent-orange)",
};

function Participants() {
  const [config, setConfig] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    address: "",
    name: "",
    role: "supplier",
    ownerPrivateKey: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const cfg = await getConfig();
      setConfig(cfg);

      // Load all registered participants
      const results = [];
      for (const [role, addr] of Object.entries(cfg.accounts)) {
        try {
          const p = await getParticipant(addr);
          results.push({ ...p.data, role_label: role });
        } catch {}
      }
      setParticipants(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.address || !form.name || !form.role) {
      toast.error("Address, name and role are required");
      return;
    }
    try {
      setSubmitting(true);
      await registerParticipant({
        address: form.address,
        name: form.name,
        role: form.role,
        privateKey: form.ownerPrivateKey || undefined,
      });
      toast.success(`${form.name} registered as ${form.role}!`);
      setForm({ address: "", name: "", role: "supplier", ownerPrivateKey: "" });
      loadData();
    } catch (err) {
      toast.error("Registration failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>PARTICIPANTS</h1>
        <p>Manage supply chain participants registered on the blockchain</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>
        {/* Participants Table */}
        <div>
          {loading ? (
            <div className="page-loading">
              <div className="spinner" />
              Loading participants...
            </div>
          ) : (
            <div className="card">
              <div className="card-title">◎ REGISTERED PARTICIPANTS ({participants.length})</div>
              {participants.length > 0 ? (
                <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p) => (
                        <tr key={p.address}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.75rem",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                background: `${ROLE_COLORS[p.role] || "var(--accent-cyan)"}20`,
                                color: ROLE_COLORS[p.role] || "var(--accent-cyan)",
                                border: `1px solid ${ROLE_COLORS[p.role] || "var(--accent-cyan)"}40`,
                                textTransform: "capitalize",
                              }}
                            >
                              {p.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className="td-mono"
                              title={p.address}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                navigator.clipboard?.writeText(p.address);
                                toast.info("Address copied!");
                              }}
                            >
                              {p.address.slice(0, 8)}...{p.address.slice(-6)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${p.isActive ? "badge-delivered" : "badge-recalled"}`}
                            >
                              {p.isActive ? "◉ Active" : "◉ Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <p>No participants loaded</p>
                </div>
              )}
            </div>
          )}

          {/* Account Info */}
          {config && (
            <div className="card" style={{ marginTop: "20px" }}>
              <div className="card-title">🔑 TEST ACCOUNTS (LOCAL DEV)</div>
              <div
                style={{
                  background: "rgba(255, 107, 0, 0.08)",
                  border: "1px solid rgba(255, 107, 0, 0.3)",
                  borderRadius: "var(--radius)",
                  padding: "10px 14px",
                  fontSize: "0.78rem",
                  color: "var(--accent-orange)",
                  marginBottom: "16px",
                }}
              >
                ⚠ These are Hardhat test accounts. Never use in production.
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {Object.entries(config.accounts).map(([role, addr]) => (
                  <div
                    key={role}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "var(--bg-secondary)",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      navigator.clipboard?.writeText(addr);
                      toast.info(`${role} address copied!`);
                    }}
                    title="Click to copy"
                  >
                    <span style={{ color: ROLE_COLORS[role] || "var(--text-muted)", textTransform: "capitalize" }}>
                      {role}
                    </span>
                    <span>{addr.slice(0, 12)}...{addr.slice(-8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Register Form */}
        <div className="card">
          <div className="card-title">+ REGISTER PARTICIPANT</div>

          <div className="form-group">
            <label className="form-label">
              Ethereum Address <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="0x..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Organization Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Global Logistics Inc"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Role <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="manufacturer">Manufacturer</option>
              <option value="supplier">Supplier</option>
              <option value="distributor">Distributor</option>
              <option value="retailer">Retailer</option>
              <option value="customs">Customs Authority</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Owner Private Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="0x... (leave blank for default)"
              value={form.ownerPrivateKey}
              onChange={(e) => setForm({ ...form, ownerPrivateKey: e.target.value })}
            />
            <div className="form-hint">Only owner can register participants</div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} /> Registering...</>
            ) : "⛓ Register on Blockchain"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Participants;
