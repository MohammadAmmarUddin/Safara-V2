import { useEffect, useRef, useState } from "react";
import JoditEditor from "jodit-react";
import { RxCross2 } from "react-icons/rx";
import { FaBook, FaTags, FaInfoCircle, FaDollarSign, FaImage, FaVideo, FaUser, FaCode, FaPlus, FaSpinner, FaUpload, FaCheck, FaFilePdf } from "react-icons/fa";
import useAuthContext from "../../../hooks/useAuthContext";
import Swal from "sweetalert2";
import { extractYouTubeVideoId } from "../../../utils/youtubeUtils";

const AddCourses = () => {
  const { user } = useAuthContext();
  const editor = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [magnetLine, setmagnetLine] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [requirements, setRequirements] = useState("");
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("");
  const [content, setContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectInstructors, setSelectInstructors] = useState([]);
  const [selectedInstructors, setSelectedInstructors] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState(["online", "manual"]);
  const [youtubeTitleInput, setYoutubeTitleInput] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completedUploads, setCompletedUploads] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [quizzes, setQuizzes] = useState([
    { question: "", options: ["", "", "", ""], answer: "", selectedAnswer: "" },
  ]);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchAllUsers = () => {
    const url = `${baseUrl}/api/user/allUsers`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setSelectInstructors(data))
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setDropdownVisible(value.length > 0);
  };

  const handleSuggestionClick = (instructor) => {
    if (!selectedInstructors.find((selected) => selected._id === instructor._id)) {
      setSelectedInstructors([...selectedInstructors, instructor]);
    }
    setSearchTerm("");
    setDropdownVisible(false);
  };

  const handleRemoveInstructor = (id) => {
    setSelectedInstructors(selectedInstructors.filter((instructor) => instructor._id !== id));
  };

  const handleAddVideo = (e) => {
    const videoFile = e.target.files[0];
    if (videoFile) {
      setSelectedVideos([...selectedVideos, { videoTitle: videoFile.name, videoFile, videoType: "upload" }]);
    }
  };

  const handleAddYoutubeVideo = () => {
    const url = youtubeUrlInput.trim();
    if (!url) return;
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      Swal.fire({ icon: "error", title: "Invalid YouTube URL", text: "Please enter a valid YouTube video URL." });
      return;
    }
    const title = youtubeTitleInput.trim() || `Lecture ${selectedVideos.length + 1}`;
    setSelectedVideos([...selectedVideos, { videoTitle: title, videoType: "youtube", youtubeUrl: url, youtubeVideoId: videoId, videoLink: url, videoFile: null }]);
    setYoutubeUrlInput("");
    setYoutubeTitleInput("");
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() !== "") {
      setSelectedKeywords([...selectedKeywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const uploadFileToCloudinary = async (file, folder) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    setCompletedUploads((prev) => prev + 1);
    return data.url;
  };

  const handleAddQuiz = () => {
    setQuizzes([...quizzes, { question: "", options: ["", "", "", ""], answer: "", selectedAnswer: "" }]);
  };

  const handleQuizChange = (index, field, value, optionIndex = null) => {
    const newQuizzes = [...quizzes];
    if (field === "option") {
      newQuizzes[index].options[optionIndex] = value;
    } else if (field === "selectedAnswer") {
      newQuizzes[index].selectedAnswer = value;
      newQuizzes[index].answer = optionIndex.toString();
    } else {
      newQuizzes[index][field] = value;
    }
    setQuizzes(newQuizzes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
    setCompletedUploads(0);

    const total = selectedVideos.length + (bannerFile ? 1 : 0) + (pdfFile ? 1 : 0);
    setTotalFiles(total);

    try {
      let bannerURL = "";
      let pdfURL = "";
      const videoURLs = [];

      if (bannerFile) bannerURL = await uploadFileToCloudinary(bannerFile, "images");
      if (pdfFile) pdfURL = await uploadFileToCloudinary(pdfFile, "pdfs");

      for (const video of selectedVideos) {
        if (video.videoType === "youtube") {
          videoURLs.push({ videoTitle: video.videoTitle, videoLink: video.youtubeUrl, videoType: "youtube", youtubeUrl: video.youtubeUrl, youtubeVideoId: video.youtubeVideoId, videoFileUrl: "" });
        } else {
          const videoURL = await uploadFileToCloudinary(video.videoFile, "videos");
          videoURLs.push({ videoTitle: video.videoTitle, videoLink: videoURL, videoType: "upload", youtubeUrl: "", youtubeVideoId: "", videoFileUrl: videoURL });
        }
      }

      const courseData = {
        userId: user?.user?._id,
        title: courseTitle,
        magnetLine: magnetLine,
        details: content,
        requirements,
        whatsappGroupLink,
        instructorsId: selectedInstructors.map((inst) => inst._id),
        banner: bannerURL,
        videos: videoURLs,
        paymentMethods: enabledPaymentMethods,
        category,
        subCategory,
        syllabus: pdfURL,
        keywords: selectedKeywords,
        price,
        discount,
        quizzes: quizzes.map((quiz) => ({ question: quiz.question, options: quiz.options, answer: parseInt(quiz.answer) })),
      };

      const response = await fetch(`${baseUrl}/api/course/createCourse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Course created successfully:", data);
        setUploadProgress(100);
        Swal.fire({ icon: "success", title: "Course Created!", text: "Your course has been successfully created.", confirmButtonText: "OK" }).then(() => {
          window.location.reload();
        });
      } else {
        console.error("Failed to create course:", await response.text());
        Swal.fire({ icon: "error", title: "Error", text: "Failed to create course. Please try again." });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="text-primary text-lg" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  const InputField = ({ label, required, helper, children, className = "" }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-3 sm:px-4">
      {loading ? (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full mx-4 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <FaUpload className="text-primary text-2xl sm:text-3xl animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Creating Your Course</h2>
            <p className="text-gray-500 text-sm mb-6">Please wait while we upload files and process your course...</p>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>{Math.round(uploadProgress)}%</span>
              <span>{completedUploads}/{totalFiles} files</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 justify-center">
              <FaSpinner className="animate-spin" />
              <span>Processing...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <FaBook className="text-white/80 text-lg sm:text-xl" />
                Create New Course
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-1">Fill in all the details to create a new course</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                    <SectionHeader icon={FaInfoCircle} title="Basic Information" subtitle="Core details about your course" />
                    <div className="space-y-4">
                      <InputField label="Course Title" required helper="Enter a catchy and descriptive title">
                        <input type="text" name="courseTitle" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="e.g., Complete Web Development Bootcamp" className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                      </InputField>
                      <InputField label="Magnet Line" helper="A short tagline to attract students">
                        <input type="text" name="magnetLine" value={magnetLine} onChange={(e) => setmagnetLine(e.target.value)} placeholder="e.g., Learn to build modern websites from scratch" className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                      </InputField>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <InputField label="Category" required>
                          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer text-sm sm:text-base">
                            <option value="">Select category</option>
                            <option>Web Development</option>
                            <option>C++</option>
                            <option>Python</option>
                            <option>Sharpe</option>
                          </select>
                        </InputField>
                        <InputField label="Sub Category">
                          <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer text-sm sm:text-base">
                            <option value="">Select sub-category</option>
                            <option>Web Development</option>
                            <option>C++</option>
                            <option>Python</option>
                            <option>Sharpe</option>
                          </select>
                        </InputField>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                    <SectionHeader icon={FaDollarSign} title="Pricing" subtitle="Set your course price and discounts" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <InputField label="Price (৳)" required helper="Course price in Taka">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                        </div>
                      </InputField>
                      <InputField label="Discount (%)" helper="Optional discount percentage">
                        <div className="relative">
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                          <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="w-full px-4 pr-10 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                        </div>
                      </InputField>
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="text-sm font-medium text-gray-700">Payment Methods</label>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
                        <label className="flex items-center gap-2 bg-white p-2.5 sm:p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary/50 transition-colors">
                          <input type="checkbox" checked={enabledPaymentMethods.includes("online")} onChange={(e) => {
                            if (e.target.checked) setEnabledPaymentMethods([...enabledPaymentMethods, "online"]);
                            else setEnabledPaymentMethods(enabledPaymentMethods.filter((m) => m !== "online"));
                          }} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                          <span className="text-sm">Online (SSLCommerz)</span>
                        </label>
                        <label className="flex items-center gap-2 bg-white p-2.5 sm:p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary/50 transition-colors">
                          <input type="checkbox" checked={enabledPaymentMethods.includes("manual")} onChange={(e) => {
                            if (e.target.checked) setEnabledPaymentMethods([...enabledPaymentMethods, "manual"]);
                            else setEnabledPaymentMethods(enabledPaymentMethods.filter((m) => m !== "manual"));
                          }} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                          <span className="text-sm">Manual (bKash/Nagad/Bank)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                    <SectionHeader icon={FaTags} title="Additional Info" subtitle="Requirements and contact" />
                    <div className="space-y-4">
                      <InputField label="Requirements" helper="What students need before taking this course">
                        <input type="text" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="e.g., Basic computer knowledge, Internet connection" className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                      </InputField>
                      <InputField label="WhatsApp Group Link" helper="Join link for course discussion group">
                        <input type="text" value={whatsappGroupLink} onChange={(e) => setWhatsappGroupLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                      </InputField>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                    <SectionHeader icon={FaImage} title="Media & Files" subtitle="Course thumbnail, syllabus and videos" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <InputField label="Course Banner" helper="Recommended: 1200x630px">
                        <label className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-4 sm:pb-6">
                            <FaImage className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                            <p className="text-xs sm:text-sm text-gray-500 text-center px-2">{bannerFile ? bannerFile.name : "Click to upload"}</p>
                          </div>
                          <input type="file" onChange={(e) => setBannerFile(e.target.files[0])} accept="image/*" className="hidden" />
                        </label>
                        {bannerFile && <span className="text-xs text-green-600 mt-1 flex items-center gap-1"><FaCheck /> Selected</span>}
                      </InputField>
                      <InputField label="Syllabus PDF" helper="Course outline document">
                        <label className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-4 sm:pb-6">
                            <FaFilePdf className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                            <p className="text-xs sm:text-sm text-gray-500 text-center px-2">{pdfFile ? pdfFile.name : "Click to upload"}</p>
                          </div>
                          <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} accept="application/pdf" className="hidden" />
                        </label>
                        {pdfFile && <span className="text-xs text-green-600 mt-1 flex items-center gap-1"><FaCheck /> Selected</span>}
                      </InputField>
                    </div>

                    <div className="space-y-4">
                      <InputField label="Upload Video Files" helper="MP4, MOV or other video formats">
                        <label className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <FaVideo className="text-gray-400 text-sm" />
                          <span className="text-sm text-gray-500">Choose video file</span>
                          <input type="file" onChange={handleAddVideo} accept="video/*" className="hidden" />
                        </label>
                      </InputField>

                      <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Or Add YouTube Video</label>
                        <input type="text" value={youtubeTitleInput} onChange={(e) => setYoutubeTitleInput(e.target.value)} placeholder="Video title (e.g., Lecture 1 - Introduction)" className="w-full px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 mb-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" value={youtubeUrlInput} onChange={(e) => setYoutubeUrlInput(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
                          <button type="button" onClick={handleAddYoutubeVideo} className="px-4 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                            <FaPlus className="text-xs sm:text-sm" /> YouTube
                          </button>
                        </div>
                      </div>

                      {selectedVideos.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 max-h-40 sm:max-h-48 overflow-y-auto">
                          <p className="text-sm font-medium text-gray-600 mb-3">Videos ({selectedVideos.length})</p>
                          <div className="space-y-2">
                            {selectedVideos.map((video, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-medium flex-shrink-0">{index + 1}</span>
                                  {video.videoType === "youtube" && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex-shrink-0">YouTube</span>}
                                  {video.videoType === "upload" && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full flex-shrink-0">Upload</span>}
                                  <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[100px] sm:max-w-[150px]">{video.videoTitle}</span>
                                </div>
                                <button type="button" onClick={() => setSelectedVideos(selectedVideos.filter((_, i) => i !== index))} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0">
                                  <RxCross2 />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                    <SectionHeader icon={FaUser} title="Instructors" subtitle="Select course instructors" />
                    <div className="relative">
                      <input type="text" value={searchTerm} onChange={handleInputChange} onFocus={() => setDropdownVisible(searchTerm.length > 0)} onBlur={() => setTimeout(() => setDropdownVisible(false), 100)} placeholder="Search instructors by name..." className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                      {dropdownVisible && (
                        <ul className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 sm:max-h-64 overflow-y-auto">
                          {selectInstructors.filter((instructor) => `${instructor.firstname} ${instructor.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())).map((instructor) => (
                            <li key={instructor._id} onMouseDown={() => handleSuggestionClick(instructor)} className="px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2 sm:gap-3 border-b border-gray-100 last:border-0">
                              <img src={instructor.img || "https://via.placeholder.com/150?text=User"} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" />
                              <span className="text-sm sm:text-base font-medium truncate">{instructor.firstname} {instructor.lastname}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {selectedInstructors.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedInstructors.map((instructor, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <img src={instructor.img || "https://via.placeholder.com/150?text=User"} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{instructor.firstname} {instructor.lastname}</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveInstructor(instructor._id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0">
                              <RxCross2 />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                    <SectionHeader icon={FaCode} title="Keywords" subtitle="Tags to help students find your course" />
                    <div className="flex gap-2">
                      <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())} placeholder="Type a keyword and press Enter" className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                      <button type="button" onClick={handleAddKeyword} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                        <FaPlus className="text-sm sm:text-base" />
                      </button>
                    </div>
                    {selectedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedKeywords.map((keyword, index) => (
                          <span key={index} className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary/10 text-primary rounded-full text-xs sm:text-sm">
                            {keyword}
                            <button type="button" onClick={() => setSelectedKeywords(selectedKeywords.filter((_, i) => i !== index))} className="hover:text-red-500">
                              <RxCross2 className="text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                <SectionHeader icon={FaInfoCircle} title="Course Details" subtitle="Detailed description of your course" />
                <div className="custom-class -z-50 no-tailwind custom-ul custom-ol">
                  <JoditEditor ref={editor} value={content} onChange={(newContent) => setContent(newContent)} />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FaCode className="text-primary text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Quizzes</h3>
                      <p className="text-xs text-gray-500">Add quizzes to test student knowledge</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleAddQuiz} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm w-full sm:w-auto justify-center">
                    <FaPlus className="text-sm" /> Add Quiz
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {quizzes.map((quiz, quizIndex) => (
                    <div key={quizIndex} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <span className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">{quizIndex + 1}</span>
                        <input type="text" value={quiz.question} onChange={(e) => handleQuizChange(quizIndex, "question", e.target.value)} placeholder="Enter your question here..." className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base" />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {quiz.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                            <input type="radio" id={`quiz-${quizIndex}-option-${optionIndex}`} name={`quiz-${quizIndex}-answer`} value={optionIndex} checked={quiz.selectedAnswer === optionIndex.toString()} onChange={(e) => handleQuizChange(quizIndex, "selectedAnswer", e.target.value, optionIndex)} className="w-4 h-4 text-primary focus:ring-primary flex-shrink-0" />
                            <label htmlFor={`quiz-${quizIndex}-option-${optionIndex}`} className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">{String.fromCharCode(97 + optionIndex)}</span>
                              <input type="text" value={option} onChange={(e) => handleQuizChange(quizIndex, "option", e.target.value, optionIndex)} placeholder={`Option ${String.fromCharCode(97 + optionIndex)}`} className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 bg-white focus:border-primary outline-none transition-all text-sm min-w-0" />
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2 sm:mt-3">Select the radio button to mark the correct answer</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center pt-2 sm:pt-4">
                <button type="submit" className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 sm:gap-3 text-sm sm:text-base w-full sm:w-auto justify-center">
                  <FaBook /> Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourses;