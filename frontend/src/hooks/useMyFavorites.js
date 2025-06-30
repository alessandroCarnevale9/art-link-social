import { useState, useEffect } from "react";
import { getMyFavorites } from "../api/favorites";

export const useMyFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyFavorites();
        if (isMounted) setFavorites(data);
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
  }, []);

  return { favorites, loading, error };
};
