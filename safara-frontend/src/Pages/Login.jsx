import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash, FaGraduationCap } from "react-icons/fa";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import app from "../firebase/firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin, isLoading } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const userData = await login(email, password);
      if (userData) {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Google login failed: Email is missing");
      }

      const randomPhone = Math.floor(Math.random() * 9000000000) + 1000000000;

      const userData = {
        firstname: user.displayName?.split(" ")[0] || "Unknown",
        lastname: user.displayName?.split(" ")[1] || "Unknown",
        email: user.email,
        phone: user.phoneNumber || randomPhone.toString(),
        img: user.photoURL || "",
      };

      await googleLogin(userData);
      navigate("/");
    } catch (error) {
      setError(error.message || "Google login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <FaGraduationCap className="text-white text-2xl" />
          </div>
          <span className="ml-3 text-2xl font-bold text-gray-800">Safara</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm">
              <span>←</span>
              <span>Back to Home</span>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">Sign in</h1>
          <p className="text-gray-500 text-sm text-center mb-8">to continue to Safara Learning</p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          {/* Google Button - Prominent at top */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center gap-3 font-medium text-gray-700 transition-all shadow-sm hover:shadow-md"
            disabled={isLoading}
          >
            <FcGoogle className="text-2xl" />
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email or phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-base"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link to="/forgetPassword" className="text-sm text-primary hover:text-primary/80 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Your data is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default Login;