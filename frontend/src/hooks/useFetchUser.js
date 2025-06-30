import { useState, useEffect } from "react";
import { getUserById } from "../api/users";
import { useAuthContext } from "./useAuthContext";

/**
 * useFetchUser retrieves user data by ID or 'me' if no ID provided.
 */
export const useFetchUser = (userId) => {
  const { user: authUser } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = userId || "me";
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserById(id);
        if (isMounted) setProfile(data);
      } catch (err) {
        if (isMounted) setError(err.payload || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { profile, loading, error };
};
