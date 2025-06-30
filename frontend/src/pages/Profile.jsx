import React from "react";
import { useParams } from "react-router-dom";
import { useFetchUser } from "../hooks/useFetchUser";
import { useFetchArtworks } from "../hooks/useFetchArtworks";
import FollowButton from "../components/FollowButton";
import FollowersList from "../components/FollowersList";
import FollowingList from "../components/FollowingList";

function Profile() {
  const { userId } = useParams();
  const { profile, loading: loadUser, error: errUser } = useFetchUser(userId);
  // fetch artworks by authorId (user uploads)
  const {
    artworks,
    loading: loadArts,
    error: errArts,
  } = useFetchArtworks({ authorId: profile?._id });

  if (loadUser) return <p>Loading profile...</p>;
  if (errUser) return <p>Error: {errUser.message || errUser}</p>;

  if (!profile) return <p>User not found.</p>;

  return (
    <div>
      <h1>
        {profile.firstName} {profile.lastName}
      </h1>
      <p>{profile.bio}</p>
      <FollowButton profileUserId={profile._id} />

      <section>
        <h2>Followers</h2>
        <FollowersList profileUserId={profile._id} />
      </section>

      <section>
        <h2>Following</h2>
        <FollowingList profileUserId={profile._id} />
      </section>

      <section>
        <h2>Artworks</h2>
        {loadArts && <p>Loading artworks...</p>}
        {errArts && <p>Error: {errArts.message || errArts}</p>}
        {!loadArts && !errArts && (
          <ul>
            {artworks.map((a) => (
              <li key={a._id}>{a.title}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Profile;
