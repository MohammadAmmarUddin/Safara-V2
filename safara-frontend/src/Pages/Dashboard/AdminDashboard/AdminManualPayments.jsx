import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaEye, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";

const maskSensitive = (value) => {
  if (!value || value.length < 4) return value;
  return "****" + value.slice(-4);
};

const AdminManualPayments = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [declineModal, setDeclineModal] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
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
  }, [activeTab]);

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Approve Payment?",
      text: "This will grant the student course access.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseUrl}/api/manual-payment/approve/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: "" }),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Approved!", text: "Student now has course access." });
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

  const filteredRequests = requests.filter((req) => {
    const name = `${req.userId?.firstname || ""} ${req.userId?.lastname || ""}`.toLowerCase();
    const course = (req.courseId?.title || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || course.includes(term) || req.transactionId?.toLowerCase().includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning gap-1"><FaHourglassHalf /> Pending</span>;
      case "approved":
        return <span className="badge badge-success gap-1"><FaCheckCircle /> Approved</span>;
      case "declined":
        return <span className="badge badge-error gap-1"><FaTimesCircle /> Declined</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case "bkash": return "bKash";
      case "nagad": return "Nagad";
      case "bank": return "Bank";
      default: return method;
    }
  };

  return (
    <div className="min-h-screen p-6">
      <Helmet>
        <title>Manual Payment Requests - Admin</title>
      </Helmet>

      <h1 className="text-3xl font-bold text-primary mb-8">Manual Payment Requests</h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === "pending" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>
        <button
          className={`tab ${activeTab === "approved" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved
        </button>
        <button
          className={`tab ${activeTab === "declined" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("declined")}
        >
          Declined
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search by name, course, or transaction ID..."
          className="pl-10 pr-4 py-2 border rounded-md w-full max-w-md focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner w-20 h-20 text-primary"></span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-2xl">No {activeTab} manual payment requests.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-gray-50">
                <th>#</th>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Sender</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Proof</th>
                {activeTab !== "pending" && <th>Review Note</th>}
                {activeTab === "pending" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, index) => (
                <tr key={req._id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {req.userId?.img && (
                        <div className="avatar">
                          <div className="w-8 h-8 rounded-full">
                            <img src={req.userId.img} alt="" />
                          </div>
                        </div>
                      )}
                      <span className="font-medium">{req.userId?.firstname} {req.userId?.lastname}</span>
                    </div>
                  </td>
                  <td>{req.userId?.email || "N/A"}</td>
                  <td>{req.courseId?.title || "N/A"}</td>
                  <td>{getMethodLabel(req.method)}</td>
                  <td className="font-mono text-sm">{maskSensitive(req.transactionId)}</td>
                  <td className="font-mono text-sm">{maskSensitive(req.senderAccount)}</td>
                  <td className="font-semibold">{req.amountPaid} BDT</td>
                  <td className="text-sm">{new Date(req.submittedAt).toLocaleDateString()}</td>
                  <td>
                    {req.proofImageUrl ? (
                      <a href={req.proofImageUrl} target="_blank" rel="noopener noreferrer">
                        <FaEye className="text-primary cursor-pointer text-lg" />
                      </a>
                    ) : (
                      <span className="text-gray-400">No proof</span>
                    )}
                  </td>
                  {activeTab !== "pending" && (
                    <td className="text-sm max-w-[150px] truncate">{req.reviewNote || "-"}</td>
                  )}
                  {activeTab === "pending" && (
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req._id)}
                          className="btn btn-success btn-xs text-white"
                        >
                          <FaCheckCircle /> Approve
                        </button>
                        <button
                          onClick={() => setDeclineModal(req._id)}
                          className="btn btn-error btn-xs text-white"
                        >
                          <FaTimesCircle /> Decline
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decline Modal */}
      {declineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Decline Payment</h3>
            <p className="text-sm text-gray-600 mb-4">Provide a reason for declining this payment request.</p>
            <textarea
              className="textarea textarea-bordered w-full h-24"
              placeholder="Reason for decline..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setDeclineModal(null); setDeclineReason(""); }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleDecline} className="btn btn-error text-white">
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManualPayments;
