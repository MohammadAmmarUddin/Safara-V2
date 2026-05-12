import { Outlet } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";
import DashNavbar from "./UserDashboard/DashNavbar";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <div className="relative">
        <Sidebar />
      </div>
      <div className="flex-1 lg:ml-64 flex flex-col">
        <DashNavbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
