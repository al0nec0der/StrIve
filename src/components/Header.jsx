import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../util/firebase";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Header = () => {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user.user);

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => navigate("/"))
      .catch(() => navigate("/error"));
  };

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpenMenu(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-16 z-30 bg-gradient-to-b from-black via-black/80 to-transparent">
      <div className="h-full px-6 flex items-center">
        {/* Left: Logo (bigger) */}
        <button
          onClick={() => navigate("/Browse")}
          className="flex items-center focus:outline-none"
          aria-label="Go to Home"
        >
          <img
            src="https://i.pinimg.com/736x/8b/51/4d/8b514d341909dca0c6bbb9d20d742dab.jpg"
            alt="Logo"
            className="h-10 md:h-11 w-auto"
          />
        </button>

        {/* Spacer pushes nav and actions to the right */}
        <div className="flex-1" />

        {/* Right: Navigation + actions (no notification) */}
        {user && (
          <div className="flex items-center space-x-20">
            {/* Right-aligned navigation */}
            <nav aria-label="Primary" className="text-white">
              <ul className="flex items-center space-x-20 text-sm md:text-base font-semibold">
                <li>
                  <button
                    onClick={() => navigate("/Browse")}
                    className="hover:text-red-500 focus:outline-none"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {}}
                    className="hover:text-red-500 focus:outline-none"
                  >
                    Movies
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {}}
                    className="hover:text-red-500 focus:outline-none"
                  >
                    Shows
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {}}
                    className="hover:text-red-500 focus:outline-none"
                  >
                    My Lists
                  </button>
                </li>
              </ul>
            </nav>

            {/* Search icon */}
            <button
              aria-label="Search"
              className="text-white hover:text-red-500 focus:outline-none"
              onClick={() => {}}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Account icon + Dropdown (black, neat, modern) */}
            <div className="relative mr-10" ref={menuRef}>
              <button
                onClick={() => setOpenMenu((s) => !s)}
                aria-haspopup="menu"
                aria-expanded={openMenu}
                className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold text-sm flex items-center justify-center hover:ring-2 hover:ring-red-600 focus:outline-none"
              >
                {(user?.name?.[0] || "U").toUpperCase()}
              </button>

              {openMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-56 rounded-lg bg-black/95 border border-white/10 shadow-xl overflow-hidden"
                >
                  <button
                    role="menuitem"
                    onClick={() => {}}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10"
                  >
                    Account
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {}}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10"
                  >
                    Settings
                  </button>
                  <div className="h-px bg-white/10" />
                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-red-400 hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
