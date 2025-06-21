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

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { user: null });

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          return dispatch({ type: "LOGOUT" });
        }
        const json = await res.json();
        dispatch({ type: "LOGIN", payload: json });
      } catch (err) {
        console.error("Refresh fallito:", err);
        dispatch({ type: "LOGOUT" });
      }
    };

    // Provo a leggere da localStorage
    const raw = localStorage.getItem("jwt");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // parsed deve essere { userData: {...}, accessToken: "..." }
        if (parsed?.userData && parsed?.accessToken) {
          dispatch({ type: "LOGIN", payload: parsed });
          return; // non fare il refresh
        }
      } catch {
        // se il JSON è malformato, rimuovo e proseguo al refresh
        localStorage.removeItem("jwt");
      }
    }

    // 2) Se non ho un JWT valido in localStorage, provo il refresh via cookie
    tryRefresh();
  }, [dispatch]);

  console.log("AuthContext state:", state);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
