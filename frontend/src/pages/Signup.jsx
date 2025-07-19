import { useState } from "react";
import { useSignup } from "../hooks/useSignup";
import { FaEnvelope, FaUser, FaLock } from "react-icons/fa";
import "./css/Form.css";

export default function Signup({ switchToLogin }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, errors, isLoading } = useSignup();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(name, surname, email, password);
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

      <label>Name:</label>
      <div className="input-group">
        <FaUser className="icon" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          required
        />
      </div>

      <label>Surname:</label>
      <div className="input-group">
        <FaUser className="icon" />
        <input
          type="text"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder="Type your surname"
          required
        />
      </div>

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
