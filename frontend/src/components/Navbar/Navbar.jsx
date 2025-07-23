// src/components/Navbar/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import { IoHomeOutline } from "react-icons/io5";
import { MdOutlineExplore } from "react-icons/md";
import { BsPencilFill } from "react-icons/bs";
import { FaSearch, FaBell, FaUser, FaTools } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";
import { useAuthContext } from "../../hooks/useAuthContext";
import { search } from "../../api/search";
import { getNotifications } from "../../api/notifications";
import NotificationsModal from "../NotificationsModal/NotificationsModal";

function Navbar() {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = user?.userData.id;

  // Stati per la ricerca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef(null);
  const searchRef = useRef(null);

  // Stati per il modal notifiche
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to fetch initial unread count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Fetch only unread notifications with minimal data (just need count)
      const response = await getNotifications({
        page: 1,
        limit: 1, // We only need the count, so minimal limit
        filter: "unread", // Only get unread notifications
      });

      // Use totalUnread if available, otherwise count unread notifications
      const count =
        response.totalUnread ??
        response.notifications?.filter((n) => !n.isRead).length ??
        0;

      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      // Don't update count on error to avoid clearing existing count
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await search(query, "all", 1, 10);
      setSearchResults(response);
      setShowResults(true);
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => performSearch(q), 300);
  };

  const handleResultClick = (type, item) => {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults(null);
    const id = item._id || item.id || item["*id"];
    if (!id) return;
    let path = "/";
    if (type === "artwork") path = `/artwork/${id}`;
    if (type === "user") path = `/profile/${id}`;
    if (type === "category") path = `/category/${id}`;
    navigate(path);
  };

  // Effect to fetch initial unread count when user logs in
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    } else {
      // Clear count when user logs out
      setUnreadCount(0);
    }
  }, [user]); // Dependency on user to refetch when login state changes

  // Optional: Set up periodic refresh of unread count
  useEffect(() => {
    if (!user) return;

    // Refresh unread count every 30 seconds (optional)
    const interval = setInterval(() => {
      if (!notifOpen) {
        // Only refresh if modal is not open to avoid conflicts
        fetchUnreadCount();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, notifOpen]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // Enhanced notification count update handler
  const handleUnreadCountChange = (count) => {
    setUnreadCount(count);
  };

  // Handle notification modal open
  const handleNotificationClick = () => {
    setNotifOpen(true);
  };

  const role = user?.userData?.role;

  return (
    <>
      <header className="app-header">
        {user ? (
          <div className={`header-inner ${role === "admin" ? "admin" : ""}`}>
            <nav className="nav-left">
              <Link to="/" className="nav-logo" draggable="false">
                <img src={logo} alt="Logo" />
              </Link>
              {role === "admin" ? (
                <>
                  <Link to="#" className="nav-icon">
                    <FaTools />
                  </Link>
                  <Link to={`/profile/${userId}`} className="nav-icon">
                    <FaUser />
                  </Link>
                  <Link to="#" className="nav-icon">
                    <MdOutlineExplore />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" className="nav-icon">
                    <IoHomeOutline />
                  </Link>
                  <Link to="#" className="nav-icon">
                    <MdOutlineExplore />
                  </Link>
                  <Link to="#" className="nav-icon">
                    <BsPencilFill />
                  </Link>
                </>
              )}
            </nav>

            <div className="search-container" ref={searchRef}>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search artworks, users, categories..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <FaSearch
                  className={`search-icon ${isSearching ? "searching" : ""}`}
                />
              </div>
              {showResults && (
                <div className="search-results">
                  {searchResults && (
                    <>
                      {searchResults.results.artworks?.length > 0 && (
                        <div className="results-section">
                          <h4>Artworks</h4>
                          {searchResults.results.artworks.map((a) => (
                            <div
                              key={a._id}
                              className="result-item"
                              onClick={() => handleResultClick("artwork", a)}
                            >
                              <span className="result-title">{a.title}</span>
                              {a.medium && (
                                <span className="result-subtitle">
                                  {a.medium}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.results.users?.length > 0 && (
                        <div className="results-section">
                          <h4>Users</h4>
                          {searchResults.results.users.map((u) => (
                            <div
                              key={u._id}
                              className="result-item"
                              onClick={() => handleResultClick("user", u)}
                            >
                              <span className="result-title">
                                {u.firstName} {u.lastName}
                              </span>
                              <span className="result-subtitle">{u.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.results.categories?.length > 0 && (
                        <div className="results-section">
                          <h4>Categories</h4>
                          {searchResults.results.categories.map((c) => (
                            <div
                              key={c._id}
                              className="result-item"
                              onClick={() => handleResultClick("category", c)}
                            >
                              <span className="result-title">{c.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!searchResults.results.artworks?.length &&
                        !searchResults.results.users?.length &&
                        !searchResults.results.categories?.length && (
                          <div className="no-results">
                            Nessun risultato trovato per "{searchQuery}"
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="nav-right">
              <button
                className="nav-icon btn-notif"
                onClick={handleNotificationClick}
                title="Notifiche"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <Link to={`/profile/${userId}`} className="nav-icon">
                <FaUser />
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        ) : (
          <div className="header-inner guest">
            <Link to="/login" className="nav-logo">
              <img src={logo} alt="Logo" />
            </Link>
            <nav className="nav-auth">
              {location.pathname === "/login" ? (
                <Link to="/signup" className="btn-auth">
                  Sign up
                </Link>
              ) : (
                <Link to="/login" className="btn-auth">
                  Log in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <NotificationsModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
}

export default Navbar;
