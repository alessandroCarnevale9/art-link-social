import { createContext, useReducer, useEffect, useState } from "react";

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload };
    case "LOGOUT":
      return { user: null };
    default:
      return state;
  }
};

// Helper to decode JWT payload
const parseJwt = (token) => {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
};

// Helper to validate JWT expiration
const isTokenValid = (token) => {
  if (!token) return false;
  const { exp } = parseJwt(token);
  return typeof exp === "number" && Date.now() < exp * 1000;
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { user: null });
  // New loadingAuth state
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem("jwt");
      dispatch({ type: "LOGOUT" });
    };

    const tryRefresh = async () => {
      // 1) check localStorage
      const raw = localStorage.getItem("jwt");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const token = parsed?.accessToken;
          if (isTokenValid(token)) {
            dispatch({ type: "LOGIN", payload: parsed });
            setLoadingAuth(false);
            return;
          }
        } catch {
          // malformed JSON
        }
        localStorage.removeItem("jwt");
      }

      // 2) fallback: refresh via cookie
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          handleLogout();
        } else {
          const json = await res.json();
          localStorage.setItem("jwt", JSON.stringify(json));
          dispatch({ type: "LOGIN", payload: json });
        }
      } catch (err) {
        console.error("Refresh error:", err);
        handleLogout();
      } finally {
        setLoadingAuth(false);
      }
    };

    tryRefresh();
  }, [dispatch]);

  // While auth is loading, don't render children
  if (loadingAuth) {
    return null; // or a spinner
  }

  return (
    <AuthContext.Provider value={{ ...state, dispatch, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
