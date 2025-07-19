import { useState, useEffect, useCallback } from "react";
import "./Gallery.css";
import Card from "../Card/Card";
import {
  searchAndGetArtworks,
  POPULAR_QUERIES,
} from "../../../services/met_api";

const Gallery = () => {
  const [likedImages, setLikedImages] = useState(new Set());
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("painting");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Funzione per caricare le opere d'arte
  const loadArtworks = useCallback(
    async (query, reset = false) => {
      try {
        const currentOffset = reset ? 0 : offset;

        if (reset) {
          setLoading(true);
          setError(null);
          setImages([]);
        } else {
          setLoadingMore(true);
        }

        const result = await searchAndGetArtworks(query, 20, currentOffset);

        if (reset) {
          setImages(result.artworks);
        } else {
          setImages((prev) => [...prev, ...result.artworks]);
        }

        setHasMore(result.hasMore);
        setTotalResults(result.total);
        setOffset(result.nextOffset || currentOffset + 20);
      } catch (err) {
        console.error("Error loading artworks:", err);
        setError(err.message || "Failed to load artworks");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [offset]
  );

  // Carica le opere iniziali
  useEffect(() => {
    loadArtworks(currentQuery, true);
  }, [currentQuery]);

  // Gestisce il cambio di categoria
  const handleCategoryChange = (newQuery) => {
    setCurrentQuery(newQuery);
    setOffset(0);
  };

  // Gestisce il caricamento di più immagini
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadArtworks(currentQuery, false);
    }
  };

  // Gestisce il like delle immagini
  const handleLike = (imageId) => {
    setLikedImages((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(imageId)) {
        newLiked.delete(imageId);
      } else {
        newLiked.add(imageId);
      }
      return newLiked;
    });
  };

  // Funzione per riprovare in caso di errore
  const retry = () => {
    setError(null);
    loadArtworks(currentQuery, true);
  };

  return (
    <div className="gallery-container">
      {/* Header con filtri */}
      <header className="gallery-header">
        <div className="header-content">
          <h1>Metropolitan Museum Gallery</h1>
          <p>Discover amazing artworks from the MET collection</p>

          {/* Filtri per categoria */}
          <div className="category-filters">
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query}
                className={`filter-btn ${
                  currentQuery === query ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(query)}
                disabled={loading}
              >
                {query.charAt(0).toUpperCase() + query.slice(1)}
              </button>
            ))}
          </div>

          {/* Informazioni sui risultati */}
          {totalResults > 0 && (
            <div className="results-info">
              <span>
                Showing {images.length} of {totalResults} artworks
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Stato di caricamento iniziale */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading artworks from the Metropolitan Museum...</p>
        </div>
      )}

      {/* Stato di errore */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={retry} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Grid delle immagini */}
      {!loading && !error && images.length > 0 && (
        <div className="grid">
          {images.map((image) => (
            <Card
              key={image.id}
              image={image}
              isLiked={likedImages.has(image.id)}
              onLike={handleLike}
            />
          ))}
        </div>
      )}

      {/* Messaggio se non ci sono risultati */}
      {!loading && !error && images.length === 0 && (
        <div className="no-results">
          <h3>No artworks found</h3>
          <p>Try searching for a different category</p>
        </div>
      )}

      {/* Pulsante "Load More" */}
      {!loading && !error && images.length > 0 && hasMore && (
        <div className="load-more-container">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="load-more-btn"
          >
            {loadingMore ? (
              <>
                <div className="small-spinner"></div>
                Loading more...
              </>
            ) : (
              "Load More Artworks"
            )}
          </button>
        </div>
      )}

      {/* Messaggio fine risultati */}
      {!loading && !error && images.length > 0 && !hasMore && (
        <div className="end-message">
          <p>You've seen all artworks for "{currentQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default Gallery;
