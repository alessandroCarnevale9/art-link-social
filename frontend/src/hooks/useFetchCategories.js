import { useState, useEffect } from "react";
import { getAllCategories } from "../api/categories";

export const useFetchCategories = (params = {}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllCategories(params);
        if (!isMounted) return;
        setCategories(data);
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

  return { categories, loading, error };
};
