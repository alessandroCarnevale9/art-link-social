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

    tryRefresh();
  }, [dispatch]);

  console.log("AuthContext state:", state);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
