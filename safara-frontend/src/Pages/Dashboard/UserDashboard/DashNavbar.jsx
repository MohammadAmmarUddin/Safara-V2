import useAuthContext from "../../../hooks/useAuthContext";
import { useLogout } from "../../../hooks/useLogout";
import { Link } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { HiOutlineUser } from "react-icons/hi";
import { FaBars } from "react-icons/fa";

const DashNavbar = () => {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <div className="flex items-center justify-between h-14 md:h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => document.dispatchEvent(new CustomEvent('toggleSidebar'))}>
              <FaBars className="text-lg" />
            </button>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Welcome back, <span className="text-primary">{user?.user?.firstname} {user?.user?.lastname}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Here's what's happening with your courses today.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="flex items-center gap-2 cursor-pointer py-1.5 px-2 sm:px-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-gray-200 overflow-hidden bg-gray-200">
                <img alt="Avatar" src={user?.user?.img || "https://via.placeholder.com/150?text=User"} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.user?.firstname}
              </span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu menu-sm bg-white rounded-xl shadow-lg border border-gray-100 z-[1] mt-2 w-48 p-2"
            >
              <li>
                <Link to="/profile" className="flex items-center gap-2 py-2">
                  <HiOutlineUser className="text-lg" />
                  Profile
                </Link>
              </li>
              <div className="border-t border-gray-100 my-1" />
              <li>
                <a onClick={handleLogout} className="flex items-center gap-2 py-2 text-red-600">
                  <FiLogOut className="text-lg" />
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashNavbar;
