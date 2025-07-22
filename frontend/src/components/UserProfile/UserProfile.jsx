import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
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

const UserProfile = ({ isOwnProfile = false, onArtworkClick = null }) => {
  const { userId: paramUserId } = useParams();

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
      let data;

      if (isOwnProfile) {
        // Se è il proprio profilo, carica sempre getMe()
        data = await getMe();
      } else if (paramUserId) {
        // Se è un altro profilo e abbiamo l'ID, caricalo
        data = await getUserById(paramUserId);
      } else {
        // Se non è il proprio profilo ma non abbiamo ID, errore
        throw new Error("ID utente mancante");
      }

      setUserProfile(data);
      return data;
    } catch (err) {
      console.error("Errore nel caricamento del profilo:", err);
      setError("Impossibile caricare il profilo utente");
      return null;
    }
  }, [isOwnProfile, paramUserId]);

  const loadUserArtworks = async (id) => {
    try {
      const { data } = await getAllArtworks({
        artistId: id,
        sortBy: "date",
        limit: 20,
      });
      setArtworks(data || []);
    } catch (err) {
      console.error("Errore nel caricamento delle opere:", err);
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
      console.error("Errore nel caricamento dei follow:", err);
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
        try {
          const me = await getMe();
          const meId = extractId(me);
          setFollowers((prev) =>
            prev.some((f) => extractId(f) === meId) ? prev : [...prev, me]
          );
        } catch {}
      }
    } catch (err) {
      console.error("Errore nell'operazione di follow:", err);
      setError("Impossibile completare l'operazione");
      setIsFollowing((prev) => !prev); // rollback
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────── caricamento iniziale ───────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Carica sempre l'utente corrente per i confronti
        const me = await getMe();
        setCurrentUserId(extractId(me));

        // Carica il profilo target
        const targetUser = await loadUserProfile();
        const targetUserId = extractId(targetUser);

        if (!targetUserId) {
          setLoading(false);
          return;
        }

        // Carica artworks e dati follow
        await Promise.all([
          loadUserArtworks(targetUserId),
          loadFollowData(targetUserId),
        ]);
      } catch (e) {
        console.error("Errore nel caricamento generale:", e);
        setError("Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [paramUserId, isOwnProfile, loadUserProfile]);

  // ─────────────── sync isFollowing con followers ───────────────
  useEffect(() => {
    if (!currentUserId || !userProfile || isOwnProfile) {
      setIsFollowing(false);
      return;
    }

    // Controlla se l'utente corrente sta seguendo il profilo visualizzato
    setIsFollowing(followers.some((f) => extractId(f) === currentUserId));
  }, [followers, currentUserId, userProfile, isOwnProfile]);

  // ─────────────── derived state ───────────────
  const targetUserId = extractId(userProfile);
  const isViewingOwnProfile =
    isOwnProfile || (currentUserId && targetUserId === currentUserId);

  // ─────────────── render ───────────────
  if (loading) {
    return (
      <div className="user-profile">
        <div className="profile-header">
          <div className="loading-placeholder">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile">
        <div className="profile-header">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-profile">
        <div className="profile-header">
          <div className="error-message">Profilo non trovato</div>
        </div>
      </div>
    );
  }

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
      : userProfile.email?.split("@")[0] || "Utente";

  const handleArtworkClick = (id) =>
    onArtworkClick ? onArtworkClick(id) : console.log(`Navigate to ${id}`);

  return (
    <div className="user-profile">
      {/* header */}
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
            <span className="stat-number">{artworks.length}</span> opere
          </span>
        </div>

        <div className="action-buttons">
          {/* Mostra il pulsante follow solo se NON è il proprio profilo */}
          {!isViewingOwnProfile && (
            <button
              onClick={handleFollowToggle}
              disabled={actionLoading}
              className={`follow-btn ${isFollowing ? "following" : ""} ${
                actionLoading ? "loading" : ""
              }`}
            >
              <span className="label-default">
                {actionLoading ? "…" : isFollowing ? "Following" : "Follow"}
              </span>
              {isFollowing && !actionLoading && (
                <span className="label-unfollow">Unfollow</span>
              )}
            </button>
          )}
          <button className="more-btn">
            <FiMoreHorizontal className="icon" />
          </button>
        </div>
      </div>

      {/* artworks */}
      <div className="content-section">
        {artworks.length ? (
          <div className="artworks-grid">
            {artworks.map((a, idx) => (
              <div
                key={a._id}
                className="artwork-item"
                onClick={() => handleArtworkClick(a._id)}
                onKeyDown={(e) =>
                  ["Enter", " "].includes(e.key) && handleArtworkClick(a._id)
                }
                tabIndex={0}
                role="button"
                aria-label={`View artwork: ${a.title}`}
              >
                <div className="artwork-container">
                  {a.linkResource ? (
                    <img
                      src={a.linkResource}
                      alt={a.title}
                      className="artwork-image"
                      style={{ height: `${280 + (idx % 3) * 80}px` }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML = `<div class="artwork-placeholder">${a.title}</div>`;
                      }}
                    />
                  ) : (
                    <div
                      className="artwork-placeholder"
                      style={{ height: `${280 + (idx % 3) * 80}px` }}
                    >
                      {a.title}
                    </div>
                  )}
                  <div className="artwork-overlay">
                    <h3 className="artwork-title">{a.title}</h3>
                    {a.medium && <p className="artwork-medium">{a.medium}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {isViewingOwnProfile
                ? "Non hai ancora caricato nessuna opera."
                : "Questo utente non ha ancora caricato opere."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
