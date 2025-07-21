import React, {
  createContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getMyFavorites } from "../api/favorites";

// Context e reducer per autenticazione e preferiti
export const AuthContext = createContext();

const initialState = {
  user: null,
  favorites: new Set(),
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { user: null, favorites: new Set() };
    case "SET_FAVORITES":
      return { ...state, favorites: action.payload };
    default:
      return state;
  }
};

// Parsing del payload JWT
const parseJwt = (token) => {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
};

// Controlla validità del token
const isTokenValid = (token) => {
  if (!token) return false;
  const { exp } = parseJwt(token);
  return typeof exp === "number" && Date.now() < exp * 1000;
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const refreshTimerRef = useRef(null);

  // Funzione per refresh del token via cookie
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

  // Al montaggio: ripristina login o refresh token
  useEffect(() => {
    (async () => {
      let jwt = null;
      const raw = localStorage.getItem("jwt");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (isTokenValid(parsed.accessToken)) {
            dispatch({ type: "LOGIN", payload: parsed });
            jwt = parsed;
          } else {
            jwt = await refreshToken();
          }
        } catch {
          localStorage.removeItem("jwt");
        }
      } else {
        jwt = await refreshToken();
      }
      setLoadingAuth(false);
    })();
  }, [refreshToken]);

  // Carica i preferiti ogni volta che l'utente effettua il login
  useEffect(() => {
    if (!state.user) return;
    (async () => {
      try {
        const favs = await getMyFavorites();
        const favSet = new Set(favs.map((a) => a.externalId || a._id));
        dispatch({ type: "SET_FAVORITES", payload: favSet });
      } catch (err) {
        console.error("Failed to load favorites after login:", err);
      }
    })();
  }, [state.user]);

  // Pianifica refresh automatico un minuto prima della scadenza
  useEffect(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const token = state.user?.accessToken;
    if (token) {
      const { exp } = parseJwt(token);
      const delay = exp * 1000 - Date.now() - 60_000;
      if (delay > 0) {
        refreshTimerRef.current = setTimeout(refreshToken, delay);
      }
    }
    return () => clearTimeout(refreshTimerRef.current);
  }, [state.user, refreshToken]);

  if (loadingAuth) {
    return <p>Loading authentication…</p>;
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        favorites: state.favorites,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
