import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";

const Whatsapp = () => {
  const [settings, setSettings] = useState({ number: "+8801558000555", name: "Safara Academy", welcomeMessage: "" });
  const [showTooltip, setShowTooltip] = useState(false);
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
        console.error("Failed to load WhatsApp settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const cleanNumber = settings.number.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(settings.welcomeMessage || "Hello!")}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {showTooltip && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 max-w-[200px] animate-fade-in-up">
          <p className="text-sm font-semibold text-gray-800">{settings.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Typically replies instantly</p>
        </div>
      )}

      <div className="relative group">
        <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg cursor-pointer hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200"
          aria-label="Chat on WhatsApp"
        >
          <FaWhatsapp className="text-white text-2xl" />
        </a>
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></span>
      </div>
    </div>
  );
};

export default Whatsapp;
