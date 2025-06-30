import { useState, useEffect, useCallback } from 'react';
import { getComments } from '../api/comments';

export const useComments = (artId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!artId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getComments(artId);
      setComments(data);
    } catch (err) {
      setError(err.payload || err);
    } finally {
      setLoading(false);
    }
  }, [artId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, loading, error, refresh: fetchComments };
};
