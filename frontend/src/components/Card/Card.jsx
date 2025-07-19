import { FaHeart, FaRegHeart, FaInfoCircle } from "react-icons/fa";
import { useState } from "react";
import "./Card.css";

const Card = ({ image, isLiked, onLike }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="card">
      <div className="image-container">
        <img src={image.src} alt={image.alt} loading="lazy" />
        <div className="overlay">
          <div className="button-group">
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

            {(image.artist || image.date || image.culture) && (
              <button
                className="info-button"
                onClick={() => setShowInfo(!showInfo)}
                title="Show artwork details"
              >
                <FaInfoCircle className="info-icon" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-info">
        <h3>{image.title}</h3>

        {/* Informazioni base sempre visibili */}
        {image.artist && <p className="artist-name">{image.artist}</p>}

        {image.date && <p className="artwork-date">{image.date}</p>}

        {/* Informazioni aggiuntive espandibili */}
        {showInfo && (
          <div className="expanded-info">
            {image.culture && (
              <p className="culture">
                <strong>Culture:</strong> {image.culture}
              </p>
            )}
            {image.medium && (
              <p className="medium">
                <strong>Medium:</strong> {image.medium}
              </p>
            )}
            {image.department && (
              <p className="department">
                <strong>Department:</strong> {image.department}
              </p>
            )}
            {image.dimensions && (
              <p className="dimensions">
                <strong>Dimensions:</strong> {image.dimensions}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
