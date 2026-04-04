import React from "react";
import { NavLink, Link } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "⬡" },
  { to: "/products", label: "Products", icon: "⬜" },
  { to: "/verify", label: "Verify", icon: "✓" },
  { to: "/reports", label: "Reports", icon: "⊞" },
  { to: "/participants", label: "Participants", icon: "◎" },
];

function Navbar({ blockchainStatus }) {
  const truncate = (str) =>
    str ? `${str.slice(0, 6)}...${str.slice(-4)}` : "";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-logo">
          CHAIN<span>TRACK</span>
        </Link>

        <ul className="navbar-nav">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar-status">
          <div
            className={`status-dot ${
              blockchainStatus?.connected ? "online" : "offline"
            }`}
          />
          {blockchainStatus?.connected ? (
            <span title={blockchainStatus.address}>
              {truncate(blockchainStatus.address)} · {blockchainStatus.network}
            </span>
          ) : (
            <span style={{ color: "var(--accent-red)" }}>Disconnected</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
