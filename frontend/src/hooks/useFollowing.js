import { useState, useEffect } from "react";
import { getFollowing } from "../api/follow";

export const useFollowing = (userId) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFollowing(userId);
        if (isMounted) setFollowing(data);
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

  return { following, loading, error };
};
