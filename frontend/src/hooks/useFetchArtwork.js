import { useState, useEffect } from "react";
import { getArtworkById } from "../api/artworks";

export const useFetchArtwork = (id) => {
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getArtworkById(id);
        if (!isMounted) return;
        setArtwork(res);
      } catch (err) {
        if (!isMounted) return;
        setError(err.payload || err);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return { artwork, loading, error };
};
