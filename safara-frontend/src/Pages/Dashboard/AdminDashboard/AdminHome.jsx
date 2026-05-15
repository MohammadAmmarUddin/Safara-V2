import { useEffect, useState } from "react";
import {
  FaUsers,
  FaBookOpen,
  FaUserGraduate,
  FaChartLine,
  FaStar,
  FaCheckCircle,
  FaServer,
  FaDatabase,
  FaEnvelope,
  FaCloud,
  FaCreditCard,
  FaCheck,
} from "react-icons/fa";
import { TbCurrencyTaka } from "react-icons/tb";
import { Helmet } from "react-helmet";

const AdminDashboard = () => {
  const [countUsers, setCountUsers] = useState({ usersCount: 0 });
  const [enrolledUsers, setEnrolledUsers] = useState({ totalEnrolledStudents: 0 });
  const [courseCount, setCourseCount] = useState({ courseCount: 0 });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAvgRating, setTotalAvgRating] = useState(0);
  const [courseCategories, setCoursesCategories] = useState([]);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [usersRes, coursesRes, enrolledRes, revenueRes, categoriesRes, ratingRes, completedRes] = 
          await Promise.all([
            fetch(`${baseUrl}/api/user/allUsersCount`).then(r => r.json()),
            fetch(`${baseUrl}/api/course/getCourseCount`).then(r => r.json()),
            fetch(`${baseUrl}/api/course/enrolledUsersCourses`).then(r => r.json()),
            fetch(`${baseUrl}/api/course/getTotalPayment`).then(r => r.json()),
            fetch(`${baseUrl}/api/course/getCourseCategories`).then(r => r.json()),
            fetch(`${baseUrl}/api/course/getAvgRating`).then(r => r.json()),
            fetch(`${baseUrl}/api/course/getCompletedCoursesCount`).then(r => r.json()),
          ]);

        setCountUsers({ usersCount: usersRes.usersCount || 0 });
        setCourseCount({ courseCount: coursesRes.courseCount || 0 });
        setEnrolledUsers({ totalEnrolledStudents: enrolledRes.totalEnrolledStudents || 0 });
        setTotalRevenue(revenueRes.totalPayment || 0);
        setCoursesCategories(categoriesRes.categories || []);
        setTotalAvgRating(ratingRes.avgRating || 0);
        setCompletedCoursesCount(completedRes.totalCompletedCourses || 0);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Helmet>
        <title>Admin Dashboard - Safara Learning</title>
        <meta name="description" content="Admin Dashboard to monitor users, courses, revenue, ratings, and course categories." />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s your platform overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-6">
        <StatCard 
          icon={<FaUsers className="text-lg sm:text-xl" />} 
          title="Total Users" 
          value={countUsers?.usersCount ?? 0}
          color="blue"
        />
        <StatCard 
          icon={<FaBookOpen className="text-lg sm:text-xl" />} 
          title="Courses" 
          value={courseCount?.courseCount ?? 0}
          color="purple"
        />
        <StatCard 
          icon={<FaUserGraduate className="text-lg sm:text-xl" />} 
          title="Enrolled" 
          value={enrolledUsers?.totalEnrolledStudents ?? 0}
          color="green"
        />
        <StatCard 
          icon={<FaChartLine className="text-lg sm:text-xl" />} 
          title="Revenue" 
          value={
            <div className="flex items-center gap-1">
              <span className="text-lg sm:text-xl">{totalRevenue?.toLocaleString() || 0}</span>
              <TbCurrencyTaka className="text-base sm:text-lg" />
            </div>
          }
          color="orange"
          isCustomValue
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Course Categories */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 md:p-6">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">Course Categories</h2>
          <div className="space-y-3 sm:space-y-4">
            {courseCategories?.length > 0 ? (
              courseCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm sm:text-base text-gray-700">{category.name || category.category || "Unknown"}</span>
                  <span className="px-2.5 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium">
                    {category.count || 0}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FaBookOpen className="mx-auto text-3xl mb-2 opacity-50" />
                <p className="text-sm">No categories found</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Overview & System Health */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 md:p-6">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">Platform Overview</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 mb-5">
            <MetricCard 
              icon={<FaStar className="text-yellow-500" />} 
              title="Avg Rating" 
              value={totalAvgRating?.toFixed(1) || "0.0"}
              suffix="/ 5"
            />
            <MetricCard 
              icon={<FaCheckCircle className="text-green-500" />} 
              title="Completed" 
              value={completedCoursesCount || 0}
              suffix="courses"
            />
          </div>

          {/* System Health Status */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FaServer className="text-primary" />
              System Health
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FaDatabase className="text-green-500 text-sm" />
                <span className="text-xs text-gray-600">MongoDB</span>
                <FaCheck className="text-green-500 text-xs ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FaServer className="text-green-500 text-sm" />
                <span className="text-xs text-gray-600">API</span>
                <FaCheck className="text-green-500 text-xs ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FaEnvelope className="text-green-500 text-sm" />
                <span className="text-xs text-gray-600">Email</span>
                <FaCheck className="text-green-500 text-xs ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FaCloud className="text-green-500 text-sm" />
                <span className="text-xs text-gray-600">Cloudinary</span>
                <FaCheck className="text-green-500 text-xs ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FaCreditCard className="text-green-500 text-sm" />
                <span className="text-xs text-gray-600">SSLCommerz</span>
                <FaCheck className="text-green-500 text-xs ml-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FaCreditCard className="text-green-500 text-sm" />
                <span className="text-xs text-gray-600">Manual Pay</span>
                <FaCheck className="text-green-500 text-xs ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

const StatCard = ({ icon, title, value, color, isCustomValue }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 md:p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            {isCustomValue ? value : <span className="text-lg sm:text-xl md:text-2xl">{value}</span>}
          </div>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, suffix }) => (
  <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
        <div className="text-base sm:text-lg">{icon}</div>
      </div>
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
          {suffix && <span className="text-xs sm:text-sm text-gray-400">{suffix}</span>}
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;