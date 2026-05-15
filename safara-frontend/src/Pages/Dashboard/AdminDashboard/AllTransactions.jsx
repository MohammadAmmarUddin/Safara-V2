import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaSearch, FaMoneyBillWave, FaUsers, FaShoppingCart, FaEdit, FaTrash } from "react-icons/fa";
import { TbCurrencyTaka } from "react-icons/tb";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";

const AllTransactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState({});
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
  const transactionsPerPage = 15;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionsRes, usersRes, coursesRes] = await Promise.all([
          fetch(`${baseUrl}/api/course/getAllTransactions`),
          fetch(`${baseUrl}/api/user/allUsers`),
          fetch(`${baseUrl}/api/course/getAllCourses`),
        ]);

        const [transactionsData, usersData, coursesData] = await Promise.all([
          transactionsRes.json(),
          usersRes.json(),
          coursesRes.json(),
        ]);

        const usersMap = usersData.reduce((acc, user) => {
          acc[user._id] = `${user.firstname} ${user.lastname}`;
          return acc;
        }, {});

        const coursesMap = coursesData.reduce((acc, course) => {
          acc[course._id] = course.title;
          return acc;
        }, {});

        setUsers(usersMap);
        setCourses(coursesMap);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl]);

  const filteredTransactions = transactions.filter((transaction) => {
    const studentName = users[transaction.studentsId] || "";
    const courseName = courses[transaction.courseId] || "";
    const searchTermLower = searchTerm.toLowerCase();

    return (
      studentName.toLowerCase().includes(searchTermLower) ||
      courseName.toLowerCase().includes(searchTermLower) ||
      transaction._id.toLowerCase().includes(searchTermLower)
    );
  });

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (Number(t.payment) || 0), 0);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.payment || "");
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    try {
      const res = await fetch(`${baseUrl}/api/course/updateTransaction/${editingTransaction._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment: Number(editAmount) }),
      });
      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) =>
            t._id === editingTransaction._id ? { ...t, payment: Number(editAmount) } : t
          )
        );
        setEditingTransaction(null);
        Swal.fire({ icon: "success", title: "Updated!", text: "Transaction amount updated.", showConfirmButton: false, timer: 1500 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to update transaction." });
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Transaction?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#125ca6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${baseUrl}/api/course/deleteTransaction/${id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then(() => {
            setTransactions((prev) => prev.filter((t) => t._id !== id));
            Swal.fire({ icon: "success", title: "Deleted!", text: "Transaction removed.", showConfirmButton: false, timer: 1500 });
          })
          .catch(() => {
            Swal.fire({ icon: "error", title: "Error!", text: "Failed to delete transaction." });
          });
      }
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <span className="loading loading-spinner w-16 h-16 text-primary"></span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Helmet>
        <title>Transaction History - Admin Dashboard</title>
        <meta name="description" content="View and manage all course transactions." />
      </Helmet>

      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">Transaction History</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Overview of all payments across all courses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
              <FaMoneyBillWave className="text-lg sm:text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">Total Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <TbCurrencyTaka className="text-base sm:text-lg" />
                {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <FaShoppingCart className="text-lg sm:text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">Transactions</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <FaUsers className="text-lg sm:text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">Students</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {new Set(filteredTransactions.map((t) => t.studentsId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-xs">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, course or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 w-[60px]">#</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Student</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Course</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Transaction ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Date</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Amount</th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                    No transactions found
                  </td>
                </tr>
              ) : (
                currentTransactions.map((transaction, index) => {
                  const dateObj = new Date(transaction.createdAt);
                  return (
                    <tr
                      key={transaction._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {indexOfFirstTransaction + index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-800">
                          {users[transaction.studentsId] || "Unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600 line-clamp-1">
                          {courses[transaction.courseId] || "Unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                          {transaction._id.slice(0, 12)}...
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          <span className="text-gray-400">{dateObj.toLocaleDateString()}</span>
                          <span className="text-gray-300 ml-2">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
                          <TbCurrencyTaka className="text-base" />
                          {Number(transaction.payment).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChevronLeft className="text-xs" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>
      )}

      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">Edit Transaction</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (BDT)</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingTransaction(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTransactions;