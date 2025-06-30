import React, {
  createContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

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

// Decode JWT payload
const parseJwt = (token) => {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
};

// Check token expiration
const isTokenValid = (token) => {
  if (!token) return false;
  const { exp } = parseJwt(token);
  return typeof exp === "number" && Date.now() < exp * 1000;
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { user: null });
  const [loadingAuth, setLoadingAuth] = useState(true);
  const refreshTimerRef = useRef(null);

  // effettua refresh via cookie
  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Refresh failed");
      const json = await res.json();
      localStorage.setItem("jwt", JSON.stringify(json));
      dispatch({ type: "LOGIN", payload: json });
      return json;
    } catch {
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("jwt");
      return null;
    }
  }, []);

  // 1) Carica / refresh al mount
  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem("jwt");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (isTokenValid(parsed.accessToken)) {
            dispatch({ type: "LOGIN", payload: parsed });
          } else {
            await refreshToken();
          }
        } catch {
          localStorage.removeItem("jwt");
        }
      } else {
        await refreshToken();
      }
      setLoadingAuth(false);
    })();
  }, [refreshToken]);

  // 2) Schedule NEXT refresh SOLO quando user diventa non-null
  useEffect(() => {
    // cancello eventuale timer precedente
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    // se ho un token valido, calcolo scadenza
    const token = state.user?.accessToken;
    if (token) {
      const { exp } = parseJwt(token);
      const delay = exp * 1000 - Date.now() - 60 * 1000; // 1 min prima
      if (delay > 0) {
        refreshTimerRef.current = setTimeout(() => {
          refreshToken();
        }, delay);
      }
    }
    // pulisco al logout
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [state.user, refreshToken]);

  if (loadingAuth) {
    return <p>Loading authentication…</p>;
  }

  return (
    <AuthContext.Provider value={{ user: state.user, dispatch, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
