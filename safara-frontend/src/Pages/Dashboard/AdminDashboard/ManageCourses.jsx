import { useCallback, useEffect, useMemo, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { MdEdit, MdPeople } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleDropdown, setVisibleDropdown] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  // ✅ Stable fetch functions with useCallback to avoid stale closures
  const fetchCourses = useCallback(() => {
    setLoading(true);
    fetch(`${baseUrl}/api/course/getAllCourses`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch courses:", error);
        setCourses([]);
        setLoading(false);
      });
  }, [baseUrl]);

  const fetchAllUsers = useCallback(() => {
    fetch(`${baseUrl}/api/user/allUsers`)
      .then((res) => res.json())
      .then((data) => setAllUsers(data.users || []))
      .catch((error) => console.error("Failed to fetch users:", error));
  }, [baseUrl]);

useEffect(() => {
    fetchCourses();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".dropdown-container")) {
        setVisibleDropdown(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <div className="lg:p-6 pt-10">
      <Helmet>
        <title>Manage Courses - Admin Dashboard</title>
        <meta
          name="description"
          content="Admin dashboard to view, update, and delete all courses."
        />
      </Helmet>

      <h1 className="text-3xl font-bold text-primary mb-8">Manage Courses</h1>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">No courses found.</p>
      ) : (
        <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-5 w-fit relative z-10">
          {courses.map((course) => (
            <div key={course._id} className="border rounded-xl relative">
              <Link to={`/singleCourse/${course._id}`}>
                <img
                  className="w-full object-cover rounded-xl"
                  src={course.banner}
                  alt={course.title}
                />
              </Link>

              {/* ✅ Dropdown — structure is now correct and self-contained */}
              <div className="absolute right-4 top-4 dropdown-container">
                <BsThreeDots
                  className="bg-primary border cursor-pointer text-white absolute right-0 p-1 text-3xl rounded-full"
                  onClick={(e) => toggleDropdown(course._id, e)}
                />
                {visibleDropdown === course._id && (
                  <div className="border bg-white w-52 p-3 rounded-md absolute right-0 top-10 z-10">
                    <div
                      onClick={() => {
                        openStudentsModal(course);
                        setVisibleDropdown(null);
                      }}
                      className="cursor-pointer flex gap-3 hover:bg-slate-200 p-2 rounded-md"
                    >
                      <MdPeople className="p-1 text-2xl bg-primary text-white rounded-full" />
                      <p>Manage Students</p>
                    </div>
                    <Link
                      to={`/dashboard/admin/updateCourse/${course._id}`}
                      className="cursor-pointer flex gap-3 hover:bg-slate-200 p-2 rounded-md"
                    >
                      <MdEdit className="p-1 text-2xl bg-primary text-white rounded-full" />
                      <p>Update Course</p>
                    </Link>
                    <div
                      onClick={() => handleDelete(course._id)}
                      className="cursor-pointer flex gap-3 hover:bg-slate-200 p-2 rounded-md"
                    >
                      <RiDeleteBin5Line className="p-1 text-2xl bg-primary text-white rounded-full" />
                      <p>Delete Course</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Students Modal */}
      {showStudentsModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-primary">
                Students in: {selectedCourse.title}
              </h2>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {enrolledStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No students enrolled in this course yet.
                </p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-3 text-left">Student</th>
                      <th className="p-3 text-left">Payment</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((student) => (
                      <tr key={student.studentsId} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                              {getUserName(student.studentsId)[0]}
                            </div>
                            <div>
                              <p className="font-medium">
                                {getUserName(student.studentsId)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {student.studentsId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              student.paymentComplete
                                ? "bg-green-100 text-green-700"
                                : student.paymentStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {student.paymentComplete
                              ? "Paid"
                              : student.paymentStatus || "Unpaid"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() =>
                              handleRemoveStudent(
                                selectedCourse._id,
                                student.studentsId,
                              )
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
