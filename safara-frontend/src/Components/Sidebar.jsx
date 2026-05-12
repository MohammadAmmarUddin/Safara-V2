import { useEffect, useState } from "react";
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
import { FaWhatsapp } from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthContext();
  const [currentUser, setCurrentUser] = useState([]);
  const location = useLocation();
  const toggleSidebar = () => setIsOpen(!isOpen);

  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/user/allUsers`);
      const data = await res.json();
      const userData = data.find((u) => u._id === user?.user?._id);
      setCurrentUser(userData || {});
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (user?.user?._id) fetchAllUsers();
  }, [user?.user?._id]);

  const singleCourseRegex = /^\/singleCourse\/[^/]+$/;

  const navLinkStyle = ({ isActive }, path) => {
    const isSingleCoursePage = singleCourseRegex.test(location.pathname);
    const shouldApplyActiveStyle =
      isActive ||
      (isSingleCoursePage && path === "/dashboard/admin/manageCourses");

    return {
      backgroundColor: shouldApplyActiveStyle ? "#125ca6" : "transparent",
      borderRadius: "8px",
      fontSize: "14.5px",
      fontWeight: shouldApplyActiveStyle ? "600" : "450",
      whiteSpace: "nowrap",
      color: "white",
      letterSpacing: "0.01em",
      padding: "10px 12px",
      transition: "all 0.15s ease",
    };
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 border-2 border-white text-white p-2 rounded-full shadow-lg"
      >
        <FaBars size={24} />
      </button>

      {/* Overlay for mobile */}
      <div
        onClick={toggleSidebar}
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Sidebar */}
      <div
        className={`bg-gray-800 text-white h-screen fixed left-0 top-0 bottom-0 w-64 transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 z-50`}
      >
        <div className="w-60 p-4">
          {/* ✅ Wrap your logo in a Link */}
          <Link to="/">
            <img src="/logo.png" alt="Logo" className="cursor-pointer" />
          </Link>
        </div>
        <ul className="menu p-4 space-y-0.5">
          {currentUser?.role === "admin" && (
            <>
              <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium pb-3 pl-3 mt-1">Admin</div>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/admin/adminHome">
                  <FaTachometerAlt />
                  Admin Home
                </NavLink>
              </li>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/admin/addCourses">
                  <GrDocumentUpdate />
                  Add Course
                </NavLink>
              </li>
              <li>
                <NavLink
                  style={(navData) =>
                    navLinkStyle(navData, "/dashboard/admin/manageCourses")
                  }
                  to="/dashboard/admin/manageCourses"
                >
                  <FaRegBuilding />
                  Manage Courses
                </NavLink>
              </li>
              <li>
                <NavLink
                  style={navLinkStyle}
                  to="/dashboard/admin/otherProjectUpload"
                >
                  <GrCloudUpload />
                  Other Project Upload
                </NavLink>
              </li>
              <li>
                <NavLink
                  style={navLinkStyle}
                  to="/dashboard/admin/transactionHistory"
                >
                  <GrDocumentConfig />
                  Transaction History
                </NavLink>
              </li>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/admin/manualPayments">
                  <GiPayMoney />
                  Manual Payments
                </NavLink>
              </li>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/admin/paymentSettings">
                  <GiSettingsKnobs />
                  Payment Settings
                </NavLink>
              </li>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/admin/whatsappSettings">
                  <FaWhatsapp />
                  WhatsApp
                </NavLink>
              </li>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/admin/allUsers">
                  <FaUsers />
                  All Users
                </NavLink>
              </li>
            </>
          )}

          {currentUser?.role === "user" && (
            <>
              <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium pb-3 pl-3 mt-1">Dashboard</div>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/user/userHome">
                  <FaTachometerAlt />
                  User Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  style={navLinkStyle}
                  to="/dashboard/user/userPaymentHistory"
                >
                  <GrDocumentConfig />
                  Transaction History
                </NavLink>
              </li>
              <li>
                <NavLink style={navLinkStyle} to="/dashboard/user/userCourses">
                  <MdOutlineFeaturedVideo />
                  My Classes
                </NavLink>
              </li>
            </>
          )}

          <div className="border-t border-gray-700/50 my-3"></div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium pb-2 pl-3 mt-1">General</div>
          <li>
            <NavLink style={navLinkStyle} to="/">
              <FaHome />
              Home
            </NavLink>
          </li>
          <li>
            <NavLink style={navLinkStyle} to="/allCourses">
              <FaSearch />
              Courses
            </NavLink>
          </li>
          <li>
            <NavLink style={navLinkStyle} to="/others">
              <MdOutlineFolderSpecial />
              Others
            </NavLink>
          </li>
          <li>
            <NavLink style={navLinkStyle} to="/profile">
              <FaUser />
              Profile
            </NavLink>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
