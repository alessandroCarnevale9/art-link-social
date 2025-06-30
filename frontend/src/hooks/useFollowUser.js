import { useState } from "react";
import { followUser } from "../api/follow";

export const useFollowUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const follow = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      await followUser(userId);
    } catch (err) {
      setError(err.payload || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { followUser: follow, loading, error };
};
