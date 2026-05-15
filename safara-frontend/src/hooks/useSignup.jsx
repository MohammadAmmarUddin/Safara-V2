import { useState } from "react";
import Swal from "sweetalert2";
import useAuth from "./useAuthContext";

export const useSignup = () => {
    const [error, setError] = useState(null);
    const { dispatch } = useAuth();

    const signup = async (firstname, lastname, email, phone, img, password) => {
        setError(null);
        const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;
        try {
            const response = await fetch(`${baseUrl}/api/user/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstname, lastname, email, phone, img, password })
            });
            const json = await response.json();
            
            if (!response.ok) {
                const errorMsg = json.error || "Something went wrong";
                setError(errorMsg);
                
                if (errorMsg.toLowerCase().includes("email")) {
                    const result = await Swal.fire({
                        icon: "warning",
                        title: "Email Already Exists",
                        text: "This email is already registered. Redirecting to login...",
                        confirmButtonText: "Go to Login",
                        confirmButtonColor: "#125ca6",
                        showCancelButton: true,
                        cancelButtonText: "Cancel",
                    });
                    if (result.isConfirmed) {
                        return { success: false, redirectToLogin: true };
                    }
                    return { success: false, error: errorMsg };
                } else if (errorMsg.toLowerCase().includes("phone")) {
                    Swal.fire({
                        icon: "warning",
                        title: "Phone Already Exists",
                        text: "This phone number is already registered. Please use a different number.",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#125ca6",
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Signup Failed",
                        text: errorMsg,
                        confirmButtonColor: "#125ca6",
                    });
                }
                return { success: false, error: errorMsg };
            }
            
            localStorage.setItem('user', JSON.stringify(json));
            dispatch({ type: 'LOGIN', payload: json });
            Swal.fire({
                position: "top-middle",
                icon: "success",
                title: "Welcome! Account created successfully!",
                showConfirmButton: false,
                timer: 1500,
            });
            return { success: true };
        } catch (err) {
            Swal.fire({
                position: "top-middle",
                icon: "error",
                title: "Network error",
                text: "Please check your internet connection",
                showConfirmButton: true,
            });
            return { success: false, error: "Network error" };
        }
    };

    return { signup, error };
};