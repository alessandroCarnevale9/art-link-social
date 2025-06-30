import { useState, useEffect } from "react";
import { getCategoryById } from "../api/categories";

export const useFetchCategory = (id) => {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCategoryById(id);
        if (!isMounted) return;
        setCategory(data);
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

  return { category, loading, error };
};
