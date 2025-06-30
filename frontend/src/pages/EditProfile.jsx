import React, { useState, useEffect } from "react";
import { useFetchUser } from "../hooks/useFetchUser";
import { useUpdateMe } from "../hooks/useUpdateMe";

/**
 * EditProfile allows the authenticated user to view and edit their own profile.
 */
function EditProfile() {
  const { profile, loading: loadProfile, error: errProfile } = useFetchUser();
  const { updateMe, loading: loadSave, error: errSave } = useUpdateMe();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setEmail(profile.email || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { firstName, lastName, email, bio };
    try {
      await updateMe(data);
      alert("Profile updated successfully");
    } catch {}
  };

  if (loadProfile) return <p>Loading profile...</p>;
  if (errProfile)
    return <p>Error loading profile: {errProfile.message || errProfile}</p>;

  return (
    <div>
      <h1>Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <label>First Name:</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <label>Last Name:</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} />

        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Bio:</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />

        <button type="submit" disabled={loadSave}>
          {loadSave ? "Saving..." : "Save Changes"}
        </button>
      </form>
      {errSave && <p>Error saving profile: {errSave.message || errSave}</p>}
    </div>
  );
}

export default EditProfile;
