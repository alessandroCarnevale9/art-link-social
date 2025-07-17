import { useState } from "react";
import { useSignup } from "../hooks/useSignup";
import { FaEnvelope, FaUser, FaLock } from "react-icons/fa";
import "./css/Form.css";

export default function Signup({ switchToLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signup, errors, isLoading } = useSignup();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup({ email, username, password, confirmPassword });
  };

  return (
    <form className="login" onSubmit={handleSubmit}>
      <h2>Sign up</h2>
      <p className="register-prompt">
        Already have an account?{" "}
        <button type="button" className="link-btn" onClick={switchToLogin}>
          Sign in here!
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

      <label>Username:</label>
      <div className="input-group">
        <FaUser className="icon" />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
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

      <label>Confirm Password:</label>
      <div className="input-group">
        <FaLock className="icon" />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn-signup">
        {isLoading ? "Loading..." : "Register"}
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
    </form>
  );
}
