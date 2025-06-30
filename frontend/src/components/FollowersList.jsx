import React from "react";
import { useFollowers } from "../hooks/useFollowers";
import FollowButton from "./FollowButton";
import { Link } from "react-router-dom";

/**
 * FollowersList shows users who follow the given profile user.
 * Props:
 * - profileUserId: string
 */
function FollowersList({ profileUserId }) {
  const { followers, loading, error } = useFollowers(profileUserId);

  if (loading) return <p>Loading followers...</p>;
  if (error) return <p>Error: {error.message || error}</p>;
  if (followers.length === 0) return <p>No followers yet.</p>;

  return (
    <ul>
      {followers.map((f) => (
        <li key={f._id}>
          <Link to={`/profile/${f._id}`}>
            {f.firstName} {f.lastName}
          </Link>
          {/* Allow unfollow if viewing own following list? */}
        </li>
      ))}
    </ul>
  );
}

export default FollowersList;
