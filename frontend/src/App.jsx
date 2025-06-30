import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./hooks/useAuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import PinDetail from "./pages/PinDetail";
import CreatePin from "./pages/CreatePin";
import EditPin from "./pages/EditPin";
import FavoritesList from "./pages/FavoritesList";
import AdminHome from "./pages/AdminHome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const App = () => {
  const { user, loadingAuth } = useAuthContext();

  if (loadingAuth) {
    return <p>Loading...</p>;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div className="pages">
        <Routes>
          {/* Home/AdminHome */}
          <Route
            path="/"
            element={
              user ? (
                user.userData.role === "admin" ? (
                  <AdminHome />
                ) : (
                  <Home />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Dettaglio pin */}
          <Route
            path="/pin/:pinId"
            element={user ? <PinDetail /> : <Navigate to="/login" />}
          />

          {/* CRUD opere */}
          <Route
            path="/create-pin"
            element={user ? <CreatePin /> : <Navigate to="/login" />}
          />
          <Route
            path="/edit-pin/:pinId"
            element={user ? <EditPin /> : <Navigate to="/login" />}
          />

          {/* Favorites */}
          <Route
            path="/favorites"
            element={user ? <FavoritesList /> : <Navigate to="/login" />}
          />

          {/* Autenticazione */}
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/signup"
            element={!user ? <Signup /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
