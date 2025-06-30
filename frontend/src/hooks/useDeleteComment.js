import { useState } from "react";
import { deleteComment } from "../api/comments";

export const useDeleteComment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = async (artId, commentId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteComment(artId, commentId);
    } catch (err) {
      setError(err.payload || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { removeComment: remove, loading, error };
};
