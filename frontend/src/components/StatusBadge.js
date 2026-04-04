import React from "react";

const statusMap = {
  "Created":      { class: "badge-created",   dot: "◉", label: "Created" },
  "In Transit":   { class: "badge-transit",   dot: "◉", label: "In Transit" },
  "At Warehouse": { class: "badge-warehouse", dot: "◉", label: "Warehouse" },
  "In Customs":   { class: "badge-customs",   dot: "◉", label: "In Customs" },
  "Delivered":    { class: "badge-delivered", dot: "◉", label: "Delivered" },
  "Recalled":     { class: "badge-recalled",  dot: "◉", label: "Recalled" },
};

function StatusBadge({ status }) {
  const cfg = statusMap[status] || { class: "", dot: "◉", label: status };
  return (
    <span className={`badge ${cfg.class}`}>
      {cfg.dot} {cfg.label}
    </span>
  );
}

export default StatusBadge;
