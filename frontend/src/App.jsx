import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./hooks/useAuthContext";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home";
import AdminHome from "./pages/AdminHome";
import AuthPage from "./pages/AuthPage";
import ImageDetail from "./components/ImageDetail/ImageDetail";

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
          {/* Rotta protetta: home o admin */}
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
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Rotta protetta: dettaglio immagine */}
          <Route
            path="/image/:id"
            element={user ? <ImageDetail /> : <Navigate to="/login" replace />}
          />

          {/* Login e Signup gestiti da AuthPage */}
          <Route
            path="/login"
            element={
              !user ? (
                <AuthPage initialMode="login" />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !user ? (
                <AuthPage initialMode="signup" />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* fallback */}
          <Route
            path="*"
            element={<Navigate to={user ? "/" : "/login"} replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
