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
import { useState, useRef, useEffect } from "react";

function Navbar() {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation(); // Per rilevare la route corrente
  const userId = user?.userData.id;

  // Stati per la ricerca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef(null);
  const searchRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Funzione per eseguire la ricerca
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

  // Gestisce il cambiamento nell'input di ricerca con debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Gestisce il click su un risultato di ricerca
  const handleResultClick = (type, item) => {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults(null);
    console.log("item ---> \t", item);

    const getId = (obj) => {
      return obj._id || obj.id || obj["*id"] || null;
    };

    const itemId = getId(item);
    if (!itemId) {
      console.error("ID non trovato per item:", item);
      return;
    }

    switch (type) {
      case "artwork":
        console.log(`artwork ID ${itemId}`);
        navigate(`/artwork/${itemId}`);
        break;
      case "user":
        console.log(`user ID ${itemId}`);
        navigate(`/profile/${itemId}`);
        break;
      case "category":
        console.log(`category ID ${itemId}`);
        navigate(`/category/${itemId}`);
        break;
      default:
        break;
    }
  };

  // Chiude i risultati quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup del timeout
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Determina quale pulsante mostrare in base alla route corrente
  const getAuthButton = () => {
    const currentPath = location.pathname;

    if (currentPath === "/login") {
      return (
        <Link to="/signup" className="btn-auth" draggable="false">
          Sign up
        </Link>
      );
    } else {
      return (
        <Link to="/login" className="btn-auth" draggable="false">
          Log in
        </Link>
      );
    }
  };

  const role = user?.userData?.role;

  return (
    <header className="app-header">
      {user ? (
        role === "admin" ? (
          <div className="header-inner admin">
            <nav className="nav-left">
              <Link to="/" className="nav-logo" draggable="false">
                <img src={logo} alt="Logo" draggable="false" />
              </Link>
              <Link to="#" className="nav-icon">
                <FaTools />
              </Link>
              <Link
                to={userId ? `/profile/${userId}` : "/profile"}
                className="nav-icon"
              >
                <FaUser />
              </Link>
              <Link to="#" className="nav-icon">
                <MdOutlineExplore />
              </Link>
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
                      {/* Risultati Artworks */}
                      {searchResults.results.artworks?.length > 0 && (
                        <div className="results-section">
                          <h4>Artworks</h4>
                          {searchResults.results.artworks.map((artwork) => (
                            <div
                              key={artwork._id}
                              className="result-item"
                              onClick={() =>
                                handleResultClick("artwork", artwork)
                              }
                            >
                              <span className="result-title">
                                {artwork.title}
                              </span>
                              {artwork.medium && (
                                <span className="result-subtitle">
                                  {artwork.medium}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Risultati Users */}
                      {searchResults.results.users?.length > 0 && (
                        <div className="results-section">
                          <h4>Users</h4>
                          {searchResults.results.users.map((user) => (
                            <div
                              key={user._id}
                              className="result-item"
                              onClick={() => handleResultClick("user", user)}
                            >
                              <span className="result-title">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="result-subtitle">
                                {user.email}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Risultati Categories */}
                      {searchResults.results.categories?.length > 0 && (
                        <div className="results-section">
                          <h4>Categories</h4>
                          {searchResults.results.categories.map((category) => (
                            <div
                              key={category._id}
                              className="result-item"
                              onClick={() =>
                                handleResultClick("category", category)
                              }
                            >
                              <span className="result-title">
                                {category.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Nessun risultato */}
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
            <div className="user-info">
              <span className="user-email">
                <b>Admin</b>: {user.userData.email}
              </span>
              <button className="btn-logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        ) : (
          <div className="header-inner">
            <nav className="nav-left">
              <Link to="/" className="nav-logo" draggable="false">
                <img src={logo} alt="Logo" draggable="false" />
              </Link>
              <Link to="/" className="nav-icon">
                <IoHomeOutline />
              </Link>
              <Link to="#" className="nav-icon">
                <MdOutlineExplore />
              </Link>
              <Link to="#" className="nav-icon">
                <BsPencilFill />
              </Link>
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
                      {/* Risultati Artworks */}
                      {searchResults.results.artworks?.length > 0 && (
                        <div className="results-section">
                          <h4>Artworks</h4>
                          {searchResults.results.artworks.map((artwork) => (
                            <div
                              key={artwork._id}
                              className="result-item"
                              onClick={() =>
                                handleResultClick("artwork", artwork)
                              }
                            >
                              <span className="result-title">
                                {artwork.title}
                              </span>
                              {artwork.medium && (
                                <span className="result-subtitle">
                                  {artwork.medium}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Risultati Users */}
                      {searchResults.results.users?.length > 0 && (
                        <div className="results-section">
                          <h4>Users</h4>
                          {searchResults.results.users.map((user) => (
                            <div
                              key={user._id}
                              className="result-item"
                              onClick={() => handleResultClick("user", user)}
                            >
                              <span className="result-title">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="result-subtitle">
                                {user.email}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Risultati Categories */}
                      {searchResults.results.categories?.length > 0 && (
                        <div className="results-section">
                          <h4>Categories</h4>
                          {searchResults.results.categories.map((category) => (
                            <div
                              key={category._id}
                              className="result-item"
                              onClick={() =>
                                handleResultClick("category", category)
                              }
                            >
                              <span className="result-title">
                                {category.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Nessun risultato */}
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
            <div className="user-info">
              <nav className="nav-right">
                <Link to="#" className="nav-icon">
                  <FaBell />
                </Link>
                <Link
                  to={userId ? `/profile/${userId}` : "/profile"}
                  className="nav-icon"
                >
                  <FaUser />
                </Link>
              </nav>
              <span className="user-email">{user.userData.email}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="header-inner guest">
          <Link to="/login" className="nav-logo" draggable="false">
            <img src={logo} alt="Logo" draggable="false" />
          </Link>
          <nav className="nav-auth">{getAuthButton()}</nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
