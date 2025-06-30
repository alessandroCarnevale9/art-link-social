import React, { useState, useEffect } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowUser } from "../hooks/useFollowUser";
import { useUnfollowUser } from "../hooks/useUnfollowUser";

/**
 * FollowButton toggles following status for a given user profile.
 * Props:
 * - profileUserId: string
 */
function FollowButton({ profileUserId }) {
  const { user } = useAuthContext();
  const currentUserId = user?.userData.id;
  const { following, loading: loadFollowList } = useFollowing(currentUserId);
  const { followUser, loading: loadFollow, error: errFollow } = useFollowUser();
  const {
    unfollowUser,
    loading: loadUnfollow,
    error: errUnfollow,
  } = useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(false);

  // Determine if current user already follows profileUser
  useEffect(() => {
    if (following && profileUserId) {
      setIsFollowing(following.some((u) => u._id === profileUserId));
    }
  }, [following, profileUserId]);

  const toggleFollow = async () => {
    if (!profileUserId) return;
    try {
      if (isFollowing) {
        await unfollowUser(profileUserId);
      } else {
        await followUser(profileUserId);
      }
      setIsFollowing((prev) => !prev);
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  if (loadFollowList) return null;

  return (
    <button onClick={toggleFollow} disabled={loadFollow || loadUnfollow}>
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}

export default FollowButton;
