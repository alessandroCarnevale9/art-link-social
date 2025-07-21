import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Card.css";

const Card = ({ image, isLiked, onLike, className = "" }) => {
  const navigate = useNavigate();

  const handleImageClick = (e) => {
    // Previeni il click se l'utente sta cliccando sul pulsante like
    if (e.target.closest(".like-button")) {
      return;
    }
    navigate(`/image/${image.id}`);
  };

  const handleLike = (e) => {
    e.stopPropagation(); // Previeni la navigazione quando si clicca like
    onLike(image.id);
  };

  return (
    <div className={`card ${className}`} onClick={handleImageClick}>
      <div className="image-container">
        <img src={image.src} alt={image.alt} loading="lazy" />
        <div className="overlay">
          <button
            className={`like-button ${isLiked ? "liked" : ""}`}
            onClick={handleLike}
            title={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            {isLiked ? (
              <FaHeart className="heart-icon filled" />
            ) : (
              <FaRegHeart className="heart-icon" />
            )}
          </button>
        </div>
      </div>
      <div className="card-info">
        <h3>{image.title}</h3>
      </div>
    </div>
  );
};

export default Card;
