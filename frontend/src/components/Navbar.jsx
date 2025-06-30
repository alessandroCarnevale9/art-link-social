import React from "react";
import { Link } from "react-router-dom";
import { useLogout } from "../hooks/useLogout";
import { useAuthContext } from "../hooks/useAuthContext";

function Navbar() {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const userId = user?.userData.id;

  return (
    <header>
      <div className="container">
        <Link to="/">ArtLink</Link>
        <nav>
          {user ? (
            <>
              <Link to="/">Home</Link>
              <Link to="/favorites">My Favorites</Link>
              <Link to={userId ? `/profile/${userId}` : "/profile"}>
                My Profile
              </Link>
              <Link to="/profile/edit">Edit Profile</Link>
              <span>{user.userData.email}</span>
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
