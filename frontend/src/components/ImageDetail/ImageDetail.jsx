import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaExpand,
  FaTrash,
} from "react-icons/fa";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { AuthContext } from "../../context/AuthContext";
import { getComments, addComment, deleteComment } from "../../api/comments";
import { importMetArtwork } from "../../api/localApiReq";
import { addFavorite, removeFavorite } from "../../api/favorites";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./ImageDetail.css";

const ImageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, favorites, dispatch } = useContext(AuthContext);

  const [image, setImage] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Calcola isLiked dinamicamente
  const isLiked = image && favorites.has(image.externalId);

  /**
   * Carica l'artwork e i commenti
   */
  const loadArtwork = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Fetch artwork
      let res = await fetch(`/api/artworks/${id}`);
      let data;
      if (res.status === 404) {
        // Importa dal MET se non in DB
        const imported = await importMetArtwork(id);
        data = imported.artwork;
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      } else {
        data = await res.json();
      }

      // 2) Aggiorna stato
      setImage(data);
      setLikesCount(data.favoritesCount);

      // 3) Carica commenti
      const rawComments = await getComments(data._id);
      const enriched = rawComments
        .map((c) => ({
          ...c,
          authorId: c.author?._id || c.authorId,
          author: {
            username:
              c.author?.userData?.firstName || c.author?.username || "Unknown",
          },
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setComments(enriched);
    } catch (err) {
      console.error("Error loading artwork:", err);
      setError("Unable to load image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtwork();
  }, [id]);

  // ------------------- GESTIONE LIKE -------------------
  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const extId = image.externalId;
    const wasLiked = isLiked;
    const prevCount = likesCount;
    const prevFavorites = new Set(favorites);

    // Optimistic UI update
    const nextFavorites = new Set(favorites);
    if (wasLiked) {
      nextFavorites.delete(extId);
      setLikesCount(prevCount - 1);
    } else {
      nextFavorites.add(extId);
      setLikesCount(prevCount + 1);
    }
    dispatch({ type: "SET_FAVORITES", payload: nextFavorites });

    try {
      // Passiamo SOLO artwork._id, l'API usa sempre /users/me/...
      const result = wasLiked
        ? await removeFavorite(image._id)
        : await addFavorite(image._id);

      // Aggiorna con il conteggio reale dal server
      setLikesCount(result.favoritesCount);
    } catch (err) {
      console.error("Like error:", err);
      // Rollback in caso di errore
      setLikesCount(prevCount);
      dispatch({ type: "SET_FAVORITES", payload: prevFavorites });
    }
  };

  // ------------------- GESTIONE COMMENTI -------------------
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) return navigate("/login");

    try {
      const created = await addComment(image._id, { text: newComment.trim() });
      const newC = {
        ...created,
        authorId: user.userData.id,
        author: {
          username: user.userData.firstName || user.userData.username,
        },
      };
      setComments((prev) => [newC, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment(image._id, commentToDelete);
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete));
    } catch (err) {
      console.error("Delete comment error:", err);
    } finally {
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
  };

  // ------------------- RENDER -------------------
  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!image) return <div className="error">Artwork not found</div>;

  return (
    <div className="image-detail-container">
      <div className="image-detail-content">
        {/* Header */}
        <div className="detail-header">
          <div className="user-info">
            <span className="username">
              Artist: {image.artistDisplayName || "Unknown artist"}
            </span>
            <button className="more-options" disabled>
              <BiDotsHorizontalRounded />
            </button>
          </div>
        </div>

        {/* Immagine principale */}
        <div className="main-image-container">
          <img
            src={image.primaryImage || "/placeholder.jpg"}
            alt={image.title}
            className="main-image"
            onError={(e) => {
              e.target.src = "/placeholder.jpg";
              e.target.alt = "Placeholder image";
            }}
          />
          <button className="expand-button" title="Expand" disabled>
            <FaExpand />
          </button>
        </div>

        {/* Action bar */}
        <div className="action-bar">
          <div className="action-group">
            <button
              className={`action-button like-btn ${isLiked ? "liked" : ""}`}
              onClick={handleLike}
              aria-label={
                isLiked ? "Remove from favorites" : "Add to favorites"
              }
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />}
              <span>{likesCount}</span>
            </button>
            <button className="action-button" aria-label="Comments" disabled>
              <FaComment />
              <span>{comments.length}</span>
            </button>
            <button className="action-button" aria-label="Share" disabled>
              <FaShare />
            </button>
          </div>
        </div>

        {/* Info immagine */}
        <div className="image-info">
          <h1>{image.title}</h1>
          {image.description ? (
            <p>{image.description}</p>
          ) : image.tags?.length ? (
            <p>{image.tags.join(", ")}</p>
          ) : null}
        </div>

        {/* Commenti */}
        <div className="comments-section">
          <h3>Comments</h3>
          {comments.length === 0 ? (
            <p className="no-comments">No comments yet</p>
          ) : (
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c._id} className="comment">
                  <Link
                    to={`/profile/${c.authorId}`}
                    className="comment-avatar-link"
                    draggable="false"
                  >
                    <div className="comment-avatar">
                      <span>{c.author.username[0]?.toUpperCase() || "U"}</span>
                    </div>
                  </Link>
                  <div className="comment-content">
                    <Link
                      to={`/profile/${c.authorId}`}
                      className="comment-author-link"
                    >
                      <div className="comment-author">{c.author.username}</div>
                    </Link>
                    <div className="comment-text">{c.text}</div>
                    <div className="comment-time">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {user && c.authorId === user.userData.id && (
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteComment(c._id)}
                      aria-label="Delete comment"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form nuovo commento */}
          <form onSubmit={handleAddComment} className="comment-form">
            <div className="form-row">
              <div className="user-avatar small">
                <Link
                  to={`/profile/${user?.userData.id}`}
                  className="user-avatar-link"
                  draggable="false"
                >
                  <span>
                    {user?.userData.firstName?.[0]?.toUpperCase() ||
                      user?.userData.username?.[0]?.toUpperCase() ||
                      "U"}
                  </span>
                </Link>
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment"
                className="comment-input"
              />
              <button
                type="submit"
                className="send-button"
                disabled={!newComment.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal conferma cancellazione */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ImageDetail;
