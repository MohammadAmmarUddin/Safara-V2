import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const AllCourses = () => {
  const [courses, setCourses] = useState([]);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchCourses = () => {
    const url = `${baseUrl}/api/course/getAllCourses`; // Your courses endpoint
    fetch(url)
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="w-11/12 sm:w-3/4 mx-auto pb-20">
      <Helmet>
        <title>All Courses - Safara</title>
        <meta
          name="description"
          content="Explore all courses offered by Safara. Find the perfect course to enhance your skills and knowledge."
        />
        <meta property="og:title" content="All Courses - Safara" />
        <meta
          property="og:description"
          content="Explore all courses offered by Safara. Find the perfect course to enhance your skills and knowledge."
        />
      </Helmet>

      <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 text-center">All Courses</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {courses?.map((course) => (
          <div
            key={course._id}
            className="border rounded-xl relative hover:shadow-lg transition-shadow duration-300 overflow-hidden"
          >
            <Link to={`/singleCourse/${course?._id}`} className="block">
              <img
                className="w-full h-40 sm:h-48 object-cover"
                src={course?.banner}
                alt={course?.title}
              />
              <div className="p-3 sm:p-4">
                <h3 className="font-medium text-sm sm:text-base line-clamp-2">{course?.title}</h3>
                {course?.price && (
                  <p className="text-primary font-semibold mt-2">৳{course?.price}</p>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllCourses;
