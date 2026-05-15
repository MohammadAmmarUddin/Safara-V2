import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import useAuthContext from "../hooks/useAuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuthContext();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.user?.role)) {
    const userRole = user.user?.role;
    if (userRole === "admin") {
      return <Navigate to="/dashboard/admin/adminHome" replace />;
    } else {
      return <Navigate to="/dashboard/user/userHome" replace />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;