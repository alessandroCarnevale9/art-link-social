import "./Navbar.css";
import logo from "../../assets/logo.png";
import { IoHomeOutline } from "react-icons/io5";
import { MdOutlineExplore } from "react-icons/md";
import { BsPencilFill } from "react-icons/bs";
import { FaSearch, FaBell, FaUser, FaTools } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";
import { useAuthContext } from "../../hooks/useAuthContext";

function Navbar() {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const userId = user?.userData.id;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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

            <div className="search-box">
              <input type="text" placeholder="Search..." />
              <FaSearch className="search-icon" />
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

            <div className="search-box">
              <input type="text" placeholder="Search..." />
              <FaSearch className="search-icon" />
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

          <nav className="nav-auth">
            <Link to="/login" className="btn-auth" draggable="false">
              Login
            </Link>
            <Link to="/signup" className="btn-auth" draggable="false">
              Signup
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
