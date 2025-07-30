import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import { IoHomeOutline, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { MdOutlineExplore } from "react-icons/md";
import { BsPencilFill } from "react-icons/bs";
import { FaSearch, FaBell, FaUser, FaTimes, FaTools } from "react-icons/fa";
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

  // Stati per il menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stati per la ricerca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef(null);
  const searchRef = useRef(null);

  // Stati per la ricerca mobile
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchResults, setMobileSearchResults] = useState(null);
  const [isMobileSearching, setIsMobileSearching] = useState(false);
  const [showMobileResults, setShowMobileResults] = useState(false);
  const mobileSearchTimeout = useRef(null);
  const mobileSearchRef = useRef(null);

  // Stati per il modal notifiche
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to fetch initial unread count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Fetch con parametri minimi per ottenere solo il conteggio
      const response = await getNotifications({
        page: 1,
        limit: 1, // Limite minimo per ridurre i dati trasferiti
      });

      // Usa totalUnread dal backend (ora sempre presente)
      const count = response.totalUnread ?? 0;
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      // Non aggiornare il count in caso di errore per evitare reset indesiderati
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
  };

  // Desktop search functions
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

  // Mobile search functions
  const performMobileSearch = async (query) => {
    if (!query.trim()) {
      setMobileSearchResults(null);
      setShowMobileResults(false);
      return;
    }
    setIsMobileSearching(true);
    try {
      const response = await search(query, "all", 1, 10);
      setMobileSearchResults(response);
      setShowMobileResults(true);
    } catch (error) {
      console.error("Errore durante la ricerca mobile:", error);
      setMobileSearchResults(null);
    } finally {
      setIsMobileSearching(false);
    }
  };

  const handleMobileSearchChange = (e) => {
    const q = e.target.value;
    setMobileSearchQuery(q);
    if (mobileSearchTimeout.current) clearTimeout(mobileSearchTimeout.current);
    mobileSearchTimeout.current = setTimeout(() => performMobileSearch(q), 300);
  };

  const handleResultClick = (type, item) => {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults(null);
    setIsMobileMenuOpen(false);
    const id = item._id || item.id || item["*id"];
    if (!id) return;
    let path = "/";
    if (type === "artwork") path = `/image/${id}`;
    if (type === "user") path = `/profile/${id}`;
    if (type === "category") path = `/category/${id}`;

    navigate(path);
  };

  const handleMobileResultClick = (type, item) => {
    setShowMobileResults(false);
    setMobileSearchQuery("");
    setMobileSearchResults(null);
    setIsMobileSearchOpen(false);
    const id = item._id || item.id || item["*id"];
    if (!id) return;
    let path = "/";
    if (type === "artwork") path = `/image/${id}`;
    if (type === "user") path = `/profile/${id}`;
    if (type === "category") path = `/category/${id}`;

    navigate(path);
  };

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMobileSearchOpen = () => {
    setIsMobileSearchOpen(true);
    setIsMobileMenuOpen(false);
    // Focus sul campo di ricerca dopo l'apertura del modal
    setTimeout(() => {
      const input = document.querySelector(".mobile-search-content input");
      if (input) input.focus();
    }, 100);
  };

  const handleMobileSearchClose = () => {
    setIsMobileSearchOpen(false);
    setMobileSearchQuery("");
    setMobileSearchResults(null);
    setShowMobileResults(false);
  };

  // Effect to fetch initial unread count when user logs in
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    } else {
      // Clear count when user logs out
      setUnreadCount(0);
    }
  }, [user]);

  // Refresh unread count periodically (solo quando il modal è chiuso)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!notifOpen) {
        fetchUnreadCount();
      }
    }, 30000); // 30 secondi

    return () => clearInterval(interval);
  }, [user, notifOpen]);

  // Cleanup search timeout
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
      if (mobileSearchTimeout.current)
        clearTimeout(mobileSearchTimeout.current);
    };
  }, []);

  // Chiudi menu mobile quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobileMenuOpen &&
        !e.target.closest(".mobile-menu") &&
        !e.target.closest(".mobile-menu-toggle")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Previeni scroll della pagina
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Gestisci scroll per il modal di ricerca mobile
  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSearchOpen]);

  // Effect per chiudere il menu mobile quando si allarga lo schermo
  useEffect(() => {
    const handleResize = () => {
      // Chiudi il menu mobile se la larghezza supera 640px (breakpoint desktop)
      if (window.innerWidth > 640) {
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    // Aggiungi listener per il resize
    window.addEventListener("resize", handleResize);

    // Chiamalo subito per verificare lo stato iniziale
    handleResize();

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handler per aggiornamenti del count dalle notifiche
  const handleUnreadCountChange = (count) => {
    setUnreadCount(count);
  };

  // Handle notification modal open/close
  const handleNotificationClick = () => {
    setNotifOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClose = () => {
    setNotifOpen(false);
    // Ricarica il count quando si chiude il modal per sincronizzare
    fetchUnreadCount();
  };

  const role = user?.userData?.role;

  // Render search results helper
  const renderSearchResults = (results, onResultClick) => {

    console.log("RESULTS --->\t", results)

    if (!results) return null;

    return (
      <>
        {results.results.artworks?.length > 0 && (
          <div className="results-section">
            <h4>Artworks</h4>
            {results.results.artworks.map((a) => (
              <div
                key={a._id}
                className="result-item"
                onClick={() => onResultClick("artwork", a)}
              >
                <span className="result-title">{a.title}</span>
                {a.medium && (
                  <span className="result-subtitle">{a.medium}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {results.results.users?.length > 0 && (
          <div className="results-section">
            <h4>Users</h4>
            {results.results.users.map((u) => (
              <div
                key={u._id}
                className="result-item"
                onClick={() => onResultClick("user", u)}
              >
                <span className="result-title">
                  {u.firstName} {u.lastName}
                </span>
                <span className="result-subtitle">{u.email}</span>
              </div>
            ))}
          </div>
        )}
        {results.results.categories?.length > 0 && (
          <div className="results-section">
            <h4>Categories</h4>
            {results.results.categories.map((c) => (
              <div
                key={c._id}
                className="result-item"
                onClick={() => onResultClick("category", c)}
              >
                <span className="result-title">{c.name}</span>
              </div>
            ))}
          </div>
        )}
        {!results.results.artworks?.length &&
          !results.results.users?.length &&
          !results.results.categories?.length && (
            <div className="no-results">No results found</div>
          )}
      </>
    );
  };

  return (
    <>
      <header className="app-header">
        {user ? (
          <div className={`header-inner ${role === "admin" ? "admin" : ""}`}>
            {/* Logo sempre visibile */}
            <Link to="/" className="nav-logo" draggable="false">
              <img src={logo} alt="Logo" />
            </Link>

            {/* Navigation Desktop */}
            <nav className="nav-left desktop-nav">
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

            {/* Search Container Desktop */}
            <div className="search-container desktop-search" ref={searchRef}>
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
                  {renderSearchResults(searchResults, handleResultClick)}
                </div>
              )}
            </div>

            {/* Nav Right Desktop */}
            <div className="nav-right desktop-nav">
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

            {/* Mobile Controls */}
            <div className="nav-right">
              {/* Mobile Search Button */}
              <button
                className="mobile-search-btn"
                onClick={handleMobileSearchOpen}
                aria-label="Open search"
              >
                <FaSearch />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <IoCloseOutline /> : <IoMenuOutline />}
              </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
              <>
                <div
                  className="mobile-menu-overlay"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <nav className="mobile-menu">
                  {/* Navigation Links Mobile */}
                  <div className="mobile-nav-links">
                    {role === "admin" ? (
                      <>
                        <Link
                          to="#"
                          className="mobile-nav-item"
                          onClick={handleMobileNavClick}
                        >
                          <FaTools />
                          <span>Tools</span>
                        </Link>
                        <Link
                          to={`/profile/${userId}`}
                          className="mobile-nav-item"
                          onClick={handleMobileNavClick}
                        >
                          <FaUser />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="#"
                          className="mobile-nav-item"
                          onClick={handleMobileNavClick}
                        >
                          <MdOutlineExplore />
                          <span>Explore</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/"
                          className="mobile-nav-item"
                          onClick={handleMobileNavClick}
                        >
                          <IoHomeOutline />
                          <span>Home</span>
                        </Link>
                        <Link
                          to="#"
                          className="mobile-nav-item"
                          onClick={handleMobileNavClick}
                        >
                          <MdOutlineExplore />
                          <span>Explore</span>
                        </Link>
                        <Link
                          to="#"
                          className="mobile-nav-item"
                          onClick={handleMobileNavClick}
                        >
                          <BsPencilFill />
                          <span>Create</span>
                        </Link>
                      </>
                    )}

                    <button
                      className="mobile-nav-item"
                      onClick={handleNotificationClick}
                    >
                      <FaBell />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="mobile-badge">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>

                    <Link
                      to={`/profile/${userId}`}
                      className="mobile-nav-item"
                      onClick={handleMobileNavClick}
                    >
                      <FaUser />
                      <span>Profile</span>
                    </Link>
                  </div>

                  {/* Logout Button Mobile */}
                  <button className="mobile-logout-btn" onClick={handleLogout}>
                    Log out
                  </button>
                </nav>
              </>
            )}
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

      {/* Mobile Search Modal */}
      {isMobileSearchOpen && (
        <>
          <div
            className="mobile-search-overlay"
            onClick={handleMobileSearchClose}
          />
          <div className="mobile-search-modal">
            <div className="mobile-search-header">
              <button
                className="mobile-search-close"
                onClick={handleMobileSearchClose}
                aria-label="Close search"
              >
                <FaTimes />
              </button>
              <h3 className="mobile-search-title">Search</h3>
            </div>
            <div className="mobile-search-content" ref={mobileSearchRef}>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search artworks, users, categories..."
                  value={mobileSearchQuery}
                  onChange={handleMobileSearchChange}
                  autoFocus
                />
                <FaSearch
                  className={`search-icon ${
                    isMobileSearching ? "searching" : ""
                  }`}
                />
              </div>
              {showMobileResults && (
                <div className="search-results">
                  {renderSearchResults(
                    mobileSearchResults,
                    handleMobileResultClick
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <NotificationsModal
        isOpen={notifOpen}
        onClose={handleNotificationClose}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
}

export default Navbar;
