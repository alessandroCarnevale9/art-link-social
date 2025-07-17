import { useAuthContext } from "./useAuthContext";
import { logout as apiLogout } from "../api/auth";

export const useLogout = () => {
  const { dispatch } = useAuthContext();

  const logout = async () => {
    // Rimuovo subito il token in locale
    localStorage.removeItem("jwt");

    try {
      await apiLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }

    // Aggiorno il context
    dispatch({ type: "LOGOUT" });
  };

  return { logout };
};
