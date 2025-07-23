import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaExpand,
  FaTrash,
  FaExclamationTriangle,
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
  const [commentError, setCommentError] = useState(null);
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Calcola isLiked dinamicamente usando externalId se disponibile
  const isLiked = image && favorites.has(image.externalId || image._id);

  /**
   * Carica l'artwork e i commenti
   */
  const loadArtwork = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;

      // Step 1: Prova a cercare nel database interno per _id
      const res = await fetch(`/api/artworks/${id}`);

      if (res.ok) {
        // Trovato nel database interno
        data = await res.json();
        console.log("Found artwork in database:", data);
      } else if (res.status === 404) {
        // Non trovato nel DB interno, prova a importare dal MET usando l'id come externalId
        console.log(
          "Artwork not found in database, importing from MET with externalId:",
          id
        );
        try {
          const imported = await importMetArtwork(id);
          data = imported.artwork;
          console.log("Successfully imported artwork from MET:", data);
        } catch (importError) {
          console.error("Import from MET failed:", importError);
          throw new Error(
            "Artwork not found in database and could not import from MET"
          );
        }
      } else {
        throw new Error(
          `Failed to fetch artwork: ${res.status} ${res.statusText}`
        );
      }

      if (!data) {
        throw new Error("No artwork data available");
      }

      // Aggiorna stato artwork
      setImage(data);
      setLikesCount(data.favoritesCount || 0);

      // Carica commenti usando l'_id del database interno
      if (data._id) {
        await loadComments(data._id);
      } else {
        console.warn("No artwork _id available for comments");
        setComments([]);
      }
    } catch (err) {
      console.error("Error loading artwork:", err);
      setError(err.message || "Unable to load image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carica solo i commenti
   */
  const loadComments = async (artworkId = image?._id) => {
    if (!artworkId) return;

    try {
      const rawComments = await getComments(artworkId);
      console.log("Raw comments:", rawComments);

      const enriched = rawComments
        .map((c) => ({
          ...c,
          authorId: c.author?._id || c.authorId,
          author: {
            username: c.author?.firstName || c.author?.username || "Unknown",
            _id: c.author?._id,
          },
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setComments(enriched);
      console.log("Enriched comments:", enriched);
    } catch (commentError) {
      console.error("Error loading comments:", commentError);
      setComments([]);
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

    const extId = image.externalId || image._id;
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
      const result = wasLiked
        ? await removeFavorite(image._id)
        : await addFavorite(image._id);

      // Aggiorna con il conteggio reale dal server
      setLikesCount(result.favoritesCount || likesCount);
    } catch (err) {
      console.error("Like error:", err);
      // Rollback in caso di errore
      setLikesCount(prevCount);
      dispatch({ type: "SET_FAVORITES", payload: prevFavorites });
      setError("Could not update favorite. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  // ------------------- GESTIONE COMMENTI -------------------
  const handleAddComment = async (e) => {
    e.preventDefault();
    const commentText = newComment.trim();

    console.log("=== STARTING ADD COMMENT ===");
    console.log("Comment text:", commentText);
    console.log("User:", user);
    console.log("Image:", image);
    console.log("Current comments:", comments);

    if (!commentText) {
      console.log("Empty comment text, returning");
      return;
    }

    if (!user) {
      console.log("No user, redirecting to login");
      navigate("/login");
      return;
    }

    if (!image?._id) {
      console.log("No image ID available");
      setCommentError("Cannot add comment: artwork not properly loaded");
      setTimeout(() => setCommentError(null), 3000);
      return;
    }

    setIsAddingComment(true);
    setCommentError(null);

    try {
      console.log("Making API call to addComment...");
      const created = await addComment(image._id, { text: commentText });
      console.log("API Response - Created comment:", created);
      console.log(
        "Created comment structure:",
        JSON.stringify(created, null, 2)
      );

      // Pulisci l'input solo dopo successo
      setNewComment("");

      // Crea il nuovo commento con la struttura corretta
      const newCommentData = {
        _id: created._id || created.id,
        text: created.text || commentText,
        createdAt:
          created.createdAt || created.date || new Date().toISOString(),
        authorId:
          created.author?._id ||
          created.authorId ||
          created.userId ||
          user.userData.id,
        author: {
          username:
            created.author?.firstName ||
            created.author?.username ||
            created.author?.name ||
            user.userData.firstName ||
            user.userData.username ||
            "You",
          _id:
            created.author?._id ||
            created.authorId ||
            created.userId ||
            user.userData.id,
        },
      };

      console.log("Processed comment data:", newCommentData);

      // Aggiungi il commento alla lista
      setComments((prevComments) => {
        console.log("Previous comments:", prevComments);
        const updatedComments = [newCommentData, ...prevComments];
        console.log("Updated comments:", updatedComments);
        return updatedComments;
      });

      console.log("Comment added successfully!");
    } catch (err) {
      console.error("=== ADD COMMENT ERROR ===");
      console.error("Error object:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);

      setCommentError(
        `Could not add comment: ${err.message || "Unknown error"}`
      );
      setTimeout(() => setCommentError(null), 5000);
    } finally {
      setIsAddingComment(false);
      console.log("=== END ADD COMMENT ===");
    }
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete || !image?._id) return;

    const previousComments = [...comments];

    try {
      // Rimuovi immediatamente dalla UI (optimistic update)
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete));

      // Chiama l'API
      await deleteComment(image._id, commentToDelete);
    } catch (err) {
      console.error("Delete comment error:", err);

      // Rollback in caso di errore
      setComments(previousComments);

      setCommentError("Could not delete comment. Please try again.");
      setTimeout(() => setCommentError(null), 3000);
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
          {image.medium && (
            <p>
              <strong>Medium:</strong> {image.medium}
            </p>
          )}
          {image.dimensions && (
            <p>
              <strong>Dimensions:</strong> {image.dimensions}
            </p>
          )}
          {image.objectDate && (
            <p>
              <strong>Date:</strong> {image.objectDate}
            </p>
          )}
        </div>

        {/* Commenti */}
        <div className="comments-section">
          <h3>Comments</h3>

          {/* Errore commenti */}
          {commentError && (
            <div className="error-message">
              <FaExclamationTriangle />
              <span>{commentError}</span>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="no-comments">No comments yet</p>
          ) : (
            <div className="comments-list">
              {comments.map((c) => (
                <div
                  key={c._id}
                  className={`comment ${c.isTemporary ? "temporary" : ""}`}
                >
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
                      <div className="comment-author">
                        {c.author.username}
                        {c.isTemporary && (
                          <span className="sending-indicator">
                            {" "}
                            (sending...)
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="comment-text">{c.text}</div>
                    <div className="comment-time">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {user &&
                    c.authorId === user.userData.id &&
                    !c.isTemporary && (
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
          {user && (
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
                  disabled={isAddingComment}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!newComment.trim() || isAddingComment}
                >
                  {isAddingComment ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          )}
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
