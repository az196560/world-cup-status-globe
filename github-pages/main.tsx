import React from "react";
import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import { WorldCupDashboard } from "@/app/components/WorldCupDashboard";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(
  <React.StrictMode>
    <WorldCupDashboard />
  </React.StrictMode>,
);

