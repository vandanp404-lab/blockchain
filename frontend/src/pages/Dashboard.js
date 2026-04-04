import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getAnalytics } from "../services/api";
import StatusBadge from "../components/StatusBadge";

const COLORS = {
  "Created":      "#9945ff",
  "In Transit":   "#4da6ff",
  "At Warehouse": "#00d4ff",
  "In Customs":   "#ffd700",
  "Delivered":    "#00ff88",
  "Recalled":     "#ff2244",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "0.85rem",
      }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
          {payload[0].name}: {payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

function Dashboard({ blockchainStatus }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = analytics
    ? [
        { label: "Total Products", value: analytics.summary.total, sub: "On blockchain", accent: "var(--accent-cyan)" },
        { label: "In Transit",     value: analytics.summary.inTransit, sub: "Moving now",    accent: "#4da6ff" },
        { label: "Delivered",      value: analytics.summary.delivered, sub: "Completed",     accent: "var(--accent-green)" },
        { label: "Recalled",       value: analytics.summary.recalled,  sub: "Flagged",       accent: "var(--accent-red)" },
      ]
    : [];

  const barData = analytics
    ? [
        { name: "Created",    count: analytics.summary.created },
        { name: "In Transit", count: analytics.summary.inTransit },
        { name: "Warehouse",  count: analytics.summary.atWarehouse },
        { name: "Customs",    count: analytics.summary.inCustoms },
        { name: "Delivered",  count: analytics.summary.delivered },
        { name: "Recalled",   count: analytics.summary.recalled },
      ]
    : [];

  const pieData = analytics
    ? barData.filter((d) => d.count > 0).map((d) => ({
        name: d.name,
        value: d.count,
      }))
    : [];

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>SUPPLY CHAIN OVERVIEW</h1>
        <p>
          Real-time blockchain tracking dashboard ·{" "}
          {analytics && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
              Updated {new Date(analytics.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>

      {/* Blockchain Info Banner */}
      {blockchainStatus?.connected && (
        <div
          style={{
            background: "rgba(0, 212, 255, 0.05)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: "var(--radius)",
            padding: "12px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
          }}
        >
          <span>🔗 Contract: <span style={{ color: "var(--accent-cyan)" }}>{blockchainStatus.address}</span></span>
          <span>Network: <span style={{ color: "var(--accent-cyan)" }}>{blockchainStatus.network}</span></span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ "--accent-color": s.accent }}
          >
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {analytics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {/* Bar Chart */}
          <div className="card">
            <div className="card-title">⬡ Product Status Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name] || "var(--accent-cyan)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card">
            <div className="card-title">◎ Status Breakdown</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#666"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>No product data yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Products Table */}
      <div className="card">
        <div
          className="card-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>⬜ RECENT PRODUCTS</span>
          <Link to="/products/add" className="btn btn-primary btn-sm">
            + Add Product
          </Link>
        </div>

        {analytics?.products?.length > 0 ? (
          <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Status</th>
                  <th>Manufacturer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {analytics.products.slice(-5).reverse().map((p) => (
                  <tr key={p.id}>
                    <td className="td-mono">#{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td className="td-mono">{p.sku}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <span className="addr">
                        {p.manufacturer
                          ? `${p.manufacturer.slice(0, 6)}...${p.manufacturer.slice(-4)}`
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/products/${p.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Track →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No products yet</h3>
            <p>Add your first product to start tracking</p>
            <br />
            <Link to="/products/add" className="btn btn-primary">
              + Add First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
