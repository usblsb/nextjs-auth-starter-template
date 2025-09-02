import { auth } from "@clerk/nextjs/server";
import CustomDashboard from "../components/dashboard/custom-dashboard";
import "../styles/pages-dashboard.css";

export default async function DashboardPage() {
  await auth.protect();

  return (
    <div className="dashboard-container">
      <CustomDashboard />
    </div>
  );
}
