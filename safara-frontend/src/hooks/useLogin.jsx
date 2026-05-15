import { useState } from "react";
import useAuth from "./useAuthContext";
import Swal from "sweetalert2";

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuth();

  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
      const response = await fetch(`${baseUrl}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const json = await response.json();

      if (!response.ok) {
        const errorMsg = json.error || "Login failed. Please check your credentials.";
        setError(errorMsg);
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: errorMsg,
          confirmButtonColor: "#125ca6",
        });
        return null;
      }

      if (!json.user) {
        setError("Invalid response from server.");
        return null;
      }

      localStorage.setItem("user", JSON.stringify(json));
      dispatch({ type: "LOGIN", payload: json });
      
      return json;
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg = "Network error. Please check your connection.";
      setError(errorMsg);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: errorMsg,
        confirmButtonColor: "#125ca6",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (userData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
      const response = await fetch(`${baseUrl}/api/user/googleLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Google login failed.");
      }

      if (!json.user) {
        throw new Error("Invalid response from server.");
      }

      localStorage.setItem("user", JSON.stringify(json));
      dispatch({ type: "LOGIN", payload: json });
      
      return true;
    } catch (err) {
      console.error("Google login error:", err);
      const errorMsg = err.message || "Something went wrong with Google login.";
      setError(errorMsg);
      Swal.fire({
        icon: "error",
        title: "Google Login Failed",
        text: errorMsg,
        confirmButtonColor: "#125ca6",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, googleLogin, error, isLoading };
};