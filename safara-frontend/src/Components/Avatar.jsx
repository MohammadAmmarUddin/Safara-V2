import PropTypes from "prop-types";
import { FaUser } from "react-icons/fa";

const Avatar = ({ src, alt = "User", size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
    "2xl": "w-16 h-16 text-xl",
  };

  const sizeNum = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
    "2xl": 64,
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-medium ${sizeClasses[size]} ${className}`}
      style={{ width: sizeNum[size], height: sizeNum[size] }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <div className={`absolute inset-0 items-center justify-center ${src ? "hidden" : "flex"}`}>
        <FaUser className={sizeClasses[size]} />
      </div>
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
};

export default Avatar;