import React from "react";
import { useFollowing } from "../hooks/useFollowing";
import FollowButton from "./FollowButton";
import { Link } from "react-router-dom";

/**
 * FollowingList shows users whom the given profile user follows.
 * Props:
 * - profileUserId: string
 */
function FollowingList({ profileUserId }) {
  const { following, loading, error } = useFollowing(profileUserId);

  if (loading) return <p>Loading following...</p>;
  if (error) return <p>Error: {error.message || error}</p>;
  if (following.length === 0) return <p>Not following anyone.</p>;

  return (
    <ul>
      {following.map((u) => (
        <li key={u._id}>
          <Link to={`/profile/${u._id}`}>
            {u.firstName} {u.lastName}
          </Link>
          <FollowButton profileUserId={u._id} />
        </li>
      ))}
    </ul>
  );
}

export default FollowingList;
