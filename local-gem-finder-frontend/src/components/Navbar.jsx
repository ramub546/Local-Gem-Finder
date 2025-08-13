import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Logo on the left - removed flex container since we only have one element */}
          <Link 
            to="/" 
            className="text-white text-xl font-bold hover:text-blue-100 transition-colors duration-200 whitespace-nowrap"
          >
            💎 Local Gem Finder
          </Link>
          
          {/* Navigation items on the right */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Home
            </Link>

            <Link
              to="/explore"
              className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Explore
            </Link>

            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <Link
                  to="/add-post"
                  className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Add Post
                </Link>
                <Link
                  to="/profile"
                  className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {user?.name || "Profile"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}