import { useState, useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { IoMdDownload } from "react-icons/io";
import {
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaWhatsapp,
  FaYoutube,
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaMoneyBillWave,
} from "react-icons/fa";
import { PiExam } from "react-icons/pi";
import Navbar from "./Navbar";
import { MdOutlineSlowMotionVideo } from "react-icons/md";
import { GoNote } from "react-icons/go";
import { TbCurrencyTaka, TbLivePhoto } from "react-icons/tb";
import Footer from "./Footer";
import { FaRegCirclePlay } from "react-icons/fa6";
import useAuthContext from "../hooks/useAuthContext";
import Swal from "sweetalert2";
import ReactHtmlParser from "react-html-parser";
import { Helmet } from "react-helmet";
import { extractYouTubeVideoId } from "../utils/youtubeUtils";

const SingleCourse = () => {
  const { id } = useParams();

  const courseId = id;

  console.log("courseId", courseId);
  const { user } = useAuthContext();
  // const [isInstructor, setIsInstructor] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [reletedCourses, setreletedCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isAdminOrStudent, setIsAdminOrStudent] = useState(false);
  const [rating, setRating] = useState(null);
  const [comments, setComments] = useState("");
  const [unlockedVideos, setUnlockedVideos] = useState(1);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [courseComplete, setCourseComplete] = useState(false);
  // NEW FEATURE: Manual payment state
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualPayMethod, setManualPayMethod] = useState("bkash");
  const [manualTransactionId, setManualTransactionId] = useState("");
  const [manualSenderAccount, setManualSenderAccount] = useState("");
  const [manualAmountPaid, setManualAmountPaid] = useState("");
  const [manualProofImage, setManualProofImage] = useState(null);
  const [manualPaymentStatus, setManualPaymentStatus] = useState(null);
  const [submittingManualPayment, setSubmittingManualPayment] = useState(false);
  const [hasContentAccess, setHasContentAccess] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  // const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const userId = user?.user?._id;

  const studentsOpinionCarouselRef = useRef(null);
  const reletedCoursesCarouselRef = useRef(null);

  const discountAmount =
    courseData?.price && courseData?.discount
      ? (parseInt(courseData.price) * parseInt(courseData.discount)) / 100
      : 0;
  const finalPrice = courseData?.price
    ? parseInt(courseData.price) - discountAmount
    : null;

  useEffect(() => {
    if (courseData && courseData.students && userId) {
      const currentStudent = courseData.students.find(
        (student) => student.studentsId === userId
      );

      if (currentStudent) {
        setIsAdminOrStudent(true);
        setUnlockedVideos(currentStudent.unlockedVideo || 1);
        setCourseComplete(
          currentStudent.unlockedVideo === courseData.videos.length
        );
        // NEW FEATURE: Check payment status for manual payments
        const isPaymentComplete = currentStudent.paymentComplete || currentStudent.paymentStatus === "approved";
        const isAdminOrInstructor = user?.user?.role === "admin" || courseData.instructorsId?.includes(userId);
        if (isPaymentComplete || isAdminOrInstructor) {
          setHasContentAccess(true);
        } else {
          setHasContentAccess(false);
          if (currentStudent.paymentStatus) {
            setManualPaymentStatus(currentStudent.paymentStatus);
          }
        }
      } else {
        setIsAdminOrStudent(false);
        setHasContentAccess(false);
        setUnlockedVideos(1);
      }
    }
  }, [courseData, userId]);
  const [searchParams, setSearchParams] = useSearchParams();

  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const tranId = searchParams.get("tran_id");
    if (paymentStatus === "success" && tranId) {
      Swal.fire({
        icon: "success",
        title: "Payment Successful!",
        text: "Your payment was successful. You now have access to the course content.",
        confirmButtonText: "OK",
      });
      sessionStorage.removeItem("lastRoute");
    } else if (paymentStatus === "failed") {
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: "Your payment was not completed. Please try again.",
        confirmButtonText: "OK",
      });
    } else if (paymentStatus === "cancelled") {
      const lastRoute = sessionStorage.getItem("lastRoute");
      Swal.fire({
        icon: "warning",
        title: "Payment Cancelled",
        text: "You cancelled the payment process.",
        confirmButtonText: "OK",
      }).then(() => {
        if (lastRoute && lastRoute !== window.location.pathname) {
          window.location.href = lastRoute;
        }
      });
    }
    if (paymentStatus) {
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const courseCompleteAction = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/course/completeCourse/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ _id: courseData._id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete the course");
      }

      console.log("Course completed successfully:", data);

      Swal.fire({
        title: "Congratulations!",
        text: "You have completed the course!",
        icon: "success",
        confirmButtonText: "OK",
      });

      setCourseComplete(true);
      fetchSingleCourse();
    } catch (error) {
      console.error("Error completing the course:", error);
      Swal.fire({
        title: "Error",
        text:
          error.message || "Failed to complete the course. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const downloadFiteAtURL = (url) => {
    const fileName = url?.split("/").pop().split("?")[0];
    const aTag = document.createElement("a");
    aTag.href = url;
    aTag.setAttribute("download", fileName);
    document.body.appendChild(aTag);
    aTag.click();
    aTag.remove();
  };
  const unlockNextVideo = async () => {
    if (unlockedVideos < courseData.videos.length) {
      try {
        const response = await fetch(
          `${baseUrl}/api/course/unlockVideo/${userId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ _id: courseData._id }),
          }
        );
        if (response.ok) {
          const newUnlockedVideos = unlockedVideos + 1;
          setUnlockedVideos(newUnlockedVideos);
          if (newUnlockedVideos === courseData.videos.length) {
            setCourseComplete(true);
          }
        } else {
          console.error("Failed to unlock next video");
        }
      } catch (error) {
        console.error("Error unlocking video:", error);
      }
    }
  };

  const handleRatingClick = (rate) => {
    setRating(rate);
  };

  const handleSubmitRating = async () => {
    const url = `${baseUrl}/api/course/giveRating/${courseData._id}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewerId: userId,
          rating: rating.toString(),
          comments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.message === "An user cannot give multiple reviews") {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: data.message,
          });
        } else {
          throw new Error("Failed to submit rating");
        }
      } else {
        const data = await response.json();
        console.log("Rating submitted successfully", data);
        Swal.fire({
          icon: "success",
          title: "Thank You",
          text: "Your review is submitted successfully",
        });
        fetchSingleCourse();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const fetchSingleCourse = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/course/getSingleCourse/${id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch course");
      }
      const data = await response.json();
      setCourseData(data);
      setSelectedVideo(data.videos[0]);
      setQuizzes(
        data.quiz?.map((q) => ({
          ...q,
          selectedAnswer: null,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };

  const fetchreletedCourses = () => {
    const url = `${baseUrl}/api/course/getAllCourses`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const courseKeywords = courseData?.keywords?.map((keyword) =>
          keyword?.toLowerCase().trim()
        );
        const filteredCourses = data?.filter((course) =>
          course?.keywords?.some((keyword) =>
            courseKeywords?.includes(keyword?.toLowerCase().trim())
          )
        );
        setreletedCourses(filteredCourses);
      })
      .catch((error) => console.log(error));
  };

  const fetchAllUsers = () => {
    const url = `${baseUrl}/api/user/allUsers`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setAllUsers(data);
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    fetchSingleCourse();
    fetchAllUsers();
    // NEW FEATURE: Fetch payment settings
    fetch(`${baseUrl}/api/payment-settings`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setPaymentSettings(data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (courseData && courseData.videos && !selectedVideo) {
      setSelectedVideo(courseData.videos[0]);
    }
    if (courseData && courseData.keywords) {
      fetchreletedCourses();
    }
  }, [courseData]);

  const handleVideoSelect = (video, index) => {
    if (!showQuiz) {
      setSelectedVideo(video);
      setCurrentVideoIndex(index);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  const calculateAverageRating = () => {
    if (
      !courseData?.studentsOpinion ||
      courseData.studentsOpinion.length === 0
    ) {
      return 0;
    }

    const totalRating = courseData?.studentsOpinion?.reduce(
      (acc, opinion) => acc + parseInt(opinion.rating),
      0
    );

    const averageRating = totalRating / courseData.studentsOpinion.length;

    return parseFloat(averageRating.toFixed(1));
  };

  const renderStars = (averageRating) => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.25 && averageRating % 1 < 0.75;
    const emptyStars = 5 - Math.ceil(averageRating);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }

    if (halfStar) {
      stars.push(<FaStarHalfAlt key={fullStars} className="text-yellow-400" />);
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={fullStars + i + 1} className="text-yellow-400" />
      );
    }

    return stars;
  };

  const handleQuizChange = (quizIndex, value) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].selectedAnswer = value;
    setQuizzes(updatedQuizzes);
  };

  const handleQuizOpen = () => {
    setShowQuiz(true);
    setSelectedVideo(null);
  };

  const handleQuizSubmit = () => {
    let newScore = 0;
    quizzes.forEach((quiz) => {
      if (quiz.selectedAnswer === quiz.ans.toString()) {
        newScore++;
      }
    });
    setScore(newScore);
    setQuizSubmitted(true);
    setUnlockedVideos(courseData.videos.length);

    const currentQuizState = [...quizzes];

    quizCompleteAction(newScore).then(() => {
      setQuizzes(currentQuizState);
    });
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    setSelectedVideo(courseData.videos[0]);
  };

  const quizCompleteAction = async (newScore) => {
    const quizMarksPercentage = (newScore * 100) / quizzes.length;
    console.log(
      "🚀 ~ quizCompleteAction ~ quizMarksPercentage:",
      quizMarksPercentage
    );
    console.log(score);
    try {
      if (quizMarksPercentage < 40) {
        Swal.fire({
          title: "Error",
          text: `You got ${quizMarksPercentage}% marks in your quiz. You need to score at least 40% to complete the quiz.`,
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      } else {
        const response = await fetch(
          `${baseUrl}/api/course/completeQuiz/${userId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              _id: courseData._id,
              quizMarks: newScore,
              quizMarksPercentage: quizMarksPercentage,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to complete the quiz");
        }

        console.log("quiz completed successfully:", data);
        setQuizComplete(true);

        Swal.fire({
          title: "Congratulations!",
          text: `You got ${quizMarksPercentage}% marks in your quiz. You have completed the quiz!`,
          icon: "success",
          confirmButtonText: "OK",
        });
      }

      // Remove fetchSingleCourse() to preserve quiz state
    } catch (error) {
      console.error("Error completing the quiz:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to complete the quiz. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const renderQuizContent = () => (
    <div className="container mx-auto p-8 rounded border w-full">
      <h1 className="text-3xl font-bold mb-6 text-center">Quiz</h1>
      {quizzes.map((quiz, quizIndex) => (
        <div key={quiz.id} className="mb-6 bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{quiz.text}</h2>
          <div className="space-y-2">
            <p className="font-semibold">
              {quizIndex + 1}. {quiz.ques}
            </p>
            {quiz.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`quiz-${quizIndex}-option-${optionIndex}`}
                  name={`quiz-${quizIndex}-answer`}
                  value={optionIndex.toString()}
                  checked={quiz.selectedAnswer === optionIndex.toString()}
                  onChange={(e) => handleQuizChange(quizIndex, e.target.value)}
                  className="radio"
                  disabled={quizSubmitted}
                />
                <label
                  htmlFor={`quiz-${quizIndex}-option-${optionIndex}`}
                  className={`${
                    quizSubmitted
                      ? optionIndex.toString() === quiz.ans.toString()
                        ? "text-green-600 font-bold"
                        : quiz.selectedAnswer === optionIndex.toString()
                        ? "text-red-600 font-bold"
                        : "text-gray-700"
                      : "text-gray-700"
                  }`}
                >
                  {option}
                </label>
                {quizSubmitted &&
                  optionIndex.toString() === quiz.ans.toString() && (
                    <span className="text-green-600 ml-2">✓</span>
                  )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!quizSubmitted && (
        <button
          onClick={handleQuizSubmit}
          className="w-full bg-primary text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      )}
      {quizSubmitted && (
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold">
            Your Score: {score}/{quizzes.length}
          </h2>
          <button
            onClick={handleCloseQuiz}
            className="mt-4 w-full bg-primary text-white font-bold py-2 px-4 rounded"
          >
            Return to Videos
          </button>
        </div>
      )}
    </div>
  );

  const renderStudentOpinions = () => {
    if (
      !courseData?.studentsOpinion ||
      courseData.studentsOpinion.length === 0
    ) {
      return (
        <div className="w-full h-40 flex items-center justify-center">
          <p className="text-gray-500 text-lg">No review yet</p>
        </div>
      );
    }

    return courseData.studentsOpinion.map((opinion, index) => {
      const reviewer = allUsers.find((user) => user._id === opinion.reviewerId);
      return (
        <div key={index} className="border rounded-md py-3 px-4 w-[490px]">
          <div className="flex gap-3">
            <div className="w-20 rounded-full border mt-1">
              <img
                className="w-20 h-20 object-top rounded-full object-cover"
                alt="Profile Picture"
                src={reviewer?.img || "https://via.placeholder.com/150?text=User"}
              />
            </div>
            <div>
              <h5 className="font-semibold text-xl">
                {reviewer?.firstname} {reviewer?.lastname}
              </h5>
              <p>Student</p>
              <p>{reviewer?.department || "Department Unknown"}</p>
            </div>
          </div>
          <div className="flex gap-1 mt-2 mb-5 items-center">
            {[...Array(5)].map((star, i) =>
              i < opinion.rating ? (
                <FaStar key={i} className="text-yellow-400" />
              ) : (
                <FaRegStar key={i} />
              )
            )}
          </div>
          <p>{opinion.comments}</p>
        </div>
      );
    });
  };

  useEffect(() => {}, [finalPrice]);

  // console.log('final price',finalPrice, Math.round(finalPrice));

  const makePayment = async () => {
    sessionStorage.setItem("lastRoute", window.location.pathname);
    const paymentData = {
      courseId: courseData._id,
      studentsId: userId,
      price: Math.round(finalPrice),
    };
    console.log("Payment Data before sent:", paymentData);

    fetch(`${baseUrl}/api/course/payment/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })
      .then((res) => res.json())
      .then((result) => {
        window.location.replace(result.url);
        console.log(result);
      })
      .catch((error) => console.error("Error during payment process:", error));
  };

  const uploadProofImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "images");
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  // NEW FEATURE: Submit manual payment
  const submitManualPayment = async () => {
    if (!manualTransactionId || !manualAmountPaid) {
      Swal.fire({ icon: "error", title: "Missing Fields", text: "Please fill in all required fields." });
      return;
    }
    setSubmittingManualPayment(true);
    try {
      let proofImageUrl = "";
      if (manualProofImage) {
        proofImageUrl = await uploadProofImage(manualProofImage);
      }
      const payload = {
        courseId: courseData._id,
        userId,
        method: manualPayMethod,
        transactionId: manualTransactionId,
        senderAccount: manualTransactionId,
        amountPaid: parseFloat(manualAmountPaid),
        proofImageUrl,
      };
      const res = await fetch(`${baseUrl}/api/manual-payment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit payment");
      const data = await res.json();
      Swal.fire({
        icon: "success",
        title: "Payment Submitted!",
        text: "Your payment is under review. You will be notified once approved.",
      });
      setManualPaymentStatus("pending");
      setShowManualForm(false);
      fetchSingleCourse();
    } catch (error) {
      console.error("Manual payment error:", error);
      Swal.fire({ icon: "error", title: "Submission Failed", text: error.message });
    } finally {
      setSubmittingManualPayment(false);
    }
  };

  // NEW FEATURE: Manual payment form (uses dynamic settings from backend)
  const renderManualPaymentForm = () => {
    const settings = paymentSettings || {
      bkash: { number: "017XXXXXXXX", name: "Safara Academy" },
      nagad: { number: "017XXXXXXXX", name: "Safara Academy" },
      rocket: { number: "017XXXXXXXX", name: "Safara Academy" },
      bank: { details: "Bank: XYZ Bank, A/C: 123456789, Name: Safara Academy" },
    };
    return (
      <div className="border-t pt-3 mt-2">
        <p className="text-sm font-semibold mb-2">Send payment to:</p>
        {manualPayMethod === "bkash" && (
          <div className="bg-blue-50 p-2 rounded text-xs mb-2">
            <p><strong>bKash (Send Money):</strong> {settings.bkash?.number}</p>
            <p>Account Holder: {settings.bkash?.name}</p>
          </div>
        )}
        {manualPayMethod === "nagad" && (
          <div className="bg-pink-50 p-2 rounded text-xs mb-2">
            <p><strong>Nagad (Send Money):</strong> {settings.nagad?.number}</p>
            <p>Account Holder: {settings.nagad?.name}</p>
          </div>
        )}
        {manualPayMethod === "rocket" && (
          <div className="bg-purple-50 p-2 rounded text-xs mb-2">
            <p><strong>Rocket (Send Money):</strong> {settings.rocket?.number}</p>
            <p>Account Holder: {settings.rocket?.name}</p>
          </div>
        )}
        {manualPayMethod === "bank" && (
          <div className="bg-gray-50 p-2 rounded text-xs mb-2">
            <p><strong>Bank Transfer:</strong> {settings.bank?.details}</p>
          </div>
        )}
        <select
          value={manualPayMethod}
          onChange={(e) => setManualPayMethod(e.target.value)}
          className="select select-bordered w-full text-sm mb-2"
        >
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="rocket">Rocket</option>
          <option value="bank">Bank Transfer</option>
        </select>
        <input
          type="text"
          placeholder="Transaction ID or last 4 digits of sender number *"
          value={manualTransactionId}
          onChange={(e) => setManualTransactionId(e.target.value)}
          className="input input-bordered w-full text-sm mb-2"
        />
        <input
          type="number"
          placeholder="Amount Paid *"
          value={manualAmountPaid}
          onChange={(e) => setManualAmountPaid(e.target.value)}
          className="input input-bordered w-full text-sm mb-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setManualProofImage(e.target.files[0])}
          className="file-input file-input-bordered w-full text-sm mb-2"
        />
        <p className="text-xs text-gray-500 mb-2">Upload screenshot (optional but recommended)</p>
        <button
          onClick={submitManualPayment}
          disabled={submittingManualPayment}
          className="bg-primary text-white w-full text-sm py-2 rounded-md disabled:opacity-50"
        >
          {submittingManualPayment ? "Submitting..." : "Submit Payment"}
        </button>
      </div>
    );
  };

  // NEW FEATURE: Payment review status view
  const renderPaymentReviewStatus = () => {
    let icon, title, description, color;
    const isDeclined = manualPaymentStatus === "declined";
    if (manualPaymentStatus === "pending") {
      icon = <FaHourglassHalf className="text-6xl text-yellow-500" />;
      title = "Payment Under Review";
      description = "Your manual payment is being reviewed by the admin. You will be able to access the course once your payment is approved. This usually takes 24-48 hours.";
      color = "text-yellow-600";
    } else if (isDeclined) {
      icon = <FaTimesCircle className="text-6xl text-red-500" />;
      title = "Payment Declined";
      description = "Your manual payment was declined. Please submit a new payment request with corrected information.";
      color = "text-red-600";
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <Helmet>
          <title>{title} - {courseData?.title}</title>
        </Helmet>
        {icon}
        <h2 className={`text-3xl font-bold mt-4 ${color}`}>{title}</h2>
        <p className="text-gray-600 mt-2 text-center max-w-md">{description}</p>
        <div className="divider" />
        <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Course: {courseData?.title}</h3>
          {isDeclined && (
            <button
              onClick={() => { setManualPaymentStatus(null); setIsAdminOrStudent(false); setPaymentMethod("manual"); }}
              className="btn btn-primary btn-sm mt-2 w-full"
            >
              Submit New Payment
            </button>
          )}
          {!isDeclined && (
            <button
              onClick={() => { setManualPaymentStatus(null); setIsAdminOrStudent(false); }}
              className="btn btn-outline btn-sm mt-2"
            >
              Back to Course Page
            </button>
          )}
        </div>
      </div>
    );
  };

  const commonSections = (
    <div>
      <div>
        <h3 className="text-2xl font-semibold">What we offer</h3>
        <div className="border rounded-md mt-2 py-3 px-4">
          <div className="flex gap-3 items-center">
            <MdOutlineSlowMotionVideo />
            <p>{courseData?.videos?.length} videos</p>
          </div>
          <div className="flex gap-3 items-center">
            <TbLivePhoto />
            <p>Regular live classes</p>
          </div>
          <div className="flex gap-3 items-center">
            <PiExam />
            <p>Quiz after completing all lectures</p>
          </div>
          <div className="flex gap-3 items-center">
            <GoNote />
            <p>Free certificate after completing the course</p>
          </div>
        </div>
      </div>
      <div className="pt-10">
        <h3 className="text-2xl font-semibold">Course Instructors</h3>
        <div className="border rounded-md mt-2 py-3 px-4 flex flex-col gap-3">
          {courseData?.instructorsId?.map((instructorId, index) => {
            const instructor = allUsers.find(
              (user) => user._id === instructorId
            );
            return (
              <div key={index}>
                <div className="flex gap-3 items-center">
                  <div className="w-20 rounded-full border mt-1">
                    <img
                      className="w-20 h-20 object-top rounded-full object-cover"
                      alt="Profile Picture"
                      src={instructor?.img || "https://via.placeholder.com/150?text=User"}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold pb-2">
                      {instructor?.firstname} {instructor?.lastname}
                    </h3>
                    <p>{instructor?.profession[0]?.position || "N/A"}</p>
                    <p>{instructor?.profession[0]?.institution || "N/A"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="pt-10">
        <h3 className="text-2xl font-semibold">Course Details</h3>
        <div className="border rounded-md mt-2 py-3 px-4">
          <p className="text-justify">
            {ReactHtmlParser(
              courseData?.details || "No course details available."
            )}
          </p>
        </div>
      </div>
      <div className="pt-10">
        <h3 className="text-2xl font-semibold">Course Contents</h3>
        <div className="border rounded-md mt-2 py-3 px-4 max-h-72 overflow-y-scroll overflow-x-hidden">
          {courseData?.videos?.map((video) => (
            <div
              key={video?._id}
              className="whitespace-nowrap flex gap-2 items-center"
            >
              <FaRegCirclePlay /> <p>{video?.videoTitle}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-10">
        <h3 className="text-2xl font-semibold">Course Requirements</h3>
        <div className="border rounded-md mt-2 py-3 px-4">
          <p className="text-justify">{courseData?.requirements}</p>
        </div>
      </div>
      {isAdminOrStudent && (
        <div className="pt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold pb-2">
              Give us your valuable opinion
            </h3>
            <div className="flex gap-1 items-center cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} onClick={() => handleRatingClick(star)}>
                  {rating >= star ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <textarea
              className="border rounded-md w-full h-32 p-2"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            ></textarea>
            <div className="text-right">
              <button
                onClick={handleSubmitRating}
                className="bg-primary text-white px-5 py-2 mt-1 rounded-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="pt-10">
        <div className="flex gap-2 items-center justify-between">
          <h3 className="text-2xl font-semibold">Students Opinion</h3>
          <div className="flex gap-2 text-2xl text-white">
            <FaChevronLeft
              onClick={() => scrollCarousel(studentsOpinionCarouselRef, "left")}
              className="bg-primary rounded-md p-1 cursor-pointer"
            />
            <FaChevronRight
              onClick={() =>
                scrollCarousel(studentsOpinionCarouselRef, "right")
              }
              className="bg-primary rounded-md p-1 cursor-pointer"
            />
          </div>
        </div>
        <div
          ref={studentsOpinionCarouselRef}
          className="carousel carousel-center space-x-4 p-4 mt-2 border w-full min-h-52 rounded-md"
        >
          {renderStudentOpinions()}
        </div>
      </div>
      <div className="pt-10">
        <div className="flex gap-2 justify-between items-center">
          <h3 className="text-2xl font-semibold">Related Courses</h3>
          <div className="flex gap-2 text-2xl text-white">
            <FaChevronLeft
              onClick={() => scrollCarousel(reletedCoursesCarouselRef, "left")}
              className="bg-primary rounded-md p-1 cursor-pointer"
            />
            <FaChevronRight
              onClick={() => scrollCarousel(reletedCoursesCarouselRef, "right")}
              className="bg-primary rounded-md p-1 cursor-pointer"
            />
          </div>
        </div>
        <div
          ref={reletedCoursesCarouselRef}
          className="carousel carousel-center space-x-4 p-4 mt-2 border w-full min-h-36  rounded-md"
        >
          {reletedCourses?.map((reletedCourse) => (
            <Link
              to={`/singleCourse/${reletedCourse?._id}`}
              key={reletedCourse._id}
              className="carousel-item"
            >
              <img
                src={reletedCourse?.banner}
                className="rounded-md w-32 h-32 object-cover border"
                alt={reletedCourse?.title}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Helmet>
        <title>{courseData?.title || "Course Details"}</title>
        <meta
          name="description"
          content={courseData?.magnetLine || "Learn more about this course"}
        />
        <meta property="og:title" content={courseData?.title || ""} />
        <meta
          property="og:description"
          content={courseData?.magnetLine || ""}
        />
        <meta property="og:image" content={courseData?.banner || ""} />
      </Helmet>
      {isAdminOrStudent === false && (
        <div>
          <Navbar />
          <div className="pt-[73px] pb-20">
            <div className="rounded-md bg-gradient-to-b from-primary via-[#1870c8] to-[#1c7edf] text-white py-4 sm:py-5 border-b mb-6 sm:mb-8">
              <div className="lg:w-3/4 w-11/12 mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold">{courseData?.title}</h3>
                    <div className="flex gap-1 text-base sm:text-lg mt-2 items-center flex-wrap">
                      {renderStars(calculateAverageRating())}
                      <p className="ml-2 text-sm sm:text-base">
                        {courseData?.studentsOpinion?.length || 0} Ratings
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {(user?.user?.role === "admin" || courseData?.instructorsId?.includes(userId)) && (
                      <Link
                        to={`/dashboard/admin/schedulemeet?${courseId}`}
                        className="text-primary flex items-center justify-center gap-2 bg-white py-2 px-4 rounded-md text-sm"
                      >
                        Create Meet
                      </Link>
                    )}
                    <button
                      onClick={() => downloadFiteAtURL(courseData?.syllabus)}
                      className="text-primary flex items-center justify-center gap-2 bg-white py-2 px-4 rounded-md text-sm"
                    >
                      <IoMdDownload className="text-lg" />
                      <span>Syllabus</span>
                    </button>
                  </div>
                </div>
                <p className="pt-3 sm:pt-5 text-sm sm:text-base w-full sm:w-2/3 opacity-90">{courseData?.magnetLine}</p>
              </div>
            </div>
            <div className="lg:col-span-2 col-span-5 border rounded-md h-fit my-8 top-[73px] block lg:hidden">
              <img className="rounded-t-md" src={courseData?.banner} alt="" />
              {courseData?.discount > 0 ? (
                <div className="p-3">
                  <div className="flex gap-4">
                    <del className="font-semibold text-gray-400 flex items-center">
                      {courseData?.price}
                      <TbCurrencyTaka />
                    </del>
                    <p className="bg-primary bg-opacity-25 font-semibold text-primary rounded-full py-1 px-3 w-fit text-sm">
                      {courseData?.discount}% OFF
                    </p>
                  </div>
                  <div className="text-2xl font-semibold flex items-center">
                    <h3>
                      {finalPrice !== null
                        ? `${Math.round(finalPrice)}`
                        : "Price not available"}
                    </h3>
                    <TbCurrencyTaka />
                  </div>
                </div>
              ) : (
                <div className="text-2xl p-3 font-semibold flex items-center">
                  <h3>{courseData?.price}</h3>
                  <TbCurrencyTaka />
                </div>
              )}
              <div className="p-3 pt-0">
                {/* NEW FEATURE: Payment method selection */}
                <div className="flex flex-col gap-2 mb-3">
                  {(!courseData?.paymentMethods || courseData.paymentMethods.includes("online")) && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                        className="radio radio-primary radio-sm"
                      />
                      <span className="text-sm font-medium">Pay Online (SSLCommerz)</span>
                    </label>
                  )}
                  {(!courseData?.paymentMethods || courseData.paymentMethods.includes("manual")) && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "manual"}
                        onChange={() => setPaymentMethod("manual")}
                        className="radio radio-primary radio-sm"
                      />
                      <span className="text-sm font-medium">Manual Payment (bKash / Nagad / Bank / Rocket)</span>
                    </label>
                  )}
                </div>
                {paymentMethod === "online" ? (
                  <button
                    onClick={makePayment}
                    className="bg-primary text-white w-full text-xl py-2 mt-2 rounded-md"
                  >
                    Enroll Now
                  </button>
                ) : (
                  <div className="mt-2">
                    {renderManualPaymentForm()}
                  </div>
                )}
              </div>
            </div>
            <div className="lg:w-3/4 w-11/12 mx-auto">
              <div className="grid lg:grid-cols-7 grid-cols-1 gap-8 relative">
                <div className="col-span-5">{commonSections}</div>
                <div className="lg:col-span-2 col-span-5 border rounded-md h-fit sticky top-[73px] lg:block hidden">
                  <img
                    className="rounded-t-md"
                    src={courseData?.banner}
                    alt=""
                  />
                  {courseData?.discount > 0 ? (
                    <div className="p-3">
                      <div className="flex gap-4">
                        <del className="font-semibold text-gray-400 flex items-center">
                          {courseData?.price}
                          <TbCurrencyTaka />
                        </del>
                        <p className="bg-primary bg-opacity-25 font-semibold text-primary rounded-full py-1 px-3 w-fit text-sm">
                          {courseData?.discount}% OFF
                        </p>
                      </div>
                      <div className="text-2xl font-semibold flex items-center">
                        <h3>
                          {finalPrice !== null
                            ? `${Math.round(finalPrice)}`
                            : "Price not available"}
                        </h3>
                        <TbCurrencyTaka />
                      </div>
                    </div>
                  ) : (
                    <div className="text-2xl p-3 font-semibold flex items-center">
                      <h3>{courseData?.price}</h3>
                      <TbCurrencyTaka />
                    </div>
                  )}
                  <div className="p-3 pt-0">
                    {/* NEW FEATURE: Payment method selection */}
                    <div className="flex flex-col gap-2 mb-3">
                      {(!courseData?.paymentMethods || courseData.paymentMethods.includes("online")) && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethodDesktop"
                            checked={paymentMethod === "online"}
                            onChange={() => setPaymentMethod("online")}
                            className="radio radio-primary radio-sm"
                          />
                          <span className="text-sm font-medium">Pay Online</span>
                        </label>
                      )}
                      {(!courseData?.paymentMethods || courseData.paymentMethods.includes("manual")) && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethodDesktop"
                            checked={paymentMethod === "manual"}
                            onChange={() => setPaymentMethod("manual")}
                            className="radio radio-primary radio-sm"
                          />
                          <span className="text-sm font-medium">Manual Payment</span>
                        </label>
                      )}
                    </div>
                    {paymentMethod === "online" ? (
                      <button
                        onClick={makePayment}
                        className="bg-primary text-white w-full text-xl py-2 mt-2 rounded-md"
                      >
                        Enroll Now
                      </button>
                    ) : (
                      <div className="mt-2">
                        {renderManualPaymentForm()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      )}
      {isAdminOrStudent === true && !hasContentAccess && manualPaymentStatus && (
        <div className="">
          <Navbar />
          <div className="pt-[73px]">
            {renderPaymentReviewStatus()}
          </div>
          <Footer />
        </div>
      )}
      {isAdminOrStudent === true && hasContentAccess && (
        <div className="">
          <div className="top-0 z-10">
            <Sidebar />
          </div>
          <div className="lg:pl-72 pl-0 top-7 lg:absolute lg:pr-8 pr-0 w-full">
            <div className="rounded-md bg-gradient-to-b from-primary via-[#1870c8] to-[#1c7edf] text-white px-5 py-5 border-b mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-3xl">{courseData?.title}</h3>
                  <div className="flex gap-1 text-xl mt-2 items-center">
                    {renderStars(calculateAverageRating())}
                    <p className="ml-3">
                      {courseData?.studentsOpinion?.length || 0} Ratings
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  {(user?.user?.role === "admin" ||
                    courseData?.instructorsId?.includes(userId)) && (
                    <Link
                      to={`/dashboard/admin/schedulemeet?${courseId}`}
                      className="text-primary flex items-center gap-2 bg-white py-2 px-4 rounded-md"
                    >
                      Create Meet
                    </Link>
                  )}
                  <button
                    onClick={() => downloadFiteAtURL(courseData?.syllabus)}
                    className="text-primary flex items-center gap-2 bg-white py-2 px-4 rounded-md"
                  >
                    <IoMdDownload className="text-xl" />
                    <p className="">Syllabus</p>
                  </button>
                  <Link
                    to={courseData?.whatsappGroupLink}
                    target="_blank"
                    className="text-primary flex items-center gap-2 bg-white py-2 px-4 rounded-md"
                  >
                    <FaWhatsapp className="text-xl" />
                    <p className="">Join Group</p>
                  </Link>
                </div>
              </div>
              <div>
                <p className="pt-5 w-2/3">{courseData?.magnetLine}</p>
              </div>
            </div>
            <div className=" grid lg:grid-cols-7 grid-cols-1 gap-8">
              <div className="col-span-5 w-full">
                {showQuiz ? (
                  renderQuizContent()
                ) : (
                  <>
                    {selectedVideo?.videoType === "youtube" || selectedVideo?.youtubeVideoId ? (
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${selectedVideo?.youtubeVideoId || extractYouTubeVideoId(selectedVideo?.videoLink)}?rel=0&modestbranding=1&enablejsapi=0`}
                          title={selectedVideo?.videoTitle || "Course Video"}
                          className="absolute top-0 left-0 w-full h-full border rounded-md"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <video
                        className="border rounded-md col-span-5 w-full h-[600px]"
                        src={selectedVideo?.videoLink}
                        controls
                      />
                    )}
                  </>
                )}
                <div className="col-span-2 lg:hidden block z-10 ">
                  <div className="border rounded-md h-[600px] relative mt-5">
                    {courseData?.videos?.map((video, index) => (
                      <p
                        key={video?._id}
                        className={`whitespace-nowrap m-3 p-2 rounded-md border ${
                          showQuiz
                            ? "text-gray-400 cursor-not-allowed"
                            : selectedVideo?._id === video._id
                            ? "bg-primary border-primary text-white"
                            : index < unlockedVideos
                            ? "text-black cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                        } overflow-hidden`}
                        onClick={() =>
                          !showQuiz &&
                          index < unlockedVideos &&
                          handleVideoSelect(video, index)
                        }
                      >
                        {index < unlockedVideos ? (
                          <>{index + 1}. </>
                        ) : (
                          <FaLock className="inline-block mr-2" />
                        )}
                        {video?.videoTitle}
                      </p>
                    ))}
                    {courseData?.videos?.length > 0 && (
                      <div className="whitespace-nowrap flex justify-between m-3 p-2 rounded-md border">
                        <p
                          className={`px-4 rounded-md ${
                            courseComplete
                              ? "text-black"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Quiz
                        </p>
                        <button
                          onClick={courseComplete ? handleQuizOpen : undefined}
                          className={`px-4 rounded-md ${
                            courseComplete
                              ? "bg-primary text-white"
                              : "bg-gray-300 text-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!courseComplete}
                        >
                          Open
                        </button>
                      </div>
                    )}
                    <div className="text-white p-3 flex justify-between items-center absolute bottom-0 left-0 right-0">
                      <button
                        className={`bg-primary py-1 px-4 rounded-md ${
                          currentVideoIndex === 0 &&
                          "text-gray-400 bg-gray-300 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (currentVideoIndex > 0) {
                            handleVideoSelect(
                              courseData.videos[currentVideoIndex - 1],
                              currentVideoIndex - 1
                            );
                          }
                        }}
                        disabled={currentVideoIndex === 0}
                      >
                        Prev
                      </button>
                      <button
                        className={`bg-primary py-1 px-4 rounded-md ${
                          currentVideoIndex === courseData.videos.length - 1 &&
                          "text-gray-400 bg-gray-300 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (
                            currentVideoIndex <
                            courseData.videos.length - 1
                          ) {
                            if (currentVideoIndex + 1 < unlockedVideos) {
                              handleVideoSelect(
                                courseData.videos[currentVideoIndex + 1],
                                currentVideoIndex + 1
                              );
                            } else {
                              unlockNextVideo().then(() => {
                                handleVideoSelect(
                                  courseData.videos[currentVideoIndex + 1],
                                  currentVideoIndex + 1
                                );
                              });
                            }
                          }
                        }}
                        disabled={
                          currentVideoIndex === courseData.videos.length - 1
                        }
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  {courseComplete === true && quizComplete && (
                    <div className="text-center">
                      <button
                        onClick={courseCompleteAction}
                        className="text-white bg-primary w-full p-2 rounded-md mt-4"
                      >
                        Complete Course
                      </button>
                    </div>
                  )}
                </div>
                <div className="py-10">{commonSections}</div>
              </div>

              <div className="col-span-2 h-[600px] hidden lg:block z-10 sticky top-[20px]">
                <div className="border rounded-md h-[600px]">
                  {courseData?.videos?.map((video, index) => (
                    <p
                      key={video?._id}
                      className={`whitespace-nowrap m-3 p-2 rounded-md border ${
                        showQuiz
                          ? "text-gray-400 cursor-not-allowed"
                          : selectedVideo?._id === video._id
                          ? "bg-primary border-primary text-white"
                          : index < unlockedVideos
                          ? "text-black cursor-pointer"
                          : "text-gray-400 cursor-not-allowed"
                      } overflow-hidden`}
                      onClick={() =>
                        !showQuiz &&
                        index < unlockedVideos &&
                        handleVideoSelect(video, index)
                      }
                    >
                      {index < unlockedVideos ? (
                        <>{index + 1}. </>
                      ) : (
                        <FaLock className="inline-block mr-2" />
                      )}
                      {video?.videoTitle}
                    </p>
                  ))}
                  {courseData?.videos?.length > 0 && (
                    <div className="whitespace-nowrap flex justify-between m-3 p-2 rounded-md border">
                      <p
                        className={`px-4 rounded-md ${
                          courseComplete
                            ? "text-black"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Quiz
                      </p>
                      <button
                        onClick={courseComplete ? handleQuizOpen : undefined}
                        className={`px-4 rounded-md ${
                          courseComplete
                            ? "bg-primary text-white"
                            : "bg-gray-300 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!courseComplete}
                      >
                        Open
                      </button>
                    </div>
                  )}
                  <div className="text-white p-3 flex justify-between items-center absolute bottom-0 left-0 right-0">
                    <button
                      className={`bg-primary py-1 px-4 rounded-md ${
                        currentVideoIndex === 0 &&
                        "text-gray-400 bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (currentVideoIndex > 0) {
                          handleVideoSelect(
                            courseData.videos[currentVideoIndex - 1],
                            currentVideoIndex - 1
                          );
                        }
                      }}
                      disabled={currentVideoIndex === 0}
                    >
                      Prev
                    </button>
                    <button
                      className={`bg-primary py-1 px-4 rounded-md ${
                        currentVideoIndex === courseData.videos.length - 1 &&
                        "text-gray-400 bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (currentVideoIndex < courseData.videos.length - 1) {
                          if (currentVideoIndex + 1 < unlockedVideos) {
                            handleVideoSelect(
                              courseData.videos[currentVideoIndex + 1],
                              currentVideoIndex + 1
                            );
                          } else {
                            unlockNextVideo().then(() => {
                              handleVideoSelect(
                                courseData.videos[currentVideoIndex + 1],
                                currentVideoIndex + 1
                              );
                            });
                          }
                        }
                      }}
                      disabled={
                        currentVideoIndex === courseData.videos.length - 1
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
                {courseComplete === true && quizComplete && (
                  <div className="text-center">
                    <button
                      onClick={courseCompleteAction}
                      className="text-white bg-primary w-full p-2 rounded-md mt-4"
                    >
                      Complete Course
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleCourse;
