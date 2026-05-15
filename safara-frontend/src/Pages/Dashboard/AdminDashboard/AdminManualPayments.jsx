import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaEye, FaSearch, FaTrashAlt, FaEdit, FaImage, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import Avatar from "../../../Components/Avatar";

const ITEMS_PER_PAGE = 10;

const AdminManualPayments = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [declineModal, setDeclineModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [editData, setEditData] = useState({ amountPaid: "", transactionId: "", senderAccount: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchRequests = async (status) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/manual-payment/requests?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching manual payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(activeTab);
    setCurrentPage(1);
  }, [activeTab]);

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Approve Payment?",
      text: "This will grant the student course access.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#22c55e",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseUrl}/api/manual-payment/approve/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: "" }),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Approved!", text: "Student now has course access.", timer: 1500 });
        fetchRequests(activeTab);
      } else {
        throw new Error("Failed to approve");
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      Swal.fire({ icon: "error", title: "Reason Required", text: "Please provide a reason for declining." });
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/manual-payment/decline/${declineModal}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: declineReason }),
      });
      if (res.ok) {
        Swal.fire({ icon: "info", title: "Declined", text: "Payment request has been declined." });
        setDeclineModal(null);
        setDeclineReason("");
        fetchRequests(activeTab);
      } else {
        throw new Error("Failed to decline");
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  const handleEdit = (req) => {
    setEditData({
      amountPaid: req.amountPaid || "",
      transactionId: req.transactionId || "",
      senderAccount: req.senderAccount || "",
    });
    setEditModal(req._id);
  };

  const handleSaveEdit = async () => {
    if (!editData.amountPaid || !editData.transactionId || !editData.senderAccount) {
      Swal.fire({ icon: "error", title: "Missing Fields", text: "All fields are required." });
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/manual-payment/update/${editModal}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Updated!", text: "Payment details updated.", timer: 1500 });
        setEditModal(null);
        fetchRequests(activeTab);
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Payment Request?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseUrl}/api/manual-payment/delete/${id}`, { method: "DELETE" });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Deleted!", text: "Payment request removed.", timer: 1500 });
        fetchRequests(activeTab);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  const filteredRequests = requests.filter((req) => {
    const name = `${req.userId?.firstname || ""} ${req.userId?.lastname || ""}`.toLowerCase();
    const course = (req.courseId?.title || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || course.includes(term) || req.transactionId?.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusBadge = (status) => {
    const classes = {
      pending: "badge-warning",
      approved: "badge-success",
      declined: "badge-error",
    };
    const icons = {
      pending: <FaHourglassHalf className="text-xs" />,
      approved: <FaCheckCircle className="text-xs" />,
      declined: <FaTimesCircle className="text-xs" />,
    };
    return (
      <span className={`badge ${classes[status]} gap-1`}>
        {icons[status]} {status}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const styles = {
      bkash: "bg-pink-100 text-pink-700",
      nagad: "bg-orange-100 text-orange-700",
      bank: "bg-blue-100 text-blue-700",
      rocket: "bg-purple-100 text-purple-700",
    };
    return (
      <span className={`badge capitalize ${styles[method] || "bg-gray-100 text-gray-700"}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Helmet>
        <title>Manual Payment Requests - Admin</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-xl">
            <FaSearch className="text-green-600 text-xl" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">Manual Payments</h1>
            <p className="text-gray-500 text-sm">{filteredRequests.length} {activeTab} requests</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, course, transaction..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {["pending", "approved", "declined"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? "bg-white text-primary shadow" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">User</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Course</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Method</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Amount</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Transaction ID</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Sender</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Date</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Status</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3">Proof</th>
                    <th className="text-xs uppercase text-gray-500 font-semibold px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-12 text-gray-500">
                        No {activeTab} requests found
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 border-b border-gray-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={req.userId?.img} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[150px]">
                                {req.userId?.firstname} {req.userId?.lastname}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                {req.userId?.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 truncate block max-w-[150px]">
                            {req.courseId?.title || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{getMethodBadge(req.method)}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-primary">৳{req.amountPaid}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-700">{req.transactionId || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-700">{req.senderAccount || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {new Date(req.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                        <td className="px-4 py-3">
                          {req.proofImageUrl ? (
                            <button
                              onClick={() => setPreviewImage(req.proofImageUrl)}
                              className="btn btn-ghost btn-xs text-primary gap-1"
                            >
                              <FaImage /> View
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(req)} className="btn btn-ghost btn-xs text-blue-600" title="Edit">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDelete(req._id)} className="btn btn-ghost btn-xs text-red-600" title="Delete">
                              <FaTrashAlt />
                            </button>
                            {activeTab === "pending" && (
                              <>
                                <button onClick={() => handleApprove(req._id)} className="btn btn-ghost btn-xs text-green-600" title="Approve">
                                  <FaCheckCircle />
                                </button>
                                <button onClick={() => setDeclineModal(req._id)} className="btn btn-ghost btn-xs text-orange-600" title="Decline">
                                  <FaTimesCircle />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)} of {filteredRequests.length}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-sm btn-ghost"
                  >
                    <FaChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-ghost"}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-sm btn-ghost"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {declineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FaTimesCircle className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Decline Payment</h3>
                <p className="text-sm text-gray-500">Provide a reason</p>
              </div>
            </div>
            <textarea
              className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none resize-none"
              placeholder="Reason for declining..."
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setDeclineModal(null); setDeclineReason(""); }} className="flex-1 btn btn-outline">
                Cancel
              </button>
              <button onClick={handleDecline} className="flex-1 btn btn-error text-white">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FaEdit className="text-blue-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Edit Payment</h3>
                <p className="text-sm text-gray-500">Update details</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                <input type="number" className="w-full px-4 py-2 border rounded-xl outline-none" value={editData.amountPaid} onChange={(e) => setEditData({ ...editData, amountPaid: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Transaction ID</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl outline-none" value={editData.transactionId} onChange={(e) => setEditData({ ...editData, transactionId: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sender Account</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl outline-none" value={editData.senderAccount} onChange={(e) => setEditData({ ...editData, senderAccount: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditModal(null)} className="flex-1 btn btn-outline">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 btn btn-primary text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full">
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white hover:text-gray-200">
              <FaTimesCircle size={28} />
            </button>
            <img src={previewImage} alt="Payment proof" className="w-full rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManualPayments;