import { useState, useEffect, useCallback, useRef } from "react";
import "./Gallery.css";
import Card from "../Card/Card";
import {
  searchArtworks,
  getMultipleArtworksProgressive,
  POPULAR_QUERIES,
} from "../../api/metApiReq";

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

  // Stati per caricamento progressivo
  const [progressiveLoading, setProgressiveLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  // Ref per cancellare richieste in corso
  const currentRequestRef = useRef(null);
  // Ref per salvare gli objectIds della ricerca corrente
  const currentSearchResultsRef = useRef([]);

  // Callback per il progresso del caricamento
  const handleProgress = useCallback((progressData) => {
    const { totalBatches, batchNumber, batch, progress, resultCount } =
      progressData;

    setLoadingProgress(Math.round(progress * 100));
    setTotalBatches(totalBatches);
    setCurrentBatch(batchNumber);

    if (batch && batch.length > 0) {
      setImages((prevImages) => {
        const existingIds = new Set(prevImages.map((img) => img.id));
        const newImages = batch.filter((img) => !existingIds.has(img.id));
        return [...prevImages, ...newImages];
      });
    }

    console.log(
      `Progress: ${Math.round(
        progress * 100
      )}% - Batch ${batchNumber}/${totalBatches} - Results: ${resultCount}`
    );
  }, []);

  // Funzione per caricare le opere d'arte con caricamento progressivo
  const loadArtworksProgressive = useCallback(
    async (query, reset = false, limit = 20) => {
      // requestRef visibile in try/catch/finally
      let requestRef = { cancelled: false };

      // Cancella richiesta precedente se esiste
      if (currentRequestRef.current) {
        currentRequestRef.current.cancelled = true;
        console.log("Cancelling previous request");
      }
      currentRequestRef.current = requestRef;

      try {
        let currentOffset;
        let objectIds;

        if (reset) {
          setLoading(true);
          setError(null);
          setImages([]);
          setProgressiveLoading(true);
          setLoadingProgress(0);
          setCurrentBatch(0);
          setTotalBatches(0);
          setOffset(0);
          currentOffset = 0;

          console.log(`Searching for: "${query}"`);
          objectIds = await searchArtworks(query);
          currentSearchResultsRef.current = objectIds || [];
        } else {
          setLoadingMore(true);
          setProgressiveLoading(true);
          currentOffset = offset;
          objectIds = currentSearchResultsRef.current;
        }

        if (requestRef.cancelled) {
          console.log("Request was cancelled after search");
          return;
        }

        if (!objectIds || objectIds.length === 0) {
          if (reset) {
            setImages([]);
            setTotalResults(0);
            setHasMore(false);
          }
          setProgressiveLoading(false);
          setLoadingProgress(0);
          return;
        }

        const paginatedIds = objectIds.slice(
          currentOffset,
          currentOffset + limit
        );

        if (reset) {
          setTotalResults(objectIds.length);
        }

        setHasMore(currentOffset + limit < objectIds.length);

        console.log(`Loading ${paginatedIds.length} artworks progressively...`);

        await getMultipleArtworksProgressive(
          paginatedIds,
          (progressData) => {
            if (requestRef.cancelled) {
              console.log("Request was cancelled during progress");
              return;
            }
            handleProgress(progressData);
          },
          { batchSize: 3, priority: "normal" }
        );

        if (requestRef.cancelled) {
          console.log("Request was cancelled after completion");
          return;
        }

        setOffset(currentOffset + limit);
        console.log(
          `Progressive loading completed: loaded ${paginatedIds.length} IDs`
        );
      } catch (err) {
        if (!requestRef.cancelled) {
          console.error("Error loading artworks:", err);
          setError(err.message || "Failed to load artworks");
        }
      } finally {
        if (!requestRef.cancelled) {
          setLoading(false);
          setLoadingMore(false);
          setProgressiveLoading(false);
          setLoadingProgress(0);
        }
        if (currentRequestRef.current === requestRef) {
          currentRequestRef.current = null;
        }
      }
    },
    [offset, handleProgress]
  );

  // Carica le opere iniziali
  useEffect(() => {
    loadArtworksProgressive(currentQuery, true);
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.cancelled = true;
      }
    };
  }, [currentQuery]);

  const handleCategoryChange = (newQuery) => {
    if (newQuery === currentQuery) return;
    setCurrentQuery(newQuery);
  };

  const loadMore = () => {
    if (!loadingMore && !progressiveLoading && hasMore) {
      loadArtworksProgressive(currentQuery, false);
    }
  };

  const handleLike = (imageId) => {
    setLikedImages((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(imageId)) newLiked.delete(imageId);
      else newLiked.add(imageId);
      return newLiked;
    });
  };

  const retry = () => {
    setError(null);
    loadArtworksProgressive(currentQuery, true);
  };

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <div className="header-content">
          <h1>Metropolitan Museum Gallery</h1>
          <p>Discover amazing artworks from the MET collection</p>
          <div className="category-filters">
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query}
                className={`filter-btn ${
                  currentQuery === query ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(query)}
                disabled={loading || progressiveLoading}
              >
                {query.charAt(0).toUpperCase() + query.slice(1)}
              </button>
            ))}
          </div>
          {totalResults > 0 && (
            <div className="results-info">
              <span>
                Showing {images.length} of {totalResults} artworks
              </span>
              {progressiveLoading && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {totalBatches > 0
                      ? `Loading batch ${currentBatch} of ${totalBatches} (${loadingProgress}%)`
                      : `Loading... (${loadingProgress}%)`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* initial loading, error, gallery grid, load more, no results, end message */}
      {loading && images.length === 0 && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Searching artworks from the Metropolitan Museum...</p>
        </div>
      )}

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

      {images.length > 0 && (
        <div className="gallery-content">
          <div className="grid">
            {images.map((image, index) => (
              <Card
                key={image.id}
                image={image}
                isLiked={likedImages.has(image.id)}
                onLike={handleLike}
                className={`card-appear card-delay-${index % 6}`}
              />
            ))}
          </div>
          {progressiveLoading && (
            <div className="progressive-loading-indicator">
              <div className="loading-dots">
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
              <p>Loading more artworks...</p>
            </div>
          )}
        </div>
      )}

      {!loading && !progressiveLoading && images.length === 0 && (
        <div className="no-results">
          <h3>No artworks found</h3>
          <p>Try searching for a different category</p>
        </div>
      )}

      {!loading && images.length > 0 && hasMore && !progressiveLoading && (
        <div className="load-more-container">
          <button
            onClick={loadMore}
            disabled={loadingMore || progressiveLoading}
            className="load-more-btn"
          >
            {loadingMore ? (
              <>
                <div className="small-spinner" /> Loading more...
              </>
            ) : (
              "Load More Artworks"
            )}
          </button>
        </div>
      )}

      {!loading && !progressiveLoading && images.length > 0 && !hasMore && (
        <div className="end-message">
          <p>You've seen all artworks for "{currentQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default Gallery;
