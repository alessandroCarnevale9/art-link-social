import { useState, useEffect } from "react";
import { getFollowers } from "../api/follow";

export const useFollowers = (userId) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFollowers(userId);
        if (isMounted) setFollowers(data);
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

  return { followers, loading, error };
};
