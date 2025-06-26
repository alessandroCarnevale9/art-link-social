import { createContext, useReducer, useEffect } from "react";

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

  // Un JWT token è fatto da tre parti: HEADER.PAYLOAD.SIGNATURE

  try {
    const [, payload] = token.split(".");
    console.log(`--->\t${atob(payload)}`)
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
};

// Helper to validate JWT expiration
const isTokenValid = (token) => {
  if (!token) return false;
  const { exp } = parseJwt(token);
  // exp is in seconds, Date.now() in ms
  return typeof exp === "number" && Date.now() < exp * 1000;
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { user: null });

  useEffect(() => {
    // let refreshTimeout;

    // const scheduleRefresh = (exp) => {
    //   const delay = exp * 1000 - Date.now() - 5000; // 5s before expiration
    //   if (delay > 0) {
    //     refreshTimeout = setTimeout(tryRefresh, delay);
    //   }
    // };

    const tryRefresh = async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          handleLogout();
          return;
        }
        const json = await res.json(); // user data + new access token
        localStorage.setItem("jwt", JSON.stringify(json));
        dispatch({ type: "LOGIN", payload: json });
        // const { exp } = parseJwt(json.accessToken);
        // scheduleRefresh(exp);
      } catch (err) {
        console.error("Refresh error:", err);
        handleLogout();
      }
    };

    const handleLogout = () => {
      localStorage.removeItem("jwt");
      dispatch({ type: "LOGOUT" });
    };

    // 1) Leggo da localStorage e verifico che il token non sia scaduto
    const raw = localStorage.getItem("jwt"); // access token + user data
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.accessToken;
        if (isTokenValid(token)) {
          dispatch({ type: "LOGIN", payload: parsed });
          // const { exp } = parseJwt(token);
          // scheduleRefresh(exp);
          return;
        }
      } catch {
        // JSON malformato
      }
      // Rimuovo token scaduto o malformato
      localStorage.removeItem("jwt");
    }
    // 2) Fallback: refresh via cookie
    tryRefresh();

    // return () => clearTimeout(refreshTimeout);
  }, [dispatch]);

  console.log("AuthContext state:", state);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
