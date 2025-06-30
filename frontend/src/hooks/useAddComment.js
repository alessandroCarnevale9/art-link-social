import { useState } from "react";
import { addComment } from "../api/comments";

export const useAddComment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const add = async (artId, data) => {
    setLoading(true);
    setError(null);
    try {
      await addComment(artId, data);
    } catch (err) {
      setError(err.payload || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addComment: add, loading, error };
};
