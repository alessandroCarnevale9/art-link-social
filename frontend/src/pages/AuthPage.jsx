import { useLocation, useNavigate } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import AuthVideo from "../components/AuthVideo/AuthVideo";
import videoBg from "../assets/clip.mp4";
import "./css/AuthPage.css";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname === "/signup" ? "signup" : "login";

  const switchToSignup = () => navigate("/signup");
  const switchToLogin = () => navigate("/login");

  return (
    <div className="auth-page">
      <div className="auth-form">
        {mode === "login" ? (
          <Login switchToSignup={switchToSignup} />
        ) : (
          <Signup switchToLogin={switchToLogin} />
        )}
      </div>
      <div className="auth-video-container">
        <AuthVideo videoSrc={videoBg} />
      </div>
    </div>
  );
}