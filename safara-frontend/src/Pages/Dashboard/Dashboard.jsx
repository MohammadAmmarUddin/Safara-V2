import { Outlet } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";
import DashNavbar from "./UserDashboard/DashNavbar";
import useAuth from "../../hooks/useAuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const localStorageUser = JSON.parse(localStorage.getItem('user'));
  const effectiveRole = user?.user?.role || localStorageUser?.user?.role || "user";

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