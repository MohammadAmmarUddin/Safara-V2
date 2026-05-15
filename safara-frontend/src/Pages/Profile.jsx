import useAuthContext from "../hooks/useAuthContext";
import { MdEdit, MdPerson, MdEmail, MdPhone, MdLocationOn, MdCake, MdWc } from "react-icons/md";
import { FaMedal, FaGraduationCap, FaBriefcase } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const Profile = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0);
  const [userData, setUserData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchSingleUser = () => {
    const url = `${baseUrl}/api/user/singleUser/${user?.user?._id}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch((error) => console.log(error));
  };

  const fetchEnrolledCourses = () => {
    const url = `${baseUrl}/api/course/getAllEnrolledCourse/${user?.user?._id}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setEnrolledCourses(data.courses))
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    if (user?.user?._id) {
      fetchSingleUser();
      fetchEnrolledCourses();
    }
  }, [user?.user?._id]);

  if (!userData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <span className="loading loading-spinner w-16 h-16 text-primary"></span>
      </div>
    );
  }

  const fullName = `${userData.firstname} ${userData.lastname}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Helmet>
        <title>{fullName} | Profile | Safara LMS</title>
        <meta name="description" content={`View profile of ${fullName} on Safara Learning Center.`} />
      </Helmet>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 relative">
          <Link
            to="/updateProfile"
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
          >
            <MdEdit className="text-lg" />
            Edit Profile
          </Link>
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 -mt-20 relative">
            <div className="shrink-0">
              <div className="w-36 h-36 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {userData.img ? (
                  <img
                    className="w-full h-full object-cover"
                    src={userData.img}
                    alt={fullName}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-indigo-600 ${userData.img ? 'hidden' : ''}`}>
                  <MdPerson className="text-5xl text-white/80" />
                </div>
              </div>
            </div>
            <div className="flex-1 pt-16 sm:pt-0 sm:self-end">
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-lg text-gray-500 mt-1">{userData.profession?.[0]?.position || "Student"}</p>
            </div>
          </div>

          <div className="flex gap-6 mt-8 border-b border-gray-100">
            <button
              onClick={() => setActiveTab(0)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === 0
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <MdPerson className="text-lg" />
              About
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === 1
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <FaMedal className="text-lg" />
              Certificates
            </button>
          </div>

          {activeTab === 0 && (
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">Contact Info</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <MdEmail className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm font-medium text-gray-800">{userData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <MdPhone className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-800">{userData.phone || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <MdLocationOn className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-sm font-medium text-gray-800">{userData.location || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">Personal Info</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                        <MdCake className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Birthday</p>
                        <p className="text-sm font-medium text-gray-800">{userData.birthday || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <MdWc className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Gender</p>
                        <p className="text-sm font-medium text-gray-800">{userData.gender || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">Professional Info</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <FaBriefcase className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Position</p>
                        <p className="text-sm font-medium text-gray-800">{userData.profession?.[0]?.position || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                        <FaGraduationCap className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Institution</p>
                        <p className="text-sm font-medium text-gray-800">{userData.institution || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">Educational History</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                        <FaGraduationCap className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Degree</p>
                        <p className="text-sm font-medium text-gray-800">{userData.degree || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <FaMedal className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Result</p>
                        <p className="text-sm font-medium text-gray-800">{userData.result || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="mt-8">
              {enrolledCourses?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((course) => {
                    const isUserCompleted = course.students.some(
                      (student) =>
                        student.studentsId === user.user._id &&
                        student.isCourseComplete &&
                        student.isQuizComplete
                    );

                    return (
                      <div
                        key={course._id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                      >
                        <div className="relative overflow-hidden">
                          <div className="h-40 w-full bg-gradient-to-br from-primary/10 to-indigo-100 flex items-center justify-center">
                            {course.banner ? (
                              <img
                                src={course.banner}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                alt={course.title}
                              />
                            ) : (
                              <FaMedal className="text-4xl text-primary/30" />
                            )}
                          </div>
                          <div className="absolute top-3 left-3">
                            <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full text-gray-700">
                              {course.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2">
                            {course.title}
                          </h3>
                          {isUserCompleted ? (
                            <Link
                              to="/dashboard/user/userCertificate"
                              state={{
                                courseTitle: course.title,
                                studentId: user?.user?._id,
                              }}
                              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              <FaMedal />
                              Download Certificate
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2.5 rounded-lg text-sm font-medium">
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                              In Progress
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaMedal className="text-2xl text-gray-300" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-400">No certificates yet</h4>
                  <p className="text-sm text-gray-400 mt-1">Enroll in a course and complete it to earn your certificate.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
