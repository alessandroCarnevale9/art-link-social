import { FaHeart, FaRegHeart } from "react-icons/fa";
import './Card.css';

const Card = ({ image, isLiked, onLike }) => {
  return (
    <div className="card">
      <div className="image-container">
        <img src={image.src} alt={image.alt} loading="lazy" />
        <div className="overlay">
          <button
            className={`like-button ${isLiked ? "liked" : ""}`}
            onClick={() => onLike(image.id)}
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
