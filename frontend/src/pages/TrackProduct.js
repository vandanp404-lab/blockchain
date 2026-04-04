import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getProduct, getTrackingHistory, updateTracking, getConfig } from "../services/api";
import StatusBadge from "../components/StatusBadge";

const STATUS_OPTIONS = [
  { value: 0, label: "Created" },
  { value: 1, label: "In Transit" },
  { value: 2, label: "At Warehouse" },
  { value: 3, label: "In Customs" },
  { value: 4, label: "Delivered" },
];

function TrackProduct() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(null);

  const [form, setForm] = useState({
    location: "",
    description: "",
    status: 1,
    latitude: "",
    longitude: "",
    privateKey: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, histData, cfg] = await Promise.all([
        getProduct(id),
        getTrackingHistory(id),
        getConfig().catch(() => null),
      ]);
      setProduct(prodData.data);
      setHistory(histData.data || []);
      setConfig(cfg);
      if (cfg?.accounts?.supplier) {
        // Pre-fill with supplier's default test key
      }
    } catch (err) {
      toast.error("Failed to load product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.location) {
      toast.error("Location is required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        location: form.location,
        description: form.description,
        status: Number(form.status),
        latitude: form.latitude,
        longitude: form.longitude,
        privateKey: form.privateKey || undefined,
      };

      await updateTracking(id, payload);
      toast.success("Tracking updated on blockchain!");
      setForm({ ...form, location: "", description: "" });
      loadData();
    } catch (err) {
      toast.error("Update failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        Loading product from blockchain...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <h3>Product not found</h3>
        <Link to="/products" className="btn btn-secondary">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "24px" }}>
        <Link
          to="/products"
          style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
        >
          ← Products
        </Link>
      </div>

      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <h1>{product.name}</h1>
          <StatusBadge status={product.status} />
        </div>
        <p>
          SKU: <span style={{ fontFamily: "var(--font-mono)" }}>{product.sku}</span>
          {" · "}
          Origin: {product.origin}
          {" · "}
          ID: <span style={{ fontFamily: "var(--font-mono)" }}>#{product.id}</span>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px", alignItems: "start" }}>
        {/* Tracking History */}
        <div className="card">
          <div className="card-title">⊞ TRACKING HISTORY ({history.length} EVENTS)</div>

          {history.length === 0 ? (
            <div className="empty-state">
              <p>No tracking events</p>
            </div>
          ) : (
            <div className="timeline">
              {[...history].reverse().map((event, index) => (
                <div key={index} className="timeline-item">
                  <div className={`timeline-dot ${index === 0 ? "active" : ""}`} />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div>
                        <div className="timeline-location">📍 {event.location}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <StatusBadge status={event.status} />
                        <div className="timeline-time">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {event.description && (
                      <div className="timeline-desc">{event.description}</div>
                    )}
                    <div className="timeline-handler">
                      Handler: {event.handler
                        ? `${event.handler.slice(0, 8)}...${event.handler.slice(-6)}`
                        : "—"}
                    </div>
                    {event.coordinates?.latitude !== "0" && (
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        🌐 {event.coordinates.latitude}, {event.coordinates.longitude}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Update Tracking Form */}
        {product.status !== "Recalled" && (
          <div className="card">
            <div className="card-title">+ UPDATE TRACKING</div>

            <div className="form-group">
              <label className="form-label">
                Location <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Port of Singapore"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Notes about this checkpoint..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1.3521"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 103.8198"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Signer Private Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="0x... (leave blank for default)"
                value={form.privateKey}
                onChange={(e) => setForm({ ...form, privateKey: e.target.value })}
              />
              <div className="form-hint">
                Uses default test key if blank (local dev only)
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />
                  Writing to blockchain...
                </>
              ) : (
                "⛓ Update on Blockchain"
              )}
            </button>

            {config && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Test Accounts:
                </div>
                {Object.entries(config.accounts).map(([role, addr]) => (
                  <div key={role}>
                    {role}: {addr.slice(0, 10)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {product.status === "Recalled" && (
          <div
            className="card"
            style={{
              borderColor: "rgba(255, 34, 68, 0.4)",
              background: "rgba(255, 34, 68, 0.05)",
            }}
          >
            <div
              className="card-title"
              style={{ color: "var(--accent-red)" }}
            >
              ⚠ PRODUCT RECALLED
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              This product has been recalled and cannot receive further
              tracking updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackProduct;
