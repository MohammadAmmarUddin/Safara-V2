import { Link } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaPhone,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      {/* Main Footer Content */}
      <div className="py-8 md:py-10 lg:py-12 w-11/12 mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Address Section */}
        <div className="flex flex-col sm:col-span-2 lg:col-span-1">
          <h6 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Contact Us</h6>
          <Link
            to="/location"
            className="flex items-start text-white mb-3 md:mb-4 hover:text-gray-300 text-sm"
          >
            <FaLocationDot className="mr-2 md:mr-3 text-lg md:text-xl flex-shrink-0 mt-1" />
            <span>
              Office: Holding-83, DNCC, Mujibur business center, Top Floor, 100
              Feet, Madani Avenue, Vatara, Dhaka-1212
            </span>
          </Link>
          <Link
            to="/contact"
            className="flex items-start text-white mb-3 md:mb-4 hover:text-gray-300 text-sm"
          >
            <FaPhone className="mr-2 md:mr-3 text-lg md:text-xl flex-shrink-0 mt-1" />
            <span>
              Support:+880 1558-000555 <br />
              Helpline:+880 1558-000555 <br />
              (Sat-Thu, 10AM-7PM)
            </span>
          </Link>
          <Link
            to="/contact"
            className="flex items-center text-white mb-4 hover:text-gray-300 text-sm"
          >
            <MdEmail className="mr-2 md:mr-3 text-lg md:text-xl flex-shrink-0" />
            <span>info@safaralearning.com</span>
          </Link>
        </div>

        {/* Quick Links Section */}
        <div className="flex flex-col">
          <h6 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Quick Links</h6>
          <Link to="/admissions" className="mb-2 md:mb-3 text-sm hover:text-gray-300">
            Enroll
          </Link>
          <Link to="/academic-programs" className="mb-2 md:mb-3 text-sm hover:text-gray-300">
            Academic Programs
          </Link>
          <Link to="/research" className="mb-2 md:mb-3 text-sm hover:text-gray-300">
            Research
          </Link>
          <Link to="/privacy" className="text-sm mb-2 md:mb-3 hover:text-gray-300">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-sm hover:text-gray-300">
            Terms & Conditions
          </Link>
        </div>

        {/* Social Media Section */}
        <div className="flex flex-col items-start sm:items-end lg:items-center">
          <div>
            <h6 className="text-base md:text-lg font-semibold mb-4 md:mb-6 text-left sm:text-right lg:text-center">Follow Us</h6>
            <div className="flex gap-4 sm:gap-5 justify-start sm:justify-end lg:justify-center">
              <Link to="https://www.facebook.com/profile.php?id=61565767569776" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                <FaFacebook className="text-2xl md:text-3xl" />
              </Link>
              <Link to="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                <FaTwitter className="text-2xl md:text-3xl" />
              </Link>
              <Link to="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                <FaLinkedin className="text-2xl md:text-3xl" />
              </Link>
              <Link to="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                <FaYoutube className="text-2xl md:text-3xl" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="text-center bg-[#144679] py-2">
        <p className="text-sm">© Safara Academy {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

export default Footer;
