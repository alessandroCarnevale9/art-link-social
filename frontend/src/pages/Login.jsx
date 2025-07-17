import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import {
  FaEnvelope,
  FaLock,
  FaFacebook,
  FaApple,
  FaGoogle,
} from "react-icons/fa";
import "./css/Form.css";

export default function Login({ switchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const { login, errors, isLoading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password, remember);
  };

  return (
    <form className="login" onSubmit={handleSubmit}>
      <h2>Sign in</h2>
      <p className="register-prompt">
        Don’t have an account?{" "}
        <button type="button" className="link-btn" onClick={switchToSignup}>
          Register here!
        </button>
      </p>

      <label>Email:</label>
      <div className="input-group">
        <FaEnvelope className="icon" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>

      <label>Password:</label>
      <div className="input-group">
        <FaLock className="icon" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>

      <div className="options">
        <label className="remember-me">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>
        <a href="#" className="forgot-link">
          Forgot Password?
        </a>
      </div>

      <button type="submit" disabled={isLoading} className="btn-login">
        {isLoading ? "Loading..." : "Log in"}
      </button>

      {errors && (
        <div className="error">
          {Array.isArray(errors) ? (
            errors.map((err, i) => <p key={i}>{err}</p>)
          ) : (
            <p>{errors}</p>
          )}
        </div>
      )}

      <div className="divider">
        <span>or continue with</span>
      </div>
      <div className="social-login">
        <button type="button" className="social-btn fb">
          <FaFacebook />
        </button>
        <button type="button" className="social-btn apple">
          <FaApple />
        </button>
        <button type="button" className="social-btn google">
          <FaGoogle />
        </button>
      </div>
    </form>
  );
}
