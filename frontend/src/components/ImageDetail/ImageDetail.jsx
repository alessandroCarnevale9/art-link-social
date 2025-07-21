import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import "./ImageDetail.css";

const ImageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, favorites, dispatch } = useContext(AuthContext);

  const [image, setImage] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1) Prendo i dettagli dell'immagine
        const resImg = await fetch(`/api/artworks/${id}`);
        if (!resImg.ok) throw new Error("Impossibile caricare l'immagine");
        const data = await resImg.json();
        setImage(data);
        setLikesCount(data.favoritesCount);
        setIsLiked(favorites.has(data.externalId));

        // 2) Prendo i commenti RAW
        const rawComments = await getComments(data._id);

        // Se i commenti arrivano già popolati con author.username
        const enrichedComments = rawComments.map((c) => ({
          ...c,
          // Preservo authorId per il controllo di ownership
          authorId: c.author?._id || c.authorId,
          author: {
            username:
              c.author?.userData?.firstName ||
              c.author?.firstName ||
              c.author?.username ||
              "Unknown",
          },
        }));

        // Ordina i commenti per data (più recenti prima)
        enrichedComments.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setComments(enrichedComments);
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, favorites]);

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const extId = image.externalId;
    const wasLiked = favorites.has(extId);

    // Aggiorna immediatamente la UI
    const nextFavorites = new Set(favorites);
    if (wasLiked) {
      nextFavorites.delete(extId);
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      nextFavorites.add(extId);
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }

    dispatch({ type: "SET_FAVORITES", payload: nextFavorites });

    try {
      const { artwork } = await importMetArtwork(extId);
      if (wasLiked) {
        await removeFavorite(artwork._id);
      } else {
        await addFavorite(artwork._id);
      }
    } catch (err) {
      console.error(err);

      // Rollback in caso di errore
      if (wasLiked) {
        favorites.add(extId);
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      } else {
        favorites.delete(extId);
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      }
      dispatch({ type: "SET_FAVORITES", payload: favorites });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const created = await addComment(image._id, {
        text: newComment.trim(),
      });

      // Crea il nuovo commento arricchito
      const newCommentObj = {
        ...created,
        authorId: user.userData.id,
        author: { username: user.userData.firstName },
      };

      // Aggiungi il nuovo commento in CIMA alla lista (non in fondo)
      setComments((prev) => [newCommentObj, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo commento?"))
      return;
    try {
      await deleteComment(image._id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Impossibile eliminare il commento:", err);
      alert("Errore durante l'eliminazione del commento.");
    }
  };

  if (loading || !image) {
    return <div className="loading">Caricamento…</div>;
  }

  return (
    <div className="image-detail-container">
      <div className="image-detail-content">
        {/* Header */}
        <div className="detail-header">
          <div className="user-info">
            <div className="user-avatar">
              <span>{user?.userData.firstName?.[0].toUpperCase() || "U"}</span>
            </div>
            <span className="username">
              {user?.userData.firstName || "Guest"}
            </span>
          </div>
          <button className="more-options">
            <BiDotsHorizontalRounded />
          </button>
        </div>

        {/* Immagine */}
        <div className="main-image-container">
          <img
            src={image.linkResource}
            alt={image.title}
            className="main-image"
          />
          <button className="expand-button" title="Espandi">
            <FaExpand />
          </button>
        </div>

        {/* Azioni */}
        <div className="action-bar">
          <div className="action-group">
            <button
              className={`action-button like-btn ${isLiked ? "liked" : ""}`}
              onClick={handleLike}
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />}
              <span>{likesCount}</span>
            </button>
            <button className="action-button">
              <FaComment />
              <span>{comments.length}</span>
            </button>
            <button className="action-button">
              <FaShare />
            </button>
          </div>
        </div>

        {/* Info immagine */}
        <div className="image-info">
          <h1>{image.title}</h1>
          {image.description && <p>{image.description}</p>}
        </div>

        {/* Commenti */}
        <div className="comments-section">
          <h3>Commenti</h3>
          {comments.length === 0 ? (
            <p className="no-comments">Nessun commento ancora</p>
          ) : (
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c._id} className="comment">
                  <div className="comment-avatar">
                    <span>{c.author.username?.[0].toUpperCase() || "U"}</span>
                  </div>
                  <div className="comment-content">
                    <div className="comment-author">{c.author.username}</div>
                    <div className="comment-text">{c.text}</div>
                    <div className="comment-time">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {/* mostra il pulsante di delete solo all'autore */}
                  {user && c.authorId === user.userData.id && (
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteComment(c._id)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="comment-form">
            <div className="form-row">
              <div className="user-avatar small">
                <span>
                  {user?.userData.firstName?.[0].toUpperCase() || "U"}
                </span>
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Aggiungi un commento"
                className="comment-input"
              />
              <button
                type="submit"
                className="send-button"
                disabled={!newComment.trim()}
              >
                Invia
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImageDetail;
