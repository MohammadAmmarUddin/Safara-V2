import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import "react-tabs/style/react-tabs.css";
import useAuthContext from "../../../hooks/useAuthContext";

const MyClasses = () => {
  const { user } = useAuthContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
  const userId = user?.user?._id;

  const fetchCourses = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    const url = `${baseUrl}/api/course/getAllEnrolledCourse/${userId}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch(() => {
        setCourses([]);
        setLoading(false);
      });
  }, [baseUrl, userId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <span className="loading loading-spinner w-40 h-40 text-white"></span>
      </div>
    );
  }

  return (
    <div className="lg:p-6 pt-10">
      <Helmet>
        <title>My Classes - Safara Learning</title>
        <meta
          name="description"
          content="View and manage all your enrolled courses. Access class details, explore incoming lessons, and continue your learning journey."
        />
      </Helmet>

      <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-5 w-fit">
        {courses?.length > 0 ? (
          courses.map((course) => (
            <div key={course._id} className="border rounded-xl relative">
              <Link to={`/singleCourse/${course?._id}`}>
                <div>
                  <img
                    className="w-full object-cover rounded-xl"
                    src={course?.banner}
                    alt={course?.title}
                  />
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No courses enrolled yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyClasses;
