import { useState } from "react";
import { updateMe } from "../api/users";

/**
 * useUpdateMe provides functionality to update the authenticated user's profile.
 */
export const useUpdateMe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const save = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await updateMe(data);
    } catch (err) {
      setError(err.payload || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateMe: save, loading, error };
};
