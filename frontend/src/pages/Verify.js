import React, { useState } from "react";
import { verifyProduct } from "../services/api";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

function Verify() {
  const [sku, setSku] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (!sku.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const data = await verifyProduct(sku.trim());
      setResult(data);
    } catch (err) {
      setResult({ authentic: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleVerify();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>VERIFY PRODUCT</h1>
        <p>Authenticate any product instantly using its SKU code</p>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Search Bar */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-title">✓ AUTHENTICITY CHECK</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
            Enter the product's SKU or barcode to verify it against the immutable blockchain ledger.
          </p>

          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter SKU e.g. LAPTOP-X1-2024-001"
              value={sku}
              onChange={(e) => { setSku(e.target.value); setResult(null); setSearched(false); }}
              onKeyDown={handleKeyDown}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={loading || !sku.trim()}
              style={{ whiteSpace: "nowrap" }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} /> Verifying...</>
              ) : (
                "Verify →"
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        {searched && result && (
          <div
            className="card fade-in"
            style={{
              borderColor: result.authentic
                ? "rgba(0, 255, 136, 0.4)"
                : "rgba(255, 34, 68, 0.4)",
              background: result.authentic
                ? "rgba(0, 255, 136, 0.04)"
                : "rgba(255, 34, 68, 0.04)",
            }}
          >
            {result.authentic ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <span style={{ fontSize: "2.5rem" }}>✅</span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.1rem",
                        color: "var(--accent-green)",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      AUTHENTIC PRODUCT
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Verified on blockchain · Not counterfeit
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    fontSize: "0.875rem",
                  }}
                >
                  {[
                    ["Product", result.data.name],
                    ["SKU", result.data.sku],
                    ["Origin", result.data.origin],
                    ["Product ID", `#${result.data.productId}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "2px" }}>
                        {label}
                      </div>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "4px" }}>
                      Status
                    </div>
                    <StatusBadge status={result.data.status} />
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "2px" }}>
                      Manufacturer
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {result.data.manufacturer
                        ? `${result.data.manufacturer.slice(0, 10)}...${result.data.manufacturer.slice(-6)}`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                  <Link
                    to={`/products/${result.data.productId}`}
                    className="btn btn-secondary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    View Full Tracking History →
                  </Link>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.1rem",
                    color: "var(--accent-red)",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  NOT FOUND — POSSIBLE COUNTERFEIT
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  No product with SKU <strong style={{ fontFamily: "var(--font-mono)" }}>"{sku}"</strong> exists
                  on the blockchain. This product may be counterfeit or unregistered.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        {!searched && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
            {[
              { icon: "🔒", title: "Immutable Records", desc: "Product data stored on blockchain cannot be tampered with" },
              { icon: "⚡", title: "Instant Verification", desc: "Real-time authenticity check against the ledger" },
              { icon: "🌐", title: "Global Tracking", desc: "End-to-end visibility across all supply chain stages" },
              { icon: "🛡", title: "Anti-Counterfeit", desc: "Cryptographically verified product authenticity" },
            ].map((f) => (
              <div key={f.title} className="card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>{f.icon}</div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", fontSize: "0.875rem" }}>
                  {f.title}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{f.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Verify;
