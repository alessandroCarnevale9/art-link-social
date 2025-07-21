// src/components/Card/Card.jsx
import { FaHeart, FaRegHeart, FaFlag } from "react-icons/fa";
import "./Card.css";

const Card = ({ image, isLiked, onLike, /* onReport, */ className = "" }) => {
  return (
    <div className={`card ${className}`}>
      <div className="image-container">
        <img src={image.src} alt={image.alt} loading="lazy" />

        {/* <button
          className="report-button-fixed"
          onClick={() => onReport(image.id)}
          title="Report this content"
        >
          <FaFlag className="report-icon" />
        </button> */}

        <div className="overlay">
          <button
            className={`like-button ${isLiked ? "liked" : ""}`}
            onClick={() => onLike(image.id)}
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
