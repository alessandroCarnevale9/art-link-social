import { useState } from "react";
import { updateCategory } from "../api/categories";
import { useNavigate } from "react-router-dom";

export const useUpdateCategory = (id) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const update = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await updateCategory(id, data);
      navigate(`/category/${id}`);
    } catch (err) {
      setError(err.payload || err);
    } finally {
      setLoading(false);
    }
  };

  return { updateCategory: update, loading, error };
};
