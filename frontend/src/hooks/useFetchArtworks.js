import { useState, useEffect } from "react";
import { getAllArtworks } from "../api/artworks";

export const useFetchArtworks = (params = {}) => {
  const [artworks, setArtworks] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllArtworks(params);
        if (!isMounted) return;
        setArtworks(res.data);
        setMeta({ page: res.page, total: res.total, limit: res.limit });
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
  }, [JSON.stringify(params)]);

  return { artworks, meta, loading, error };
};
