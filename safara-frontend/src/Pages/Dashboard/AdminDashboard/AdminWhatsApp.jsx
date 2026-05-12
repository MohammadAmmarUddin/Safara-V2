import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { FaWhatsapp } from "react-icons/fa";
import Swal from "sweetalert2";

const AdminWhatsApp = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    number: "",
    name: "",
    welcomeMessage: "",
  });
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/whatsapp-settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/api/whatsapp-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Saved!", text: "WhatsApp settings updated." });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner w-20 h-20 text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>WhatsApp Settings - Admin</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">WhatsApp Settings</h1>
        <p className="text-gray-500 mt-2">Configure the WhatsApp number for the floating chat button on your site.</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center gap-3">
            <FaWhatsapp className="text-white text-2xl" />
            <h2 className="text-lg font-semibold text-white">WhatsApp Configuration</h2>
          </div>

          <div className="p-6 space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">WhatsApp Number</span>
              </label>
              <input
                type="text"
                value={settings.number}
                onChange={(e) => setSettings({ ...settings, number: e.target.value })}
                placeholder="+8801558000555"
                className="input input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Include country code (e.g. +880...)</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Business Name</span>
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Safara Academy"
                className="input input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Name shown in the chat bubble tooltip</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Welcome Message (optional)</span>
              </label>
              <textarea
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                placeholder="Hello! How can we help you?"
                className="textarea textarea-bordered h-20"
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Pre-filled message when someone clicks the chat button</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn bg-green-600 hover:bg-green-700 text-white border-none px-8 min-h-[44px]"
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaWhatsapp />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Preview</h3>
          <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="relative">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <FaWhatsapp className="text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">
                Chat with {settings.name || "Safara Academy"}
              </p>
              <p className="text-xs text-gray-400">{settings.number || "+880XXXXXXXXX"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsApp;
