import { useState } from "react";
import {
  FaHome,
  FaRegBuilding,
  FaSearch,
  FaTachometerAlt,
  FaUsers,
  FaBars,
  FaUser,
} from "react-icons/fa";
import { MdOutlineFeaturedVideo, MdOutlineFolderSpecial } from "react-icons/md";
import {
  GrDocumentConfig,
  GrDocumentUpdate,
  GrCloudUpload,
} from "react-icons/gr";
import { Link, NavLink, useLocation } from "react-router-dom";
import useAuthContext from "../hooks/useAuthContext";
import { GiPayMoney, GiSettingsKnobs } from "react-icons/gi";
import { FaWhatsapp, FaServer, FaVideo } from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthContext();
  const location = useLocation();
  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const localStorageUser = JSON.parse(localStorage.getItem('user'));
  const effectiveRole = user?.user?.role || localStorageUser?.user?.role || "user";
  
  const isAdmin = effectiveRole === "admin";
  const isUser = effectiveRole === "user";

  const singleCourseRegex = /^\/singleCourse\/[^/]+$/;
  const ICON_SIZE = 16;

  const navLinkStyle = ({ isActive }, path) => {
    const isSingleCoursePage = singleCourseRegex.test(location.pathname);
    const shouldApplyActiveStyle =
      isActive ||
      (isSingleCoursePage && path === "/dashboard/admin/manageCourses");

    return {
      backgroundColor: shouldApplyActiveStyle ? "#125ca6" : "transparent",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: shouldApplyActiveStyle ? "600" : "450",
      whiteSpace: "nowrap",
      color: "white",
      letterSpacing: "0.01em",
      padding: "10px 12px",
      transition: "all 0.15s ease",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      width: "100%",
    };
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 border-2 border-white text-white p-2 rounded-full shadow-lg"
      >
        <FaBars size={24} />
      </button>

      <div
        onClick={closeSidebar}
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Sidebar */}
      <div
        className={`bg-gray-800 text-white h-screen fixed left-0 top-0 bottom-0 w-64 md:w-72 lg:w-64 transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 z-50 flex flex-col overflow-hidden`}
      >
        <div className="p-4 flex-shrink-0">
          <Link to="/">
            <img src="/logo.png" alt="Logo" className="cursor-pointer" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto min-h-0 px-3 pb-4">
          <ul className="menu p-0 space-y-0.5">
            {isAdmin && (
              <div className="space-y-0.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium pb-3 pl-3 mt-1">Admin</div>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/adminHome">
                    <FaTachometerAlt size={ICON_SIZE} />
                    Admin Home
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/addCourses">
                    <GrDocumentUpdate size={ICON_SIZE} />
                    Add Course
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    style={(navData) => navLinkStyle(navData, "/dashboard/admin/manageCourses")}
                    to="/dashboard/admin/manageCourses"
                  >
                    <FaRegBuilding size={ICON_SIZE} />
                    Manage Courses
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/otherProjectUpload">
                    <GrCloudUpload size={ICON_SIZE} />
                    Other Project Upload
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/transactionHistory">
                    <GrDocumentConfig size={ICON_SIZE} />
                    Transaction History
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/manualPayments">
                    <GiPayMoney size={ICON_SIZE} />
                    Manual Payments
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/paymentSettings">
                    <GiSettingsKnobs size={ICON_SIZE} />
                    Payment Settings
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/whatsappSettings">
                    <FaWhatsapp size={ICON_SIZE} />
                    WhatsApp
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/google-meet">
                    <FaVideo size={ICON_SIZE} />
                    Google Meet
                  </NavLink>
                </li>
                
                
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/admin/allUsers">
                    <FaUsers size={ICON_SIZE} />
                    All Users
                  </NavLink>
                </li>
              </div>
            )}

            {isUser && (
              <div className="space-y-0.5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium pb-3 pl-3 mt-1">Dashboard</div>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/user/userHome">
                    <FaTachometerAlt size={ICON_SIZE} />
                    User Home
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/user/userPaymentHistory">
                    <GrDocumentConfig size={ICON_SIZE} />
                    Transaction History
                  </NavLink>
                </li>
                <li>
                  <NavLink style={navLinkStyle} to="/dashboard/user/userCourses">
                    <MdOutlineFeaturedVideo size={ICON_SIZE} />
                    My Classes
                  </NavLink>
                </li>
              </div>
            )}

            <div className="border-t border-gray-700/50 my-3"></div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium pb-2 pl-3 mt-1">General</div>
            <li>
              <NavLink style={navLinkStyle} to="/">
                <FaHome size={ICON_SIZE} />
                Home
              </NavLink>
            </li>
            <li>
              <NavLink style={navLinkStyle} to="/allCourses">
                <FaSearch size={ICON_SIZE} />
                Courses
              </NavLink>
            </li>
            <li>
              <NavLink style={navLinkStyle} to="/others">
                <MdOutlineFolderSpecial size={ICON_SIZE} />
                Others
              </NavLink>
            </li>
            <li>
              <NavLink style={navLinkStyle} to="/profile">
                <FaUser size={ICON_SIZE} />
                Profile
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;