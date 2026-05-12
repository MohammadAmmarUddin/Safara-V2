import axios from "axios";
import { useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import { useLogout } from "../hooks/useLogout";
import { Helmet } from "react-helmet";
import { MdLock, MdDeleteForever, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FiShield } from "react-icons/fi";

const Settings = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showRetypePw, setShowRetypePw] = useState(false);
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const id = user?.user?._id;

  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const handleDeleteMyAccount = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      const response = await axios.delete(
        `${baseUrl}/api/user/deleteMyAccount`,
        {
          data: { password, id },
        }
      );

      setMessage(response.data.message || "Account deleted successfully.");
      localStorage.removeItem("token");
      logout();
    } catch (err) {
      setError(
        err.response?.data?.error || "An error occurred. Please try again."
      );
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const form = e.target;
    const oldPassword = form.oldPassword.value;
    const newPassword = form.newPassword.value;
    const retypePassword = form.retypePassword.value;

    setMessage("");
    setError("");

    if (!oldPassword || !newPassword || !retypePassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== retypePassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      const response = await axios.patch(`${baseUrl}/api/user/changePassword`, {
        oldPassword,
        newPassword,
        retypePassword,
        id,
      });

      setMessage(response.data.message || "Password changed successfully!");
      form.reset();
    } catch (err) {
      setError(
        err.response?.data?.error || "An error occurred. Please try again."
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Helmet>
        <title>Account Settings - Safara</title>
        <meta name="description" content="Manage your Safara account settings securely." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account security and preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FiShield className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-400">Password and authentication</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                <MdLock className="text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Password</p>
                <p className="text-xs text-gray-400">Last changed: --</p>
              </div>
            </div>
            <button
              className="btn bg-primary text-white border-none rounded-xl px-6 min-h-[42px] hover:bg-primary/90"
              onClick={() =>
                document.getElementById("change-password-modal").showModal()
              }
            >
              Change Password
            </button>
          </div>

          <dialog id="change-password-modal" className="modal">
            <div className="modal-box rounded-2xl p-0 overflow-hidden max-w-md">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </form>
              </div>

              <div className="p-6">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl mb-4">
                    {message}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="form-control">
                    <label className="label-text text-sm font-medium text-gray-700 mb-1.5">Old Password</label>
                    <div className="relative">
                      <input
                        type={showOldPw ? "text" : "password"}
                        name="oldPassword"
                        placeholder="Enter your old password"
                        className="input input-bordered w-full pr-10 rounded-xl focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPw(!showOldPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showOldPw ? <MdVisibilityOff /> : <MdVisibility />}
                      </button>
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label-text text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        name="newPassword"
                        placeholder="Enter your new password"
                        className="input input-bordered w-full pr-10 rounded-xl focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPw ? <MdVisibilityOff /> : <MdVisibility />}
                      </button>
                    </div>
                    <label className="label-text-alt text-xs text-gray-400 mt-1">Minimum 8 characters</label>
                  </div>
                  <div className="form-control">
                    <label className="label-text text-sm font-medium text-gray-700 mb-1.5">Retype New Password</label>
                    <div className="relative">
                      <input
                        type={showRetypePw ? "text" : "password"}
                        name="retypePassword"
                        placeholder="Retype your new password"
                        className="input input-bordered w-full pr-10 rounded-xl focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRetypePw(!showRetypePw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showRetypePw ? <MdVisibilityOff /> : <MdVisibility />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn bg-primary text-white w-full rounded-xl min-h-[44px] hover:bg-primary/90 mt-2"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <MdDeleteForever className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
            <p className="text-sm text-red-400">Irreversible actions</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Delete your account</p>
              <p className="text-xs text-gray-400 mt-0.5">Permanently remove your account and all associated data</p>
            </div>
            <button
              className="btn bg-red-500 text-white border-none rounded-xl px-6 min-h-[42px] hover:bg-red-600"
              onClick={() =>
                document.getElementById("delete-account").showModal()
              }
            >
              Delete Account
            </button>
          </div>

          <dialog id="delete-account" className="modal">
            <div className="modal-box rounded-2xl p-0 overflow-hidden max-w-md">
              <div className="px-6 py-5 border-b border-red-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </form>
              </div>

              <div className="p-6">
                <div className="bg-red-50 rounded-xl px-4 py-3 mb-5">
                  <p className="text-sm text-red-600 font-medium">
                    Warning: This action is permanent and cannot be undone. You will lose access to all your courses and certificates.
                  </p>
                </div>

                <form onSubmit={handleDeleteMyAccount} className="space-y-4">
                  <div className="form-control">
                    <label className="label-text text-sm font-medium text-gray-700 mb-1.5">
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      placeholder="Your password"
                      className="input input-bordered w-full rounded-xl focus:outline-none focus:border-red-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                  {message && (
                    <p className="text-green-500 text-sm">{message}</p>
                  )}

                  <button
                    type="submit"
                    className="btn bg-red-500 text-white w-full rounded-xl min-h-[44px] hover:bg-red-600"
                  >
                    <MdDeleteForever className="text-lg" />
                    Permanently Delete Account
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;
