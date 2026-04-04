import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../services/api";
import StatusBadge from "../components/StatusBadge";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      p.status.toLowerCase().replace(" ", "") ===
        filter.toLowerCase().replace(" ", "");
    return matchSearch && matchFilter;
  });

  return (
    <div className="fade-in">
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1>PRODUCTS</h1>
          <p>{products.length} products registered on blockchain</p>
        </div>
        <Link to="/products/add" className="btn btn-primary">
          + Register Product
        </Link>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "320px" }}
        />
        <select
          className="form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: "200px" }}
        >
          <option value="all">All Statuses</option>
          <option value="created">Created</option>
          <option value="intransit">In Transit</option>
          <option value="atwarehouse">At Warehouse</option>
          <option value="incustoms">In Customs</option>
          <option value="delivered">Delivered</option>
          <option value="recalled">Recalled</option>
        </select>
        <button onClick={fetchProducts} className="btn btn-secondary">
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
          Loading products from blockchain...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No products found</h3>
          <p>
            {search || filter !== "all"
              ? "Try clearing your filters"
              : "Register your first product on the blockchain"}
          </p>
          {!search && filter === "all" && (
            <div style={{ marginTop: "16px" }}>
              <Link to="/products/add" className="btn btn-primary">
                + Register Product
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Origin</th>
                <th>Status</th>
                <th>Events</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="td-mono">#{p.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {p.manufacturer
                        ? `${p.manufacturer.slice(0, 8)}...`
                        : ""}
                    </div>
                  </td>
                  <td className="td-mono">{p.sku}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{p.origin}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="td-mono">{p.trackingEvents}</td>
                  <td className="td-mono">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        to={`/products/${p.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Track
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Products;
