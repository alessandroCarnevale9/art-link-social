import { useState, useEffect } from "react";
import { getAllArtists } from "../api/artists";

export const useFetchArtists = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllArtists();
        if (!isMounted) return;
        setArtists(data);
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
  }, []);

  return { artists, loading, error };
};
