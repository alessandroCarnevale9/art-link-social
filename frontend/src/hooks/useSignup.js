import { useState } from "react";
import { createUser } from "../api/users";
import { useAuthContext } from "./useAuthContext";

export const useSignup = () => {
  const [errors, setErrors] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const signup = async (firstName, lastName, email, password, role) => {
    setIsLoading(true);
    setErrors(null);

    try {
      const json = await createUser({
        firstName,
        lastName,
        email,
        password,
        role,
      });

      // salva token + userData
      localStorage.setItem("jwt", JSON.stringify(json));

      // aggiorna il contesto
      dispatch({ type: "LOGIN", payload: json });
    } catch (err) {
      // prendo eventuali errori dal body (err.payload.errors) o uso il messaggio
      setErrors(err.payload?.errors || [err.message]);
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading, errors };
};
