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

// Decodifica il payload del JWT
const parseJwt = (token) => {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
};

// Controlla scadenza token
const isTokenValid = (token) => {
  if (!token) return false;
  const { exp } = parseJwt(token);
  return typeof exp === "number" && Date.now() < exp * 1000;
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { user: null });
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Svuota localStorage e logout in caso di token non valido
    const handleLogout = () => {
      localStorage.removeItem("jwt");
      dispatch({ type: "LOGOUT" });
    };

    const initializeAuth = async () => {
      // 1) Provo a prendere il token da localStorage
      const raw = localStorage.getItem("jwt");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (isTokenValid(parsed.accessToken)) {
            dispatch({ type: "LOGIN", payload: parsed });
            setLoadingAuth(false);
            return;
          }
        } catch {
          /* JSON malformato */
        }
        localStorage.removeItem("jwt");
      }

      // 2) Se non ho token valido, provo il refresh via cookie
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
      } catch {
        handleLogout();
      } finally {
        setLoadingAuth(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Finché siamo in fase di verifica non mostriamo i figli
  if (loadingAuth) {
    return <p>Loading authentication…</p>;
  }

  return (
    <AuthContext.Provider value={{ ...state, dispatch, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
