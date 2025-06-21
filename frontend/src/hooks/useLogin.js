import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useLogin = () => {
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const login = async (email, password) => {
    setIsLoading(true);
    setErrors([]);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // include i cookies
      body: JSON.stringify({ email, password }),
    });

    const json = await response.json();

    if (!response.ok) {
      setIsLoading(false);
      setErrors(json.errors);
      return;
    }

    // save JWT to local storage
    localStorage.setItem("jwt", JSON.stringify(json));

    // update the auth context
    dispatch({ type: "LOGIN", payload: json });

    setIsLoading(false);
  };

  return { login, isLoading, errors };
};
