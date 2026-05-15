import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignup } from "../hooks/useSignup";
import { FcGoogle } from "react-icons/fc";
import { FaGraduationCap, FaUser, FaEnvelope, FaPhone, FaLock, FaImage, FaCheck, FaEye, FaEyeSlash, FaShieldAlt, FaExclamationCircle } from "react-icons/fa";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import app from "../firebase/firebase";
import Swal from "sweetalert2";
import useAuth from "../hooks/useAuthContext";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const Signup = () => {
  const { signup } = useSignup();
  const { dispatch } = useAuth();
  const navigate = useNavigate();
  const [uploadPerc, setUploadPerc] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    password: "",
    retypePassword: "",
  });
  const [errors, setErrors] = useState({});
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstname.trim()) newErrors.firstname = "First name is required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^01\d{9,10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Invalid phone (01XXXXXXXXX)";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Min 8 characters";
    }
    if (!formData.retypePassword) {
      newErrors.retypePassword = "Please confirm";
    } else if (formData.password !== formData.retypePassword) {
      newErrors.retypePassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user.email) {
        throw new Error("Email is missing from Google account");
      }

      const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
      const response = await fetch(`${baseUrl}/api/user/googleLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: user.displayName?.split(" ")[0] || "User",
          lastname: user.displayName?.split(" ")[1] || "",
          email: user.email,
          phone: user.phoneNumber || "0000000000",
          img: user.photoURL || "",
        }),
      });

      const json = await response.json();
      
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(json));
        dispatch({ type: "LOGIN", payload: json });
        Swal.fire({
          icon: "success",
          title: "Welcome!",
          text: "Signed up with Google successfully!",
          timer: 1500,
        });
        setTimeout(() => navigate("/"), 500);
      } else {
        throw new Error(json.error || "Google signup failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Google Signup Failed",
        text: error.message,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        Swal.fire({ icon: "error", title: "Invalid File", text: "Only JPG, PNG, WebP allowed" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: "error", title: "File Too Large", text: "Max size is 5MB" });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const { firstname, lastname, email, phone, password } = formData;

    try {
      let downloadURL = "";
      if (selectedImage) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", selectedImage);
        formDataUpload.append("folder", "images");
        const res = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: formDataUpload });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        downloadURL = data.url;
        setUploadPerc(100);
      }
      
      const result = await signup(firstname, lastname, email, phone, downloadURL, password);
      if (result?.success) {
        setTimeout(() => navigate("/"), 500);
      } else if (result?.redirectToLogin) {
        setTimeout(() => navigate("/login"), 500);
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (formData.password.length === 0) return { width: "0%", color: "bg-gray-200", text: "" };
    if (formData.password.length < 8) return { width: "33%", color: "bg-red-500", text: "Weak" };
    if (formData.password.length < 12) return { width: "66%", color: "bg-yellow-500", text: "Medium" };
    return { width: "100%", color: "bg-green-500", text: "Strong" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6">
          <span>←</span>
          <span className="font-medium text-sm">Back to Home</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden border border-gray-100">
          <div className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-indigo-600 p-8 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <FaGraduationCap className="text-white text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-white">Create Account</h1>
              <p className="text-white/80 text-sm mt-1">Join us and start learning today</p>
            </div>
          </div>

          <div className="p-8">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center gap-3 font-semibold text-gray-700 transition-all hover:shadow-md mb-6"
            >
              <FcGoogle className="text-2xl" />
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-400 font-medium">or sign up with email</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">First Name</label>
                  <input
                    type="text"
                    name="firstname"
                    placeholder="John"
                    value={formData.firstname}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${errors.firstname ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'} focus:bg-white focus:outline-none transition-all text-sm`}
                  />
                  {errors.firstname && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle />{errors.firstname}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Last Name</label>
                  <input
                    type="text"
                    name="lastname"
                    placeholder="Doe"
                    value={formData.lastname}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${errors.lastname ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'} focus:bg-white focus:outline-none transition-all text-sm`}
                  />
                  {errors.lastname && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle />{errors.lastname}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'} focus:bg-white focus:outline-none transition-all text-sm`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle />{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'} focus:bg-white focus:outline-none transition-all text-sm`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle />{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-10 rounded-xl border-2 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'} focus:bg-white focus:outline-none transition-all text-sm`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle />{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showRetypePassword ? "text" : "password"}
                      name="retypePassword"
                      placeholder="Re-enter password"
                      value={formData.retypePassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-10 rounded-xl border-2 ${errors.retypePassword ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'} focus:bg-white focus:outline-none transition-all text-sm`}
                    />
                    <button type="button" onClick={() => setShowRetypePassword(!showRetypePassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showRetypePassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.retypePassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle />{errors.retypePassword}</p>}
                </div>
              </div>

              {formData.password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }}></div>
                  </div>
                  <span className={`text-xs font-medium ${strength.text === 'Weak' ? 'text-red-500' : strength.text === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>{strength.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Create Account
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-2">
                <FaShieldAlt className="text-green-500" />
                <span>Your data is secure and encrypted</span>
              </div>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;