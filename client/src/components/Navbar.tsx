import React, { useState, useRef } from "react";
import { User, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Logo from "./Logo";
import type { RootState } from "../store/store";
import { clearUser } from "../store/slices/usersSlice";
import { showSuccessToast } from "../utils/toast";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownTimer = useRef<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const location = useLocation();
  const user = useSelector((state: RootState) => state.user.user);

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Profiles", href: "/profiles" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    dispatch(clearUser());
    showSuccessToast("Successfully logged out.");
    navigate("/signin");
  };

  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="bg-bg-navbar border border-border rounded-2xl shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo width="120" height="120" navbar_theme="dark" />
          </div>

          {/* Navigation Items & User Section */}
          <div className="flex items-center gap-8">
            {/* Navigation Links */}
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`relative text-text-inverted font-medium transition-colors duration-200
                    ${isActive ? "after:w-full" : "after:w-0"}
                    hover:text-text-inverted/90
                    after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-text-inverted after:transition-all after:duration-300`}
                >
                  {item.name}
                </a>
              );
            })}

            {/* User Section with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
                setShowDropdown(true);
              }}
              onMouseLeave={() => {
                dropdownTimer.current = window.setTimeout(() => {
                  setShowDropdown(false);
                }, 200);
              }}
            >
              <button className="flex items-center gap-3 px-4 py-2 rounded-lg bg-bg hover:bg-bg-dark transition-colors duration-200">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-text-inverted" />
                </div>
                <span className="text-text-primary font-medium">
                  {user ? `${user.lastName}` : "Guest"}
                </span>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-bg-light border border-border rounded-lg shadow-xl overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-bg hover:text-danger transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
