import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import TrackProduct from "./pages/TrackProduct";
import AddProduct from "./pages/AddProduct";
import Verify from "./pages/Verify";
import Reports from "./pages/Reports";
import Participants from "./pages/Participants";
import { checkHealth } from "./services/api";
import "./styles/App.css";

function App() {
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await checkHealth();
        setBlockchainStatus(data.blockchain);
      } catch {
        setBlockchainStatus({ connected: false });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-inner">
          <div className="loading-logo">CHAINTRACK</div>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
          <div className="loading-text">Connecting to blockchain...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar blockchainStatus={blockchainStatus} />
      <main className="main-content">
        {!blockchainStatus?.connected && (
          <div className="alert-banner">
            <span className="alert-icon">⚠</span>
            <span>
              Blockchain not connected. Run{" "}
              <code>npx hardhat node</code> then{" "}
              <code>npm run deploy:local</code> and restart the backend.
            </span>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard blockchainStatus={blockchainStatus} />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/products/:id" element={<TrackProduct />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/participants" element={<Participants />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
