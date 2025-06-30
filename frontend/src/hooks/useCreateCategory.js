import { useState } from "react";
import { createCategory } from "../api/categories";
import { useNavigate } from "react-router-dom";

export const useCreateCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const create = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await createCategory(data);
      navigate("/categories");
    } catch (err) {
      setError(err.payload || err);
    } finally {
      setLoading(false);
    }
  };

  return { createCategory: create, loading, error };
};
