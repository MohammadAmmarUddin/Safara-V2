import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";

const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    bkash: { number: "", name: "" },
    nagad: { number: "", name: "" },
    rocket: { number: "", name: "" },
    bank: { details: "" },
  });
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/payment-settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/api/payment-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Saved!", text: "Payment settings updated." });
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
    <div className="min-h-screen lg:p-8 pt-5">
      <Helmet>
        <title>Payment Settings - Admin</title>
      </Helmet>

      <h1 className="text-3xl font-bold text-primary mb-8">Payment Settings</h1>
      <p className="text-gray-600 mb-6">Configure the payment numbers students see when choosing Manual Payment.</p>

      {/* bKash */}
      <div className="bg-white rounded-lg border p-6 mb-4">
        <h2 className="text-xl font-semibold text-pink-600 mb-4">bKash</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">bKash Number</span></label>
            <input
              type="text"
              value={settings.bkash?.number || ""}
              onChange={(e) => setSettings({ ...settings, bkash: { ...settings.bkash, number: e.target.value } })}
              placeholder="01XXXXXXXXX"
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Account Holder Name</span></label>
            <input
              type="text"
              value={settings.bkash?.name || ""}
              onChange={(e) => setSettings({ ...settings, bkash: { ...settings.bkash, name: e.target.value } })}
              placeholder="Safara Academy"
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      {/* Nagad */}
      <div className="bg-white rounded-lg border p-6 mb-4">
        <h2 className="text-xl font-semibold text-orange-600 mb-4">Nagad</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nagad Number</span></label>
            <input
              type="text"
              value={settings.nagad?.number || ""}
              onChange={(e) => setSettings({ ...settings, nagad: { ...settings.nagad, number: e.target.value } })}
              placeholder="01XXXXXXXXX"
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Account Holder Name</span></label>
            <input
              type="text"
              value={settings.nagad?.name || ""}
              onChange={(e) => setSettings({ ...settings, nagad: { ...settings.nagad, name: e.target.value } })}
              placeholder="Safara Academy"
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      {/* Rocket */}
      <div className="bg-white rounded-lg border p-6 mb-4">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Rocket</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Rocket Number</span></label>
            <input
              type="text"
              value={settings.rocket?.number || ""}
              onChange={(e) => setSettings({ ...settings, rocket: { ...settings.rocket, number: e.target.value } })}
              placeholder="01XXXXXXXXX"
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Account Holder Name</span></label>
            <input
              type="text"
              value={settings.rocket?.name || ""}
              onChange={(e) => setSettings({ ...settings, rocket: { ...settings.rocket, name: e.target.value } })}
              placeholder="Safara Academy"
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      {/* Bank */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Bank Transfer</h2>
        <div className="form-control">
          <label className="label"><span className="label-text">Bank Details</span></label>
          <textarea
            value={settings.bank?.details || ""}
            onChange={(e) => setSettings({ ...settings, bank: { ...settings.bank, details: e.target.value } })}
            placeholder="Bank: XYZ Bank, A/C: 123456789, Name: Safara Academy"
            className="textarea textarea-bordered h-24"
          />
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-8 py-3 rounded-md text-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default PaymentSettings;
