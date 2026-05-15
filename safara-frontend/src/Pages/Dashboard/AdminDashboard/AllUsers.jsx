import { useState, useEffect } from "react";
import { FaSearch, FaUserShield, FaUserMinus, FaBan, FaCheck, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import { Helmet } from "react-helmet";
import Avatar from "../../../Components/Avatar";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
  const usersPerPage = 12;

  const fetchUsers = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/user/allUsers?page=${page}&limit=${usersPerPage}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      
      // Handle both old (array) and new (object with users) response formats
      if (Array.isArray(data)) {
        setUsers(data);
        setPagination({});
      } else {
        setUsers(data.users || []);
        setPagination(data.pagination || {});
      }
    } catch (error) {
      console.log(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchUsers(1, value);
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: `Delete ${name}?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${baseUrl}/api/user/deleteUser/${id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then(() => {
            Swal.fire({ title: "Deleted!", icon: "success", timer: 1500, showConfirmButton: false });
            fetchUsers(currentPage, searchTerm);
          })
          .catch(() => Swal.fire({ title: "Error!", icon: "error" }));
      }
    });
  };

  const handleMakeAdmin = (id, name) => {
    Swal.fire({
      title: `Make ${name} admin?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#125ca6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, promote",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${baseUrl}/api/user/makeAdmin/${id}`, { method: "PATCH" })
          .then((res) => res.json())
          .then(() => {
            Swal.fire({ title: `${name} is now an admin`, icon: "success", timer: 1500, showConfirmButton: false });
            fetchUsers(currentPage, searchTerm);
          });
      }
    });
  };

  const handleUndoAdmin = (id, name) => {
    Swal.fire({
      title: `Remove ${name} as admin?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#125ca6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, demote",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${baseUrl}/api/user/undoAdmin/${id}`, { method: "PATCH" })
          .then((res) => res.json())
          .then(() => {
            Swal.fire({ title: `${name} is no longer admin`, icon: "success", timer: 1500, showConfirmButton: false });
            fetchUsers(currentPage, searchTerm);
          });
      }
    });
  };

  const handleToggleSuspend = (id, name, currentlySuspended) => {
    const action = currentlySuspended ? "Unsuspend" : "Suspend";
    Swal.fire({
      title: `${action} ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: currentlySuspended ? "#22c55e" : "#eab308",
      cancelButtonColor: "#6b7280",
      confirmButtonText: action,
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${baseUrl}/api/user/updateUser/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSuspended: !currentlySuspended }),
        })
          .then((res) => res.json())
          .then(() => {
            Swal.fire({ title: `${name} ${action.toLowerCase()}ed`, icon: "success", timer: 1500, showConfirmButton: false });
            fetchUsers(currentPage, searchTerm);
          });
      }
    });
  };

  const getInitials = (user) => {
    const first = user.firstname?.[0] || "";
    const last = user.lastname?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Helmet>
        <title>All Users - Admin Dashboard</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">All Users</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{pagination.totalUsers || 0} total users</p>
        </div>
        <div className="relative w-full sm:w-64 md:w-72">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            className="pl-10 pr-4 py-2 sm:py-2.5 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="py-3 sm:py-4 pl-4 sm:pl-6">User</th>
                    <th className="py-3 sm:py-4 px-2">Contact</th>
                    <th className="py-3 sm:py-4 px-2">Role</th>
                    <th className="py-3 sm:py-4 px-2">Status</th>
                    <th className="py-3 sm:py-4 px-2 hidden md:table-cell">Joined</th>
                    <th className="py-3 sm:py-4 pr-4 sm:pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        {searchTerm ? "No users match your search." : "No users found."}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="pl-4 sm:pl-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar src={user.img} alt={`${user.firstname} ${user.lastname}`} size="lg" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.firstname} {user.lastname}</p>
                              <p className="text-xs text-gray-400 font-mono hidden sm:block">ID: {user._id?.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-2">
                          <p className="text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none">{user.email}</p>
                          <p className="text-xs text-gray-400">{user.phone || "-"}</p>
                        </td>
                        <td className="py-3 sm:py-4 px-2">
                          <span className={`badge font-medium text-xs py-1.5 px-2.5 sm:py-2 sm:px-3 ${
                            user.role === "admin" ? "badge-primary" : "badge-ghost"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-2">
                          {user.isSuspended ? (
                            <span className="badge badge-error gap-1 text-xs py-1.5 px-2.5 sm:py-2 sm:px-3"><FaBan className="text-[10px]" /> Suspended</span>
                          ) : (
                            <span className="badge badge-success gap-1 text-xs py-1.5 px-2.5 sm:py-2 sm:px-3"><FaCheck className="text-[10px]" /> Active</span>
                          )}
                        </td>
                        <td className="py-3 sm:py-4 px-2 text-sm text-gray-500 hidden md:table-cell">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                        </td>
                        <td className="pr-4 sm:pr-6 py-3 sm:py-4">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {user.role === "admin" ? (
                              <button
                                onClick={() => handleUndoAdmin(user._id, user.firstname)}
                                className="btn btn-ghost btn-xs text-amber-600 hover:bg-amber-50 whitespace-nowrap"
                                title="Remove admin"
                              >
                                <FaUserMinus className="text-xs" /> <span className="hidden sm:inline">Demote</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMakeAdmin(user._id, user.firstname)}
                                className="btn btn-ghost btn-xs text-primary hover:bg-primary/5 whitespace-nowrap"
                                title="Make admin"
                              >
                                <FaUserShield className="text-xs" /> <span className="hidden sm:inline">Promote</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleSuspend(user._id, user.firstname, user.isSuspended)}
                              className={`btn btn-ghost btn-xs ${user.isSuspended ? "text-green-600 hover:bg-green-50" : "text-yellow-600 hover:bg-yellow-50"}`}
                              title={user.isSuspended ? "Unsuspend" : "Suspend"}
                            >
                              <FaBan className="text-xs" /> <span className="hidden sm:inline">{user.isSuspended ? "Reinstate" : "Suspend"}</span>
                            </button>
                            <button
                              onClick={() => handleDelete(user._id, user.firstname)}
                              className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50"
                              title="Delete user"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.currentPage - 1) * pagination.usersPerPage) + 1} to {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} of {pagination.totalUsers}
                </p>
                <div className="join">
                  <button
                    className="join-item btn btn-sm btn-outline"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <FaChevronLeft />
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`join-item btn btn-sm ${pageNum === pagination.currentPage ? "btn-primary" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="join-item btn btn-sm btn-outline"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllUsers;