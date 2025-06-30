import { useState } from "react";
import { unfollowUser } from "../api/follow";

export const useUnfollowUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const unfollow = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      await unfollowUser(userId);
    } catch (err) {
      setError(err.payload || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { unfollowUser: unfollow, loading, error };
};
