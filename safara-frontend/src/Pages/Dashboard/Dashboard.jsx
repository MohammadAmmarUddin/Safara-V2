import { Outlet } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";
import DashNavbar from "./UserDashboard/DashNavbar";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col w-full">
        <DashNavbar />
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
