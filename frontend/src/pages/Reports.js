import React, { useState, useEffect } from "react";
import { getAnalytics, getTrackingHistory, getProducts } from "../services/api";
import StatusBadge from "../components/StatusBadge";

function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [traceReport, setTraceReport] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, productsData] = await Promise.all([
        getAnalytics(),
        getProducts(),
      ]);
      setAnalytics(analyticsData.data);
      setProducts(productsData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateTraceReport = async () => {
    if (!selectedProduct) return;
    try {
      setTraceLoading(true);
      const data = await getTrackingHistory(selectedProduct);
      const product = products.find((p) => p.id === Number(selectedProduct));
      setTraceReport({ product, events: data.data });
    } catch (err) {
      console.error(err);
    } finally {
      setTraceLoading(false);
    }
  };

  const exportReport = () => {
    if (!analytics) return;
    const report = {
      title: "Supply Chain Blockchain Report",
      generatedAt: new Date().toISOString(),
      blockchain: analytics.blockchain,
      summary: analytics.summary,
      products: analytics.products,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supply-chain-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTraceReport = () => {
    if (!traceReport) return;
    const csv = [
      ["Event #", "Location", "Status", "Description", "Handler", "Timestamp", "Latitude", "Longitude"],
      ...traceReport.events.map((e, i) => [
        i + 1,
        e.location,
        e.status,
        e.description,
        e.handler,
        e.timestamp,
        e.coordinates?.latitude || "",
        e.coordinates?.longitude || "",
      ]),
    ]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-report-product-${selectedProduct}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        Generating reports...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1>REPORTS</h1>
          <p>Supply chain analytics and traceability reports</p>
        </div>
        <button className="btn btn-secondary" onClick={exportReport}>
          ↓ Export Analytics JSON
        </button>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <>
          <div className="stat-grid" style={{ marginBottom: "24px" }}>
            {[
              { label: "Total Products", value: analytics.summary.total, accent: "var(--accent-cyan)" },
              { label: "Created",        value: analytics.summary.created, accent: "var(--accent-purple)" },
              { label: "In Transit",     value: analytics.summary.inTransit, accent: "#4da6ff" },
              { label: "At Warehouse",   value: analytics.summary.atWarehouse, accent: "var(--accent-cyan)" },
              { label: "In Customs",     value: analytics.summary.inCustoms, accent: "var(--accent-yellow)" },
              { label: "Delivered",      value: analytics.summary.delivered, accent: "var(--accent-green)" },
              { label: "Recalled",       value: analytics.summary.recalled, accent: "var(--accent-red)" },
            ].map((s) => (
              <div className="stat-card" key={s.label} style={{ "--accent-color": s.accent }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Blockchain Info */}
          <div
            className="card"
            style={{ marginBottom: "24px" }}
          >
            <div className="card-title">⛓ BLOCKCHAIN METADATA</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", fontSize: "0.875rem" }}>
              {[
                ["Contract Address", analytics.blockchain.contractAddress],
                ["Network", analytics.blockchain.network],
                ["Report Generated", new Date(analytics.generatedAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontSize: "0.8rem", wordBreak: "break-all" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Products Table */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-title">⬜ ALL PRODUCTS REPORT</div>
            {analytics.products.length > 0 ? (
              <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Status</th>
                      <th>Manufacturer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.products.map((p) => (
                      <tr key={p.id}>
                        <td className="td-mono">#{p.id}</td>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td className="td-mono">{p.sku}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td className="td-mono">
                          {p.manufacturer ? `${p.manufacturer.slice(0, 10)}...` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><p>No products</p></div>
            )}
          </div>
        </>
      )}

      {/* Traceability Report */}
      <div className="card">
        <div
          className="card-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>◎ TRACEABILITY REPORT</span>
          {traceReport && (
            <button className="btn btn-secondary btn-sm" onClick={exportTraceReport}>
              ↓ Export CSV
            </button>
          )}
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "16px" }}>
          Generate a full traceability report for any product
        </p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <select
            className="form-select"
            value={selectedProduct}
            onChange={(e) => { setSelectedProduct(e.target.value); setTraceReport(null); }}
            style={{ flex: 1 }}
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} – {p.name} ({p.sku})
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={generateTraceReport}
            disabled={!selectedProduct || traceLoading}
          >
            {traceLoading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} /> Generating...</>
            ) : "Generate Report"}
          </button>
        </div>

        {traceReport && (
          <div className="fade-in">
            {/* Product Summary */}
            <div
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius)",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "4px" }}>
                    {traceReport.product?.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    SKU: {traceReport.product?.sku} · Origin: {traceReport.product?.origin}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <StatusBadge status={traceReport.product?.status} />
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {traceReport.events.length} events
                  </div>
                </div>
              </div>
            </div>

            {/* Events */}
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Handler</th>
                    <th>Timestamp</th>
                    <th>Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {traceReport.events.map((e, i) => (
                    <tr key={i}>
                      <td className="td-mono">{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>📍 {e.location}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        {e.description || "—"}
                      </td>
                      <td className="td-mono">
                        {e.handler ? `${e.handler.slice(0, 8)}...` : "—"}
                      </td>
                      <td className="td-mono" style={{ whiteSpace: "nowrap" }}>
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                      <td className="td-mono" style={{ fontSize: "0.72rem" }}>
                        {e.coordinates?.latitude !== "0"
                          ? `${e.coordinates.latitude}, ${e.coordinates.longitude}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
