import { useState } from "react";
import { login as apiLogin } from "../api/auth";
import { useAuthContext } from "./useAuthContext";

export const useLogin = () => {
  const [errors, setErrors] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const login = async (email, password) => {
    setLoading(true);
    setErrors(null);
    try {
      // chiama apiFetch("/api/auth/login", { method: "POST", body: { email, password } })
      const json = await apiLogin({ email, password });

      // salva token+userdata
      localStorage.setItem("jwt", JSON.stringify(json));

      // aggiorna il context
      dispatch({ type: "LOGIN", payload: json });
    } catch (err) {
      // err.payload viene da apiFetch in caso di 4xx/5xx
      setErrors(err.payload?.errors || [err.message]);
    } finally {
      setLoading(false);
    }
  };

  return { login, isLoading, errors };
};
