import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { createProduct } from "../services/api";

function AddProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    origin: "",
    initialLocation: "",
    latitude: "",
    longitude: "",
    privateKey: "",
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.origin) {
      toast.error("Name, SKU and Origin are required");
      return;
    }

    try {
      setSubmitting(true);
      const result = await createProduct({
        name: form.name,
        sku: form.sku,
        origin: form.origin,
        initialLocation: form.initialLocation || form.origin,
        latitude: form.latitude,
        longitude: form.longitude,
        privateKey: form.privateKey || undefined,
      });

      toast.success(
        `Product registered! ID: #${result.data.productId} | TX: ${result.data.transactionHash.slice(0, 10)}...`
      );
      navigate(`/products/${result.data.productId}`);
    } catch (err) {
      toast.error("Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "24px" }}>
        <Link to="/products" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          ← Products
        </Link>
      </div>

      <div className="page-header">
        <h1>REGISTER PRODUCT</h1>
        <p>Create an immutable product record on the blockchain</p>
      </div>

      <div style={{ maxWidth: "640px" }}>
        <div className="card">
          <div className="card-title">⬜ PRODUCT INFORMATION</div>

          <div className="form-group">
            <label className="form-label">
              Product Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Premium Laptop X1"
              value={form.name}
              onChange={set("name")}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                SKU / Product Code <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. LAPTOP-X1-2024"
                value={form.sku}
                onChange={set("sku")}
              />
              <div className="form-hint">Must be unique across all products</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Country of Origin <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. China"
                value={form.origin}
                onChange={set("origin")}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Shenzhen Manufacturing Plant"
              value={form.initialLocation}
              onChange={set("initialLocation")}
            />
            <div className="form-hint">Defaults to origin if not specified</div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 22.5431"
                value={form.latitude}
                onChange={set("latitude")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 114.0579"
                value={form.longitude}
                onChange={set("longitude")}
              />
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "20px",
              marginTop: "4px",
            }}
          >
            <div className="card-title">⛓ BLOCKCHAIN SIGNING</div>

            <div className="form-group">
              <label className="form-label">Manufacturer Private Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="0x... (leave blank for default test key)"
                value={form.privateKey}
                onChange={set("privateKey")}
              />
              <div className="form-hint">
                ⚠ Never use real private keys in development. Blank = Hardhat default test key.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Writing to Blockchain...
                </>
              ) : (
                "⛓ Register on Blockchain"
              )}
            </button>
            <Link to="/products" className="btn btn-secondary btn-lg">
              Cancel
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            background: "rgba(0, 212, 255, 0.05)",
            border: "1px solid rgba(0, 212, 255, 0.15)",
            borderRadius: "var(--radius)",
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
          }}
        >
          <strong style={{ color: "var(--accent-cyan)" }}>ℹ About Blockchain Registration</strong>
          <br />
          Once registered, this product's data is <strong>immutable</strong> — it cannot be altered
          or deleted. The product will receive a unique on-chain ID and all subsequent tracking
          events will be permanently recorded.
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
