import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useSignup = () => {
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const signup = async (email, password, role) => {
    setIsLoading(true);
    setErrors([]);

    const response = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, role }),
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

  return { signup, isLoading, errors };
};
