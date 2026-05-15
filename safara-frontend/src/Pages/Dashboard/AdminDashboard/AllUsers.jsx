import { useState, useEffect } from "react";
import { FaSearch, FaUserShield, FaUserMinus, FaBan, FaCheck, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Helmet } from "react-helmet";

const AllUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
  const usersPerPage = 12;

  const fetchAllUsers = () => {
    fetch(`${baseUrl}/api/user/allUsers`)
      .then((res) => res.json())
      .then(setAllUsers)
      .catch(console.log);
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

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
            fetchAllUsers();
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
            fetchAllUsers();
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
            fetchAllUsers();
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
            fetchAllUsers();
          });
      }
    });
  };

  const filtered = allUsers.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      `${u.firstname} ${u.lastname}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / usersPerPage);
  const start = (currentPage - 1) * usersPerPage;
  const current = filtered.slice(start, start + usersPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Helmet>
        <title>All Users - Admin Dashboard</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">All Users</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{allUsers.length} total users</p>
        </div>
        <div className="relative w-full sm:w-64 md:w-72">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 sm:py-2.5 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="py-4 pl-6">User</th>
                <th className="py-4">Contact</th>
                <th className="py-4">Role</th>
                <th className="py-4">Status</th>
                <th className="py-4">Joined</th>
                <th className="py-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    {searchTerm ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              )}
              {current.map((user) => (
                <tr key={user._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full ring-1 ring-gray-200 overflow-hidden bg-gray-100">
                          {user.img ? (
                            <img src={user.img} alt="" className="object-cover w-full h-full" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                          ) : null}
                          <div className={`w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium text-sm ${user.img ? 'hidden' : ''}`}>
                            {user.firstname?.[0]}{user.lastname?.[0]}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.firstname} {user.lastname}</p>
                        {user._id && <p className="text-xs text-gray-400 font-mono">ID: {user._id.slice(-6)}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.phone || "-"}</p>
                  </td>
                  <td className="py-4">
                    <span className={`badge font-medium text-xs py-2 px-3 ${
                      user.role === "admin" ? "badge-primary" : "badge-ghost"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4">
                    {user.isSuspended ? (
                      <span className="badge badge-error gap-1 text-xs py-2 px-3"><FaBan /> Suspended</span>
                    ) : (
                      <span className="badge badge-success gap-1 text-xs py-2 px-3"><FaCheck /> Active</span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                  </td>
                  <td className="pr-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {user.role === "admin" ? (
                        <button
                          onClick={() => handleUndoAdmin(user._id, user.firstname)}
                          className="btn btn-ghost btn-xs text-amber-600 hover:bg-amber-50"
                          title="Remove admin"
                        >
                          <FaUserMinus /> Demote
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMakeAdmin(user._id, user.firstname)}
                          className="btn btn-ghost btn-xs text-primary hover:bg-primary/5"
                          title="Make admin"
                        >
                          <FaUserShield /> Promote
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleSuspend(user._id, user.firstname, user.isSuspended)}
                        className={`btn btn-ghost btn-xs ${user.isSuspended ? "text-green-600 hover:bg-green-50" : "text-yellow-600 hover:bg-yellow-50"}`}
                        title={user.isSuspended ? "Unsuspend" : "Suspend"}
                      >
                        <FaBan /> {user.isSuspended ? "Reinstate" : "Suspend"}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id, user.firstname)}
                        className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50"
                        title="Delete user"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="join">
            <button
              className="join-item btn btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn btn-sm ${page === currentPage ? "btn-primary" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="join-item btn btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
