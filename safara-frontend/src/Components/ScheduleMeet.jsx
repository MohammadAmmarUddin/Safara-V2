import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";
import { FaArrowLeft } from "react-icons/fa";

const ScheduleMeet = () => {
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [students, setStudents] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usersData, setUsersData] = useState([]);
  const location = useLocation();

  const id = location.search.slice(1);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  useEffect(() => {
    if (!id) return;
    const fetchSingleCourse = async () => {
      try {
        const { data } = await axios.get(`${baseUrl}/api/course/getSingleCourse/${id}`);
        if (data) {
          setStudents(data.students || []);
          setCourseTitle(data.title || "Unknown Course");
        }
      } catch (err) {
        setError("Failed to fetch course details.");
      }
    };
    fetchSingleCourse();
  }, [id, baseUrl]);

  useEffect(() => {
    if (students.length === 0) return;

    const fetchUserEmails = async () => {
      try {
        const emails = await Promise.all(
          students.map(async (student) => {
            try {
              const { data } = await axios.get(`${baseUrl}/api/user/singleUser/${student?.studentsId}`);
              return { email: data?.email || null, name: `${data?.firstname || ""} ${data?.lastname || ""}` };
            } catch {
              return null;
            }
          })
        );
        setUsersData(emails.filter(Boolean));
      } catch {
        setError("Failed to fetch user emails.");
      }
    };

    fetchUserEmails();
  }, [students, baseUrl]);

const createMeet = async () => {
    if (!summary || !startTime || !endTime) {
      Swal.fire({ icon: "error", title: "Missing Fields", text: "Please fill in all fields." });
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      Swal.fire({ icon: "error", title: "Invalid Time", text: "End time must be after start time." });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${baseUrl}/api/meet/createMeet`, {
        summary,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      if (data.meetLink) {
        setMeetLink(data.meetLink);
        Swal.fire({ icon: "success", title: "Meet Created!", text: "Google Meet link generated successfully." });

        if (usersData.length > 0 && courseTitle) {
          try {
            await axios.post(`${baseUrl}/api/meet/sendSchedule`, {
              usersData,
              meetLink: data.meetLink,
              courseTitle,
            });
          } catch {
            console.log("Email notification could not be sent");
          }
        }
      } else {
        setError(data.error || "Failed to create Google Meet event.");
      }
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = "Error creating Google Meet event.";
      
      if (errorData?.error) {
        errorMsg = errorData.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      
      if (errorData?.code === 'invalid_grant' || errorMsg.includes('invalid_grant')) {
        Swal.fire({
          icon: "error",
          title: "Google Authorization Error",
          html: `<p>The Google refresh token has expired or been revoked.</p>
                 <p class="text-sm mt-2">To fix this:</p>
                 <ol class="text-left text-sm mt-1 list-decimal ml-4">
                   <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
                   <li>Delete the old OAuth Client</li>
                   <li>Create a new OAuth 2.0 Client ID</li>
                   <li>Generate a new refresh token</li>
                   <li>Update the .env file with new credentials</li>
                 </ol>`
        });
      } else if (errorData?.code === 'invalid_credentials') {
        Swal.fire({ icon: "error", title: "Configuration Error", text: "Please check your Google API credentials in the backend .env file." });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = summary.trim() && startTime && endTime;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>Schedule Google Meet - Safara</title>
        <meta name="description" content="Schedule Google Meet sessions for your Safara courses." />
      </Helmet>

      <div className="max-w-xl mx-auto px-4">
        <Link to="/dashboard/admin/adminHome" className="flex items-center gap-2 text-primary mb-6 hover:underline">
          <FaArrowLeft /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-primary mb-2">Schedule a Google Meet</h1>
          <p className="text-gray-500 mb-6">Create a meeting for: <strong>{courseTitle}</strong></p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
              <input
                type="text"
                placeholder="e.g., Weekly Class Session"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <button
              onClick={createMeet}
              disabled={loading || !isFormValid}
              className={`w-full py-3 rounded-lg text-white font-medium transition ${
                loading || !isFormValid
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {loading ? "Creating Meet..." : "Create Google Meet Event"}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            {meetLink && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">Meet Created Successfully!</h3>
                <p className="text-sm text-gray-600 mb-3">Share this link with your students:</p>
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Join Meeting
                </a>
                <p className="text-xs text-gray-500 mt-2 break-all">{meetLink}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeet;