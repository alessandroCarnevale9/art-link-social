import { useState } from "react";
import { deleteCategory } from "../api/categories";
import { useNavigate } from "react-router-dom";

export const useDeleteCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const remove = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCategory(id);
      navigate("/categories");
    } catch (err) {
      setError(err.payload || err);
    } finally {
      setLoading(false);
    }
  };

  return { deleteCategory: remove, loading, error };
};
