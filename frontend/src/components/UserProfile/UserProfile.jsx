import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiMoreHorizontal } from "react-icons/fi";
import { getUserById, getMe } from "../../api/users";
import { getAllArtworks } from "../../api/artworks";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../../api/follow";
import "./UserProfile.css";

const extractId = (u) => u?._id || u?.id || null;

const UserProfile = ({ isOwnProfile = false }) => {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();

  // ─────────────── state ───────────────
  const [userProfile, setUserProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);

  // ─────────────── helpers ───────────────
  const loadUserProfile = useCallback(async () => {
    try {
      const data = isOwnProfile
        ? await getMe()
        : paramUserId
        ? await getUserById(paramUserId)
        : (() => {
            throw new Error("Missing user ID");
          })();
      setUserProfile(data);
      return data;
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Unable to load user profile");
      return null;
    }
  }, [isOwnProfile, paramUserId]);

  const loadUserArtworks = async (id) => {
    try {
      const { data } = await getAllArtworks({
        authorId: id,
        sortBy: "date",
        limit: 20,
      });

      console.log(`ARTWORK DATA ${JSON.stringify(data)}\nID: ${id}`);

      setArtworks(data || []);
    } catch (err) {
      console.error("Error loading artworks:", err);
      setArtworks([]);
    }
  };

  const loadFollowData = async (id) => {
    try {
      const [followersData, followingData] = await Promise.all([
        getFollowers(id),
        getFollowing(id),
      ]);
      setFollowers(followersData || []);
      setFollowing(followingData || []);
    } catch (err) {
      console.error("Error loading follow data:", err);
      setFollowers([]);
      setFollowing([]);
    }
  };

  // ─────────────── toggle follow / unfollow ───────────────
  const handleFollowToggle = async () => {
    const targetUserId = extractId(userProfile);
    if (!targetUserId || actionLoading || isOwnProfile) return;

    setActionLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(targetUserId);
        setIsFollowing(false);
        setFollowers((prev) =>
          prev.filter((f) => extractId(f) !== currentUserId)
        );
      } else {
        await followUser(targetUserId);
        setIsFollowing(true);
        const me = await getMe();
        const meId = extractId(me);
        setFollowers((prev) =>
          prev.some((f) => extractId(f) === meId) ? prev : [...prev, me]
        );
      }
    } catch (err) {
      console.error("Error in follow operation:", err);
      setError("Unable to complete operation");
      setIsFollowing((prev) => !prev); // rollback
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────── artwork click handler ───────────────
  const handleArtworkClick = (artwork) => {
    // Usa externalId se disponibile, altrimenti _id
    const artworkId = artwork.externalId || artwork._id;
    console.log("Navigating to artwork:", artworkId, artwork);
    navigate(`/image/${artworkId}`);
  };

  // ─────────────── initial loading ───────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getMe();
        setCurrentUserId(extractId(me));
        const targetUser = await loadUserProfile();
        const targetUserId = extractId(targetUser);
        if (targetUserId) {
          await Promise.all([
            loadUserArtworks(targetUserId),
            loadFollowData(targetUserId),
          ]);
        }
      } catch (e) {
        console.error("Error loading data:", e);
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [paramUserId, isOwnProfile, loadUserProfile]);

  // ─────────────── sync isFollowing ───────────────
  useEffect(() => {
    if (!currentUserId || !userProfile || isOwnProfile) {
      setIsFollowing(false);
    } else {
      setIsFollowing(followers.some((f) => extractId(f) === currentUserId));
    }
  }, [followers, currentUserId, userProfile, isOwnProfile]);

  // ─────────────── render ───────────────
  if (loading)
    return (
      <div className="user-profile">
        <div className="profile-header">
          <div className="loading-placeholder">Loading...</div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="user-profile">
        <div className="profile-header">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  if (!userProfile)
    return (
      <div className="user-profile">
        <div className="profile-header">
          <div className="error-message">Profile not found</div>
        </div>
      </div>
    );

  const getAvatar = () =>
    userProfile.profileImage ? (
      <img
        src={userProfile.profileImage}
        alt={`${userProfile.firstName} ${userProfile.lastName}`}
        className="avatar-image"
      />
    ) : (
      <span className="avatar-text">
        {(userProfile.firstName?.[0] || "") +
          (userProfile.lastName?.[0] || "") || "U"}
      </span>
    );

  const getDisplayName = () =>
    userProfile.firstName || userProfile.lastName
      ? `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim()
      : userProfile.email?.split("@")[0] || "User";

  const isViewingOwnProfile =
    isOwnProfile || (currentUserId && extractId(userProfile) === currentUserId);

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="avatar">{getAvatar()}</div>
        <h1 className="username">{getDisplayName()}</h1>
        {userProfile.bio && <p className="user-bio">{userProfile.bio}</p>}

        <div className="stats">
          <span className="stat-item">
            <span className="stat-number">{followers.length}</span> followers
          </span>
          <span className="stat-item">
            <span className="stat-number">{following.length}</span> following
          </span>
          <span className="stat-item">
            <span className="stat-number">{artworks.length}</span> artworks
          </span>
        </div>

        <div className="action-buttons">
          {!isViewingOwnProfile && (
            <button
              onClick={handleFollowToggle}
              className={`follow-btn ${isFollowing ? "following" : ""}`}
              disabled={actionLoading}
            >
              <span className="label-default">
                {actionLoading
                  ? "Loading..."
                  : isFollowing
                  ? "Following"
                  : "Follow"}
              </span>
              <span className="label-unfollow">Unfollow</span>
            </button>
          )}
          <button className="more-btn">
            <FiMoreHorizontal className="icon" />
          </button>
        </div>
      </div>

      <div className="content-section">
        {artworks.length ? (
          <div className="artworks-grid">
            {artworks.map((artwork, idx) => (
              <div
                key={artwork._id}
                className="artwork-item"
                onClick={() => handleArtworkClick(artwork)}
                onKeyDown={(e) =>
                  ["Enter", " "].includes(e.key) && handleArtworkClick(artwork)
                }
                tabIndex={0}
                role="button"
                aria-label={`View artwork: ${artwork.title}`}
              >
                <div className="artwork-container">
                  {artwork.primaryImageSmall ? (
                    <img
                      src={artwork.primaryImageSmall}
                      alt={artwork.title}
                      className="artwork-image"
                      style={{ height: `${280 + (idx % 3) * 80}px` }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML = `<div class="artwork-placeholder" style="height: ${
                          280 + (idx % 3) * 80
                        }px">${artwork.title}</div>`;
                      }}
                    />
                  ) : (
                    <div
                      className="artwork-placeholder"
                      style={{ height: `${280 + (idx % 3) * 80}px` }}
                    >
                      {artwork.title}
                    </div>
                  )}
                  <div className="artwork-overlay">
                    <h3 className="artwork-title">{artwork.title}</h3>
                    {artwork.medium && (
                      <p className="artwork-medium">{artwork.medium}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {isViewingOwnProfile
                ? "You haven't uploaded any artworks yet."
                : "This user hasn't uploaded any artworks yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
