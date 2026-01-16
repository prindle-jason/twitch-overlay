import { DashboardClient } from "./DashboardClient";

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new DashboardClient().start();
});
