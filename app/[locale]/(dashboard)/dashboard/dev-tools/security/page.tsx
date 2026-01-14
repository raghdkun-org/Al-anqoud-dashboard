/**
 * Security Monitor Dev Tools Page
 *
 * Developer tools for monitoring and auditing application security
 */

import { Metadata } from "next";
import { SecurityDashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Security Monitor | Dev Tools",
  description: "Monitor and audit application security in real-time",
};

export default function SecurityMonitorPage() {
  return <SecurityDashboardContent />;
}
