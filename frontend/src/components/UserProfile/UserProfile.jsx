import React, { useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import "./UserProfile.css";

const UserProfile = ({ isOwnProfile = false }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data - sostituisci con i tuoi dati reali
  const userProfile = {
    username: "Hilda",
    followers: 421,
    following: 0,
    avatar: "H",
  };

  const artworks = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop",
      title: "Abstract Art 1",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=500&fit=crop",
      title: "Portrait Study",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=300&h=350&fit=crop",
      title: "Gaming Art",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=450&fit=crop",
      title: "Sports Design",
    },
    {
      id: 5,
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=380&fit=crop",
      title: "Character Art",
    },
    {
      id: 6,
      image:
        "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=520&fit=crop",
      title: "Digital Illustration",
    },
    {
      id: 7,
      image:
        "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=300&h=340&fit=crop",
      title: "Concept Art",
    },
    {
      id: 8,
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=480&fit=crop",
      title: "Logo Design",
    },
  ];

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  const handleArtworkClick = (artworkId) => {
    // Naviga alla pagina di dettaglio dell'artwork
    // Esempio: window.location.href = `/artwork/${artworkId}`;
    // Oppure se usi React Router: navigate(`/artwork/${artworkId}`);
    console.log(`Navigating to artwork ${artworkId}`);
  };

  return (
    <div className="user-profile">
      {/* Header */}
      <div className="profile-header">
        <div className="avatar">{userProfile.avatar}</div>
        <h1 className="username">{userProfile.username}</h1>
        <div className="stats">
          <span className="stat-item">
            <span className="stat-number">{userProfile.followers}</span>{" "}
            followers
          </span>
          <span className="stat-item">
            <span className="stat-number">{userProfile.following}</span>{" "}
            following
          </span>
        </div>
        <div className="action-buttons">
          {!isOwnProfile && (
            <button
              onClick={handleFollowToggle}
              className={`follow-btn ${isFollowing ? "following" : ""}`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <button className="more-btn">
            <FiMoreHorizontal className="icon" />
          </button>
        </div>
      </div>

      {/* Artworks Grid */}
      <div className="content-section">
        <div className="artworks-grid">
          {artworks.map((artwork, index) => (
            <div
              key={artwork.id}
              className="artwork-item"
              onClick={() => handleArtworkClick(artwork.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleArtworkClick(artwork.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View artwork: ${artwork.title}`}
            >
              <div className="artwork-container">
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="artwork-image"
                  style={{ height: `${280 + (index % 3) * 80}px` }}
                />
                {/* Overlay semplificato solo per feedback visivo */}
                <div className="artwork-overlay"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
